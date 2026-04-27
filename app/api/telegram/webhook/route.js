import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const BOT_TOKEN = process.env.TELEGRAM_LESSONS_BOT_TOKEN
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

const STATUS_LABELS = {
  LEAD: '🔵 Pending',
  CONTACTAT: '🟡 Contactat',
  PROGRAMAT: '🟠 Programat',
  FINALIZAT_LECTIA: '🎓 Finalizat',
  ASTEPTAM_PLATA: '⏳ Așteptăm Plata',
  PLATIT: '💰 Achitat',
  LOST_LEAD: '❌ Anulat',
}

// Statusuri finale — butoanele dispar
const FINAL_STATUSES = ['PLATIT', 'LOST_LEAD']

function buildKeyboard(contactId) {
  return [
    [
      { text: '✅ Contactat', callback_data: `c:CONTACTAT:${contactId}` },
      { text: '📅 Programat', callback_data: `c:PROGRAMAT:${contactId}` },
    ],
    [
      { text: '🎓 Finalizat', callback_data: `c:FINALIZAT_LECTIA:${contactId}` },
      { text: '⏳ Așteptăm', callback_data: `c:ASTEPTAM_PLATA:${contactId}` },
    ],
    [
      { text: '💰 Achitat', callback_data: `c:PLATIT:${contactId}` },
      { text: '❌ Anulat', callback_data: `c:LOST_LEAD:${contactId}` },
    ],
  ]
}

async function answerCallback(callbackQueryId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

async function editMessage(chatId, messageId, text, keyboard) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined,
    }),
  })
}

// ============================================
// HANDLERS PENTRU LECȚII NEEFECTUATE
// ============================================

/** Construiește mesajul + tastatura pentru marcarea prezenței la o lecție */
async function buildAttendanceView(sessionId) {
  const session = await prisma.lessonSession.findUnique({
    where: { id: sessionId },
    include: {
      group: { include: { course: { select: { title: true } }, teacher: { select: { name: true } } } },
      attendances: true,
    },
  })
  if (!session) return null

  // Obține toți elevii activi din grupă
  const groupStudents = await prisma.groupStudent.findMany({
    where: { groupId: session.groupId, status: { notIn: ['LEFT', 'TRANSFERRED'] } },
    include: { student: { select: { id: true, fullName: true } } },
  })

  const attendanceMap = new Map(session.attendances.map(a => [a.studentId, a.status]))

  const dateStr = new Date(session.date).toLocaleString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Chisinau',
  })

  let presentCount = 0
  let absentCount = 0
  const lines = groupStudents.map(gs => {
    const status = attendanceMap.get(gs.studentId) || 'PRESENT'
    if (status === 'PRESENT') { presentCount++; return `✅ ${gs.student.fullName}` }
    absentCount++; return `❌ ${gs.student.fullName}`
  })

  const text = `📝 <b>MARCHEAZĂ PREZENȚA</b>

📚 Grupa: <b>${session.group.name}</b>
🎓 Curs: ${session.group.course.title}
👨‍🏫 Profesor: ${session.group.teacher?.name || 'N/A'}
📅 Data: ${dateStr}

<b>Elevi (${groupStudents.length}):</b>
${lines.join('\n')}

📊 ${presentCount} prezenți / ${absentCount} absenți

<i>Apasă pe nume pentru a comuta prezența.</i>`

  // Tastatură: 1 buton per elev (toggle), apoi rândul de acțiuni globale
  const keyboard = groupStudents.map(gs => {
    const status = attendanceMap.get(gs.studentId) || 'PRESENT'
    const icon = status === 'PRESENT' ? '✅' : '❌'
    // Truncate name dacă e prea lung (Telegram limita 64 bytes pentru button text + callback)
    const name = gs.student.fullName.length > 28 ? gs.student.fullName.slice(0, 27) + '…' : gs.student.fullName
    return [{ text: `${icon} ${name}`, callback_data: `at:${sessionId}:${gs.studentId}` }]
  })

  keyboard.push([
    { text: '✅ Toți prezenți', callback_data: `aa:p:${sessionId}` },
    { text: '❌ Toți absenți', callback_data: `aa:a:${sessionId}` },
  ])
  keyboard.push([
    { text: '💾 Confirmă & Salvează', callback_data: `as:${sessionId}` },
  ])

  return { text, keyboard }
}

