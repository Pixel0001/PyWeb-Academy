/**
 * GET /api/cron/leaduri-followup
 *
 * Memento pe Telegram pentru firmele care trebuie recontactate.
 * Rulează din Vercel Cron (vezi vercel.json) — implicit la fiecare oră,
 * în intervalul de lucru.
 *
 * Trimite UN SINGUR mesaj cu toate firmele scadente, nu unul per firmă.
 * Fiecare firmă e notificată o singură dată per programare: după trimitere
 * marcăm `followUpNotificatLa`, iar data următoare o notificăm doar dacă
 * `nextFollowUpAt` s-a mutat între timp.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { notifyLeaduriFollowUp } from '@/lib/telegram'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    // Două căi de intrare: Vercel Cron (cu secret) sau un admin logat care
    // apasă „testează" din pagină. A doua e importantă — fără ea, singurul mod
    // de a afla dacă Telegram e configurat corect e să aștepți ora următoare.
    const authHeader = request.headers.get('authorization')
    const esteCron = authHeader === `Bearer ${process.env.CRON_SECRET}`

    let esteAdmin = false
    if (!esteCron) {
      const utilizator = await getCurrentUser().catch(() => null)
      esteAdmin = ['SUPERADMIN', 'ADMIN'].includes(utilizator?.role)
    }

    if (!esteCron && !esteAdmin && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // La test forțăm trimiterea chiar dacă am mai anunțat deja firmele astea.
    const { searchParams } = new URL(request.url)
    const forteaza = esteAdmin && searchParams.get('forteaza') === '1'

    // Telegram configurat? Dacă nu, spunem asta explicit, nu tăcem.
    const telegramConfigurat = Boolean(
      process.env.TELEGRAM_LESSONS_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID
    )
    if (!telegramConfigurat) {
      return NextResponse.json(
        {
          ok: false,
          trimise: 0,
          eroare:
            'Telegram nu e configurat: lipsește TELEGRAM_LESSONS_BOT_TOKEN sau TELEGRAM_ADMIN_CHAT_ID din variabilele de mediu.',
        },
        { status: esteAdmin ? 200 : 500 }
      )
    }

    const acum = new Date()
    const sfarsitulZilei = new Date(acum)
    sfarsitulZilei.setHours(23, 59, 59, 999)

    // Firmele scadente: au follow-up până la finalul zilei de azi și n-au fost
    // încă anunțate pentru programarea curentă.
    const scadente = await prisma.webLead.findMany({
      where: {
        nextFollowUpAt: { not: null, lte: sfarsitulZilei },
        status: { notIn: ['REFUZ', 'NU_MA_SUNA'] },
      },
      orderBy: [{ nextFollowUpAt: 'asc' }],
      select: {
        id: true,
        denumire: true,
        telefon: true,
        scor: true,
        oras: true,
        calitateSite: true,
        nextFollowUpAt: true,
        followUpNotificatLa: true,
      },
    })

    // Sar peste cele deja anunțate DUPĂ ce s-a stabilit programarea curentă.
    const deAnuntat = forteaza
      ? scadente
      : scadente.filter((l) => !l.followUpNotificatLa || l.followUpNotificatLa < l.nextFollowUpAt)

    if (!deAnuntat.length) {
      return NextResponse.json({
        ok: true,
        trimise: 0,
        scadenteGasite: scadente.length,
        mesaj: scadente.length
          ? `${scadente.length} firme sunt scadente, dar au fost deja anunțate. Folosește „forțează" ca să retrimiți.`
          : 'Nicio firmă scadentă: nimeni n-are recontactare setată pentru azi sau mai devreme.',
      })
    }

    const pregatite = deAnuntat.map((l) => ({
      ...l,
      restant: new Date(l.nextFollowUpAt) < acum,
    }))

    const trimis = await notifyLeaduriFollowUp(pregatite)

    // Marcăm doar dacă mesajul chiar a plecat — altfel reîncercăm la ora următoare.
    if (trimis) {
      await prisma.webLead.updateMany({
        where: { id: { in: deAnuntat.map((l) => l.id) } },
        data: { followUpNotificatLa: acum },
      })
    }

    return NextResponse.json({
      ok: Boolean(trimis),
      trimise: trimis ? deAnuntat.length : 0,
      eroare: trimis
        ? null
        : 'Telegram a refuzat mesajul — verifică dacă botul are acces la chat-ul din TELEGRAM_ADMIN_CHAT_ID.',
      firme: deAnuntat.map((l) => l.denumire),
      restante: pregatite.filter((l) => l.restant).length,
      azi: pregatite.filter((l) => !l.restant).length,
    })
  } catch (error) {
    console.error('Eroare la cron-ul de follow-up leaduri:', error)
    return NextResponse.json({ error: 'Cron eșuat' }, { status: 500 })
  }
}
