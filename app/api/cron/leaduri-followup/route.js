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

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    // Verificarea secretului de cron (la fel ca celelalte cron-uri)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
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
    const deAnuntat = scadente.filter(
      (l) => !l.followUpNotificatLa || l.followUpNotificatLa < l.nextFollowUpAt
    )

    if (!deAnuntat.length) {
      return NextResponse.json({ ok: true, trimise: 0, mesaj: 'Nimic scadent' })
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
      ok: true,
      trimise: trimis ? deAnuntat.length : 0,
      telegramConfigurat: trimis,
      restante: pregatite.filter((l) => l.restant).length,
      azi: pregatite.filter((l) => !l.restant).length,
    })
  } catch (error) {
    console.error('Eroare la cron-ul de follow-up leaduri:', error)
    return NextResponse.json({ error: 'Cron eșuat' }, { status: 500 })
  }
}
