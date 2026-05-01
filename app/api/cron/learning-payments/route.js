import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const TELEGRAM_LESSONS_BOT_TOKEN = process.env.TELEGRAM_LESSONS_BOT_TOKEN
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID
const TELEGRAM_LOW_LESSONS_THREAD_ID = process.env.TELEGRAM_LOW_LESSONS_THREAD_ID

async function sendTelegram(message) {
  if (!TELEGRAM_LESSONS_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    console.log('[learning-payments cron] Telegram not configured')
    return false
  }
  try {
    const body = {
      chat_id: TELEGRAM_ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    }
    if (TELEGRAM_LOW_LESSONS_THREAD_ID) body.message_thread_id = parseInt(TELEGRAM_LOW_LESSONS_THREAD_ID)
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_LESSONS_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return !!data.ok
  } catch (e) {
    console.error('[learning-payments cron] telegram error', e)
    return false
  }
}

const fmtDate = d => new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })

export async function GET(request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const in3Days = new Date(now.getTime() + 3 * 86400000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)

    // Toate plățile care expiră în următoarele 3 zile sau au expirat în ultimele 7
    const candidates = await prisma.learningPayment.findMany({
      where: {
        expiresAt: { gte: sevenDaysAgo, lte: in3Days },
      },
      include: { student: { select: { id: true, fullName: true, parentPhone: true, active: true } } },
      orderBy: { expiresAt: 'asc' },
    })

    // Pentru fiecare elev, păstrăm doar cea mai recentă plată
    const latestByStudent = new Map()
    for (const p of candidates) {
      const all = await prisma.learningPayment.findFirst({
        where: { studentId: p.studentId },
        orderBy: { paymentDate: 'desc' },
      })
      if (all && all.id === p.id && p.student.active !== false) {
        latestByStudent.set(p.studentId, p)
      }
    }

    const expiringSoon = []
    const expired = []
    for (const p of latestByStudent.values()) {
      const days = Math.ceil((new Date(p.expiresAt).getTime() - now.getTime()) / 86400000)
      if (days < 0) expired.push({ payment: p, days })
      else expiringSoon.push({ payment: p, days })
    }

    let notificationsSent = 0

    if (expiringSoon.length > 0 || expired.length > 0) {
      let msg = `📅 <b>Abonamente /learn — raport zilnic</b>\n\n`

      if (expired.length > 0) {
        msg += `🔴 <b>EXPIRATE (${expired.length})</b>\n`
        for (const { payment, days } of expired) {
          msg += `• <b>${payment.student.fullName}</b> — expirat de ${Math.abs(days)} zile (${fmtDate(payment.expiresAt)})`
          if (payment.student.parentPhone) msg += ` 📞 ${payment.student.parentPhone}`
          msg += `\n`
        }
        msg += `\n`
      }

      if (expiringSoon.length > 0) {
        msg += `🟡 <b>EXPIRĂ ÎN CURÂND (${expiringSoon.length})</b>\n`
        for (const { payment, days } of expiringSoon) {
          msg += `• <b>${payment.student.fullName}</b> — ${days === 0 ? 'astăzi' : `în ${days} zile`} (${fmtDate(payment.expiresAt)})`
          if (payment.student.parentPhone) msg += ` 📞 ${payment.student.parentPhone}`
          msg += `\n`
        }
      }

      const sent = await sendTelegram(msg)
      if (sent) notificationsSent = 1
    }

    return NextResponse.json({
      ok: true,
      checkedAt: now.toISOString(),
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      notificationsSent,
    })
  } catch (e) {
    console.error('[learning-payments cron] error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
