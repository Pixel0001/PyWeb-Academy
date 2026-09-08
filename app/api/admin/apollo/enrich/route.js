/**
 * POST /api/admin/apollo/enrich
 *
 * AICI SE CHELTUIE CREDITELE. 1 credit per persoană pentru care Apollo chiar
 * găsește un email. Din 2500 de credite pe lună, fiecare apel contează.
 *
 * De aceea:
 *  - trimitem doar persoane despre care căutarea a spus că AU email;
 *  - refuzăm dacă am consumat deja pragul din config;
 *  - salvăm în baza de date ce am plătit, ca să nu plătim a doua oară.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { CONFIG } from '@/lib/apollo/client'
import { imbogateste } from '@/lib/apollo/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să cheltui credite' }, { status: 403 })
    }

    const { persoane, campanieId } = await request.json()
    if (!Array.isArray(persoane) || !persoane.length) {
      return NextResponse.json({ error: 'Nicio persoană de îmbogățit' }, { status: 400 })
    }

    // ── Plasa de siguranță pe credite ─────────────────────────────
    const inceputLuna = new Date()
    inceputLuna.setDate(1)
    inceputLuna.setHours(0, 0, 0, 0)

    const agg = await prisma.apolloPersoana.aggregate({
      where: { enrichedLa: { gte: inceputLuna } },
      _sum: { crediteFolosite: true },
    })
    const folosite = agg._sum.crediteFolosite || 0
    const total = CONFIG.credite.totalLunar
    const procent = total ? (folosite / total) * 100 : 0

    if (procent >= CONFIG.credite.opresteLaProcent) {
      return NextResponse.json(
        {
          error:
            `Oprit: ai folosit ${folosite} din ${total} credite luna asta (${Math.round(procent)}%). ` +
            'Ridică pragul din config/apollo.json sau așteaptă luna viitoare.',
        },
        { status: 429 }
      )
    }

    // Nu re-plătim pentru cine are deja email salvat.
    const ids = persoane.map((p) => p.apolloPersonId).filter(Boolean)
    const dejaAvem = await prisma.apolloPersoana.findMany({
      where: { apolloPersonId: { in: ids }, email: { not: null } },
      select: { apolloPersonId: true },
    })
    const dejaSet = new Set(dejaAvem.map((p) => p.apolloPersonId))

    let deImbogatit = persoane.filter((p) => !dejaSet.has(p.apolloPersonId))

    // Fără email la Apollo = credit aruncat pe fereastră.
    if (CONFIG.enrich.doarCeiCuEmail) {
      deImbogatit = deImbogatit.filter((p) => p.areEmail !== false)
    }

    if (!deImbogatit.length) {
      return NextResponse.json({
        imbogatite: 0,
        sarite: persoane.length,
        crediteFolosite: 0,
        mesaj: 'Toate erau deja îmbogățite sau nu au email la Apollo.',
      })
    }

    const { imbogatite, crediteEstimate, erori } = await imbogateste(deImbogatit)

    // ── Salvăm ce am plătit ───────────────────────────────────────
    const utilizator = await getCurrentUser()
    let salvate = 0
    let faraEmail = 0

    for (const p of deImbogatit) {
      const date = imbogatite.get(p.apolloPersonId)
      const areEmail = Boolean(date?.email)
      if (!areEmail) faraEmail++

      const comun = {
        prenume: p.prenume || null,
        numeFamilie: date?.numeFamilie || p.numeFamilie || null,
        numeMascat: !date?.numeFamilie,
        titlu: date?.titlu || p.titlu || null,
        companie: date?.companie || p.companie || null,
        email: date?.email || null,
        emailStatus: date?.emailStatus || null,
        telefon: date?.telefon || null,
        domeniu: date?.domeniu || null,
        linkedinUrl: date?.linkedinUrl || null,
        enrichedLa: new Date(),
        crediteFolosite: areEmail ? CONFIG.enrich.crediteEstimatePerContact || 1 : 0,
        status: areEmail ? 'ENRICHED' : 'FARA_EMAIL',
        ...(campanieId ? { campanieId } : {}),
      }

      await prisma.apolloPersoana.upsert({
        where: { apolloPersonId: p.apolloPersonId },
        create: { apolloPersonId: p.apolloPersonId, ...comun },
        update: comun,
      })
      salvate++
    }

    if (campanieId) {
      await prisma.apolloCampanie
        .update({
          where: { id: campanieId },
          data: { crediteFolosite: { increment: crediteEstimate } },
        })
        .catch(() => {})
    }

    return NextResponse.json({
      imbogatite: salvate,
      cuEmail: salvate - faraEmail,
      faraEmail,
      sarite: persoane.length - deImbogatit.length,
      crediteFolosite: crediteEstimate,
      crediteRamase: Math.max(0, total - folosite - crediteEstimate),
      erori,
      autor: utilizator?.email || null,
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la enrich Apollo:', error)
    return NextResponse.json({ error: error.message || 'Enrich eșuat' }, { status: 500 })
  }
}
