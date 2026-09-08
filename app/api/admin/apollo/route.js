/**
 * GET /api/admin/apollo
 * Starea integrării: cheia, mailbox-urile cu sănătatea lor, secvențele cu
 * statistici, și cât din creditele planului am consumat.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { areCheie, verificaCheia, CONFIG } from '@/lib/apollo/client'
import { listeazaMailboxuri, listeazaSecvente, statisticiSecventa } from '@/lib/apollo/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să vezi Apollo' }, { status: 403 })
    }

    if (!areCheie()) {
      return NextResponse.json({
        areCheie: false,
        eroare: 'APOLLO_API_KEY lipsește din variabilele de mediu.',
        config: CONFIG,
      })
    }

    const { searchParams } = new URL(request.url)
    const cuStatistici = searchParams.get('statistici') !== '0'

    const [cheie, mailboxuri, secvente] = await Promise.all([
      verificaCheia(),
      listeazaMailboxuri().catch((e) => ({ eroare: e.message })),
      listeazaSecvente().catch(() => []),
    ])

    // Statisticile fiecărei secvențe active — un apel per secvență, deci le
    // cerem doar când chiar sunt afișate.
    let secventeCuStatistici = secvente
    if (cuStatistici && Array.isArray(secvente)) {
      secventeCuStatistici = await Promise.all(
        secvente.map(async (s) => {
          try {
            const stat = await statisticiSecventa(s.id)
            return { ...s, statistici: stat }
          } catch {
            return s
          }
        })
      )
    }

    // Creditele: Apollo nu expune soldul, așa că numărăm noi ce am cheltuit
    // de la începutul lunii și comparăm cu planul din config.
    const inceputLuna = new Date()
    inceputLuna.setDate(1)
    inceputLuna.setHours(0, 0, 0, 0)

    const [crediteLuna, totalPersoane, cuEmail] = await Promise.all([
      prisma.apolloPersoana.aggregate({
        where: { enrichedLa: { gte: inceputLuna } },
        _sum: { crediteFolosite: true },
      }),
      prisma.apolloPersoana.count(),
      prisma.apolloPersoana.count({ where: { email: { not: null } } }),
    ])

    const folosite = crediteLuna._sum.crediteFolosite || 0
    const total = CONFIG.credite.totalLunar

    return NextResponse.json({
      areCheie: true,
      cheieValida: cheie.valida,
      mailboxuri: Array.isArray(mailboxuri) ? mailboxuri : [],
      eroareMailboxuri: mailboxuri?.eroare || null,
      secvente: secventeCuStatistici,
      credite: {
        folosite,
        total,
        ramase: Math.max(0, total - folosite),
        procent: total ? Math.round((folosite / total) * 100) : 0,
        pragAvertisment: CONFIG.credite.avertismentLaProcent,
        pragOprire: CONFIG.credite.opresteLaProcent,
      },
      statistici: { totalPersoane, cuEmail },
      config: {
        sabloaneCautare: CONFIG.sabloaneCautare,
        seniorityDisponibile: CONFIG.seniorityDisponibile,
        marimiCompanie: CONFIG.marimiCompanie,
        sanatateEmail: CONFIG.sanatateEmail,
      },
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare Apollo:', error)
    return NextResponse.json({ error: error.message || 'Apollo indisponibil' }, { status: 500 })
  }
}
