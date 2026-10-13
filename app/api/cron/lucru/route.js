/**
 * GET /api/cron/lucru — rulează la fiecare 10 minute (vercel.json sau cron-job.org).
 *
 *  1. reamintirile periodice ale taskurilor („la fiecare 3 ore până termini")
 *  2. taskurile cu termenul depășit (o singură notificare per termen)
 *  3. reminderele programărilor (cu o zi înainte la 08:00, cu 3 ore înainte…)
 *
 * Toate merg pe Telegram, în privat, doar către echipă.
 * Acces: `Authorization: Bearer CRON_SECRET`, `?secret=CRON_SECRET` sau un admin logat.
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { verificaReamintiri, verificaIntarzieri } from '@/lib/lucru/taskuri'
import { trimiteRemindereProgramari } from '@/lib/lucru/programari'
import { telegramConfigurat } from '@/lib/lucru/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function autorizat(request) {
  const secret = process.env.CRON_SECRET
  const antet = request.headers.get('authorization')
  const link = new URL(request.url).searchParams.get('secret')
  if (secret && (antet === `Bearer ${secret}` || link === secret)) return true
  const u = await getCurrentUser().catch(() => null)
  return ['SUPERADMIN', 'ADMIN'].includes(u?.role)
}

async function ruleaza(request) {
  if (!(await autorizat(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!telegramConfigurat()) {
    return NextResponse.json({ ok: false, eroare: 'Lipsește TELEGRAM_LESSONS_BOT_TOKEN — nu am pe unde trimite.' })
  }

  const acum = new Date()
  const rezultat = { ok: true, la: acum.toISOString() }
  // Fiecare parte separat: dacă una cade, celelalte tot rulează
  for (const [nume, fn] of [
    ['reamintiri', verificaReamintiri],
    ['intarzieri', verificaIntarzieri],
    ['programari', trimiteRemindereProgramari],
  ]) {
    try {
      rezultat[nume] = await fn(acum)
    } catch (e) {
      console.error(`[cron/lucru] ${nume}:`, e)
      rezultat[nume] = { eroare: e?.message || 'eroare' }
      rezultat.ok = false
    }
  }
  return NextResponse.json(rezultat)
}

export const GET = ruleaza
export const POST = ruleaza
