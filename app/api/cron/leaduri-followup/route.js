/**
 * GET /api/cron/leaduri-followup
 *
 * Memento pe Telegram pentru firmele care trebuie recontactate.
 * Rulează din Vercel Cron (vezi vercel.json), la fiecare sfert de oră în
 * timpul programului.
 *
 * Fiecare responsabil primește DOAR firmele lui, în privat. Firmele fără
 * responsabil merg în chat-ul comun. Fiecare firmă e anunțată o singură dată
 * per programare: după trimitere marcăm `followUpNotificatLa`, iar data
 * următoare o anunțăm doar dacă `nextFollowUpAt` s-a mutat între timp.
 *
 * Poate fi apelată și manual de un admin logat (butonul „Testează notificarea"
 * din pagina de leaduri) — altfel singurul mod de a afla dacă Telegram e
 * configurat corect ar fi să aștepți ora următoare.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { leaduriScadente, trimiteMementouri } from '@/lib/leads/notificare'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request) {
  try {
    // Două căi de intrare: Vercel Cron (cu secret) sau un admin logat.
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

    // La test forțăm trimiterea chiar dacă firmele au fost deja anunțate.
    const { searchParams } = new URL(request.url)
    const forteaza = esteAdmin && searchParams.get('forteaza') === '1'

    if (!process.env.TELEGRAM_LESSONS_BOT_TOKEN) {
      return NextResponse.json(
        {
          ok: false,
          trimise: 0,
          eroare: 'Telegram nu e configurat: lipsește TELEGRAM_LESSONS_BOT_TOKEN.',
        },
        { status: esteAdmin ? 200 : 500 }
      )
    }

    const { toate, deAnuntat } = await leaduriScadente({ forteaza })

    if (!deAnuntat.length) {
      return NextResponse.json({
        ok: true,
        trimise: 0,
        scadenteGasite: toate.length,
        mesaj: toate.length
          ? `${toate.length} firme sunt scadente, dar au fost deja anunțate. Apasă din nou cu „forțează" ca să retrimiți.`
          : 'Nicio firmă scadentă: nimeni n-are recontactare setată pentru azi sau mai devreme.',
      })
    }

    const { trimise, destinatari, esecuri } = await trimiteMementouri(deAnuntat)

    // Marcăm doar dacă mesajul chiar a plecat — altfel reîncercăm data viitoare.
    if (trimise) {
      await prisma.webLead.updateMany({
        where: { id: { in: deAnuntat.map((l) => l.id) } },
        data: { followUpNotificatLa: new Date() },
      })
    }

    return NextResponse.json({
      ok: trimise > 0,
      trimise,
      destinatari,
      eroare: esecuri.length ? esecuri.join('; ') : null,
      firme: deAnuntat.map((l) => l.denumire),
      restante: deAnuntat.filter((l) => l.restant).length,
      azi: deAnuntat.filter((l) => !l.restant).length,
    })
  } catch (error) {
    console.error('Eroare la cron-ul de follow-up leaduri:', error)
    return NextResponse.json({ error: error.message || 'Cron eșuat' }, { status: 500 })
  }
}
