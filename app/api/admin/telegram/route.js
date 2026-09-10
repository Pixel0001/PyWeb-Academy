/**
 * Conectarea contului propriu la botul de Telegram.
 *
 *   GET    — starea mea: sunt legat? cu ce cont de Telegram?
 *   POST   — generează un cod de unică folosință și linkul către bot
 *   DELETE — rupe legătura
 *
 * Cum funcționează: codul e valabil 15 minute și se consumă la prima folosire.
 * Omul apasă linkul, Telegram deschide botul cu `/start <cod>`, iar webhook-ul
 * salvează chat-ul pe contul lui. Nimeni nu trebuie să copieze vreun chat ID
 * de mână, și nimeni nu poate lega contul altcuiva fără codul lui.
 */

import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MINUTE_VALABILITATE = 15

/** Numele botului, ca să putem construi linkul t.me/... */
async function numeBot() {
  const token = process.env.TELEGRAM_LESSONS_BOT_TOKEN
  if (!token) return null

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const d = await r.json()
    return d?.ok ? d.result?.username || null : null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const sesiune = await requireAuth()

    const utilizator = await prisma.user.findUnique({
      where: { id: sesiune.id },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramLegatLa: true,
      },
    })

    return NextResponse.json({
      legat: Boolean(utilizator?.telegramChatId),
      username: utilizator?.telegramUsername || null,
      legatLa: utilizator?.telegramLegatLa || null,
      botConfigurat: Boolean(process.env.TELEGRAM_LESSONS_BOT_TOKEN),
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Eroare' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const sesiune = await requireAuth()

    if (!process.env.TELEGRAM_LESSONS_BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Botul nu e configurat: lipsește TELEGRAM_LESSONS_BOT_TOKEN.' },
        { status: 400 }
      )
    }

    const bot = await numeBot()
    if (!bot) {
      return NextResponse.json(
        { error: 'Nu am putut citi datele botului — verifică dacă tokenul e valid.' },
        { status: 400 }
      )
    }

    // Cod scurt, dar imposibil de ghicit prin încercări în 15 minute.
    const cod = randomBytes(9).toString('base64url')
    const expiraLa = new Date(Date.now() + MINUTE_VALABILITATE * 60 * 1000)

    await prisma.user.update({
      where: { id: sesiune.id },
      data: { telegramCod: cod, telegramCodExpiraLa: expiraLa },
    })

    return NextResponse.json({
      link: `https://t.me/${bot}?start=${cod}`,
      bot,
      expiraLa,
      minute: MINUTE_VALABILITATE,
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la generarea codului Telegram:', error)
    return NextResponse.json({ error: 'Nu am putut genera codul' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const sesiune = await requireAuth()

    await prisma.user.update({
      where: { id: sesiune.id },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramLegatLa: null,
        telegramCod: null,
        telegramCodExpiraLa: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Nu am putut deconecta' }, { status: 500 })
  }
}