export async function POST(request) {
  try {
    // Verificare secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Procesare callback query (apăsare buton)
    if (body.callback_query) {
      const { id: callbackQueryId, data, message } = body.callback_query
      const messageId = message.message_id
      const chatId = message.chat.id

      // ============================================
      // ROUTING: m: (missed lesson), at: (toggle), aa: (all), as: (save)
      // ============================================

      // ── m:y / m:n — răspuns inițial pentru lecție neefectuată ──
      if (data?.startsWith('m:')) {
        const parts = data.split(':')
        if (parts.length !== 3) {
          await answerCallback(callbackQueryId, '❌ Date invalide')
          return NextResponse.json({ ok: true })
        }
        const [, action, missedSessionId] = parts

        const missed = await prisma.missedSession.findUnique({
          where: { id: missedSessionId },
          include: { group: { include: { course: { select: { title: true } }, teacher: { select: { name: true } } } } },
        })
        if (!missed) {
          await answerCallback(callbackQueryId, '❌ Lecția nu a fost găsită')
          return NextResponse.json({ ok: true })
        }

        // ── NU s-a efectuat ──
        if (action === 'n') {
          await prisma.missedSession.update({
            where: { id: missedSessionId },
            data: { acknowledged: true, reason: 'Confirmat ca neefectuată din Telegram' },
          })
          const dateStr = new Date(missed.scheduledDate).toLocaleString('ro-RO', {
            day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Chisinau',
          })
          const finalText = `❌ <b>LECȚIE CONFIRMATĂ NEEFECTUATĂ</b>

📚 Grupa: <b>${missed.group.name}</b>
👨‍🏫 Profesor: ${missed.group.teacher?.name || 'N/A'}
🎓 Curs: ${missed.group.course.title}
📅 ${dateStr} la ${missed.scheduledTime}

⚠️ Marcată ca neefectuată în sistem.`
          await editMessage(chatId, messageId, finalText, null)
          await answerCallback(callbackQueryId, '✅ Marcată ca neefectuată')
          return NextResponse.json({ ok: true })
        }

        // ── S-a efectuat → creează LessonSession + Attendances default PRESENT ──
        if (action === 'y') {
          // Verifică dacă deja există o sesiune pentru acea zi (idempotent)
          const dayStart = new Date(missed.scheduledDate); dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(missed.scheduledDate); dayEnd.setHours(23, 59, 59, 999)
          let lessonSession = await prisma.lessonSession.findFirst({
            where: { groupId: missed.groupId, date: { gte: dayStart, lte: dayEnd } },
          })
          if (!lessonSession) {
            lessonSession = await prisma.lessonSession.create({
              data: { groupId: missed.groupId, date: missed.scheduledDate },
            })
          }

          // Asigură că există attendance default PRESENT pentru fiecare elev activ
          const activeStudents = await prisma.groupStudent.findMany({
            where: { groupId: missed.groupId, status: { notIn: ['LEFT', 'TRANSFERRED'] } },
            select: { studentId: true },
          })
          for (const s of activeStudents) {
            await prisma.attendance.upsert({
              where: { sessionId_studentId: { sessionId: lessonSession.id, studentId: s.studentId } },
              update: {},
              create: { sessionId: lessonSession.id, studentId: s.studentId, status: 'PRESENT' },
            })
          }

          // Marchează MissedSession ca rezolvată
          await prisma.missedSession.update({
            where: { id: missedSessionId },
            data: { acknowledged: true, reason: 'Lecția a fost confirmată ca efectuată din Telegram' },
          })

          const view = await buildAttendanceView(lessonSession.id)
          if (view) await editMessage(chatId, messageId, view.text, view.keyboard)
          await answerCallback(callbackQueryId, '✅ Lecție creată')
          return NextResponse.json({ ok: true })
        }
      }

      // ── at:<sessionId>:<studentId> — toggle prezență individuală ──
      if (data?.startsWith('at:')) {
        const parts = data.split(':')
        if (parts.length !== 3) {
          await answerCallback(callbackQueryId, '❌ Date invalide')
          return NextResponse.json({ ok: true })
        }
        const [, sessionId, studentId] = parts

        const lesson = await prisma.lessonSession.findUnique({ where: { id: sessionId } })
        if (!lesson || lesson.lessonsDeducted) {
          await answerCallback(callbackQueryId, '❌ Sesiune deja salvată')
          return NextResponse.json({ ok: true })
        }

        const existing = await prisma.attendance.findUnique({
          where: { sessionId_studentId: { sessionId, studentId } },
        })
        const newStatus = existing?.status === 'PRESENT' ? 'ABSENT' : 'PRESENT'
        await prisma.attendance.upsert({
          where: { sessionId_studentId: { sessionId, studentId } },
          update: { status: newStatus },
          create: { sessionId, studentId, status: newStatus },
        })

        const view = await buildAttendanceView(sessionId)
        if (view) await editMessage(chatId, messageId, view.text, view.keyboard)
        await answerCallback(callbackQueryId, newStatus === 'PRESENT' ? '✅ Prezent' : '❌ Absent')
        return NextResponse.json({ ok: true })
      }

      // ── aa:p / aa:a — toți prezenți / toți absenți ──
      if (data?.startsWith('aa:')) {
        const parts = data.split(':')
        if (parts.length !== 3) {
          await answerCallback(callbackQueryId, '❌ Date invalide')
          return NextResponse.json({ ok: true })
        }
        const [, mode, sessionId] = parts
        const newStatus = mode === 'p' ? 'PRESENT' : 'ABSENT'

        const lesson = await prisma.lessonSession.findUnique({ where: { id: sessionId } })
        if (!lesson || lesson.lessonsDeducted) {
          await answerCallback(callbackQueryId, '❌ Sesiune deja salvată')
          return NextResponse.json({ ok: true })
        }

        const activeStudents = await prisma.groupStudent.findMany({
          where: { groupId: lesson.groupId, status: { notIn: ['LEFT', 'TRANSFERRED'] } },
          select: { studentId: true },
        })
        for (const s of activeStudents) {
          await prisma.attendance.upsert({
            where: { sessionId_studentId: { sessionId, studentId: s.studentId } },
            update: { status: newStatus },
            create: { sessionId, studentId: s.studentId, status: newStatus },
          })
        }

        const view = await buildAttendanceView(sessionId)
        if (view) await editMessage(chatId, messageId, view.text, view.keyboard)
        await answerCallback(callbackQueryId, newStatus === 'PRESENT' ? '✅ Toți prezenți' : '❌ Toți absenți')
        return NextResponse.json({ ok: true })
      }

      // ── as:<sessionId> — confirmă și deduce lecția ──
      if (data?.startsWith('as:')) {
        const parts = data.split(':')
        if (parts.length !== 2) {
          await answerCallback(callbackQueryId, '❌ Date invalide')
          return NextResponse.json({ ok: true })
        }
        const [, sessionId] = parts

        const lesson = await prisma.lessonSession.findUnique({
          where: { id: sessionId },
          include: {
            group: { include: { course: { select: { title: true } }, teacher: { select: { name: true } } } },
            attendances: true,
          },
        })
        if (!lesson) {
          await answerCallback(callbackQueryId, '❌ Sesiune negăsită')
          return NextResponse.json({ ok: true })
        }
        if (lesson.lessonsDeducted) {
          await answerCallback(callbackQueryId, '⚠️ Deja salvată')
          return NextResponse.json({ ok: true })
        }

        // Deduce lecții pentru prezenți, incrementează absențe pentru absenți
        const activeStudents = await prisma.groupStudent.findMany({
          where: { groupId: lesson.groupId, status: { notIn: ['LEFT', 'TRANSFERRED'] } },
        })
        let presentCount = 0
        let absentCount = 0
        const transactions = []
        for (const att of lesson.attendances) {
          const gs = activeStudents.find(g => g.studentId === att.studentId)
          if (!gs) continue
          if (att.status === 'PRESENT') {
            presentCount++
            await prisma.groupStudent.update({
              where: { id: gs.id },
              data: { lessonsRemaining: { decrement: 1 } },
            })
            transactions.push({
              studentId: att.studentId,
              groupId: lesson.groupId,
              sessionId: lesson.id,
              delta: -1,
              reason: `Lecție prezent (din Telegram) - ${new Date(lesson.date).toLocaleDateString('ro-RO')}`,
            })
          } else {
            absentCount++
            await prisma.groupStudent.update({
              where: { id: gs.id },
              data: { absences: { increment: 1 } },
            })
          }
        }

        if (transactions.length > 0) {
          await prisma.lessonTransaction.createMany({ data: transactions })
        }
        await prisma.lessonSession.update({
          where: { id: sessionId },
          data: { lessonsDeducted: true },
        })

        const dateStr = new Date(lesson.date).toLocaleString('ro-RO', {
          day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Chisinau',
        })
        const finalText = `✅ <b>LECȚIE SALVATĂ</b>

📚 Grupa: <b>${lesson.group.name}</b>
👨‍🏫 Profesor: ${lesson.group.teacher?.name || 'N/A'}
🎓 Curs: ${lesson.group.course.title}
📅 ${dateStr}

📊 Rezultat:
✅ Prezenți: <b>${presentCount}</b> (lecție dedusă)
❌ Absenți: <b>${absentCount}</b> (absență înregistrată)

✔ Lecția a fost înregistrată în sistem.`

        await editMessage(chatId, messageId, finalText, null)
        await answerCallback(callbackQueryId, '✅ Salvată cu succes!')
        return NextResponse.json({ ok: true })
      }

      // ── c: — vechiul handler pentru contact (păstrat) ──
      if (data?.startsWith('c:')) {
      const parts = data.split(':')
      if (parts.length !== 3) {
        await answerCallback(callbackQueryId, '❌ Date invalide')
        return NextResponse.json({ ok: true })
      }

      const [, newStatus, contactId] = parts

      // Validare status
      if (!STATUS_LABELS[newStatus]) {
        await answerCallback(callbackQueryId, '❌ Status invalid')
        return NextResponse.json({ ok: true })
      }

      // Actualizare în baza de date
      let contact
      try {
        contact = await prisma.contactMessage.update({
          where: { id: contactId },
          data: { status: newStatus },
        })
      } catch (dbError) {
        console.error('DB update error:', dbError)
        await answerCallback(callbackQueryId, '❌ Eroare la actualizare')
        return NextResponse.json({ ok: true })
      }

      const newStatusLabel = STATUS_LABELS[newStatus]
      const isFinal = FINAL_STATUSES.includes(newStatus)
      const now = new Date().toLocaleString('ro-RO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Chisinau',
      })

      const isFromSiteForm = contact.email === 'noreply@pyweb.md'
      const emailLine = isFromSiteForm ? '🌐 Sursă: <b>Formular site</b>' : `📧 Email: ${contact.email}`

      // Mesajul actualizat cu noul status
      const updatedText = `📬 <b>CERERE LECȚIE GRATUITĂ</b>

👤 Nume: <b>${contact.name}</b>
${emailLine}
📱 Telefon: <b>${contact.phone || 'N/A'}</b>

📊 Status: ${newStatusLabel}
✏️ Actualizat: ${now}`

      // Dacă status final → butoane dispar; altfel → butoane rămân
      const keyboard = isFinal ? null : buildKeyboard(contactId)

      await editMessage(chatId, messageId, updatedText, keyboard)
      await answerCallback(callbackQueryId, `✅ Status: ${newStatusLabel}`)

      return NextResponse.json({ ok: true })
      } // end if c:

      // Dacă nu a matched nimic
      await answerCallback(callbackQueryId, '❌ Acțiune necunoscută')
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
