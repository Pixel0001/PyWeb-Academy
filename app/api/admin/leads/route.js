/**
 * GET /api/admin/leads
 * Lista lead-urilor, cu filtrele din pagina /admin/leads.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { TOATE_ORASELE, CATEGORII } from '@/lib/leads/config'
import { furnizorPitch } from '@/lib/leads/pitch'
import { inceputulZilei } from '@/lib/leads/statusuri'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Traduce filtrele din interfață în condiții Prisma.
 * Exportată pentru că exportul Excel folosește exact aceleași filtre —
 * ce vezi pe ecran e ce iese în fișier.
 */
export async function construiesteFiltre(searchParams) {
  const where = {}

  const oras = searchParams.get('oras')
  const calitate = searchParams.get('calitate')
  const status = searchParams.get('status')
  const categorie = searchParams.get('categorie')
  const cautare = searchParams.get('q')
  const scorMin = parseInt(searchParams.get('scorMin') || '0', 10)

  if (oras) where.oras = oras
  if (calitate) where.calitateSite = calitate
  if (status) where.status = status
  if (categorie) where.categorii = { has: categorie }

  // „doar firmele mele" / firmele unui anumit om
  const responsabil = searchParams.get('responsabil')
  if (responsabil === 'fara') where.responsabilId = null
  else if (responsabil) where.responsabilId = responsabil
  if (scorMin > 0) where.scor = { gte: scorMin }

  if (cautare) {
    where.OR = [
      { denumire: { contains: cautare, mode: 'insensitive' } },
      { telefon: { contains: cautare } },
      { adresa: { contains: cautare, mode: 'insensitive' } },
    ]
  }

  // ── Doar firmele noi ────────────────────────────────────────────
  // „Nou" = descoperit în rularea cerută (implicit: ultima rulare).
  // Firmele găsite la rulări anterioare rămân în bază cu statusul și
  // notițele intacte, dar nu-ți mai încarcă lista.
  const runId = searchParams.get('runId')
  const doarNoi = searchParams.get('doarNoi') === '1'

  if (doarNoi) {
    let idRulare = runId
    if (!idRulare) {
      const ultima = await prisma.leadRun.findFirst({
        orderBy: { startedAt: 'desc' },
        select: { id: true },
      })
      idRulare = ultima?.id
    }
    // Fără nicio rulare încă, „doar noi" n-are ce filtra — lăsăm tot.
    if (idRulare) where.descoperitInRunId = idRulare
  } else if (runId) {
    where.runId = runId
  }

  // ── Recontactare ────────────────────────────────────────────────
  const followUp = searchParams.get('followUp')
  if (followUp) {
    const acum = new Date()
    const maine = inceputulZilei(acum)
    maine.setDate(maine.getDate() + 1)

    if (followUp === 'restante') where.nextFollowUpAt = { lt: acum }
    else if (followUp === 'azi') where.nextFollowUpAt = { gte: acum, lt: maine }
    else if (followUp === 'urmeaza') where.nextFollowUpAt = { gte: maine }
    else if (followUp === 'fara') where.nextFollowUpAt = null
  }

  // ── Perioada descoperirii ───────────────────────────────────────
  const perioada = searchParams.get('perioada')
  if (perioada) {
    const de = perioada === 'azi' ? inceputulZilei() : null
    const zile = parseInt(perioada, 10)

    if (de) where.createdAt = { gte: de }
    else if (!Number.isNaN(zile)) {
      where.createdAt = { gte: new Date(Date.now() - zile * 24 * 60 * 60 * 1000) }
    }
  }

  return where
}

/** Ordinea listei, după sortarea aleasă. */
export function construiesteOrdine(sortare) {
  switch (sortare) {
    case 'followup':
      // Cele cu follow-up primele, cel mai apropiat sus.
      return [{ nextFollowUpAt: 'asc' }, { scor: 'desc' }]
    case 'noi':
      return [{ createdAt: 'desc' }]
    case 'recenzii':
      return [{ nrRecenzii: 'desc' }]
    case 'nume':
      return [{ denumire: 'asc' }]
    default:
      return [{ scor: 'desc' }, { nrRecenzii: 'desc' }]
  }
}

export async function GET(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să vezi lead-urile' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limita = Math.min(1000, Math.max(1, parseInt(searchParams.get('limita') || '300', 10)))

    const where = await construiesteFiltre(searchParams)
    const orderBy = construiesteOrdine(searchParams.get('sortare'))

    const [leaduri, total, peCalitate] = await Promise.all([
      prisma.webLead.findMany({
        where,
        orderBy,
        take: limita,
        include: {
          notiteIstoric: { orderBy: { createdAt: 'desc' }, take: 20 },
          responsabil: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.webLead.count({ where }),
      prisma.webLead.groupBy({ by: ['calitateSite'], _count: true }),
    ])

    return NextResponse.json({
      leaduri,
      total,
      statistici: peCalitate,
      optiuni: { orase: TOATE_ORASELE, categorii: CATEGORII },
      furnizorPitch: furnizorPitch().nume,
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la listarea lead-urilor:', error)
    return NextResponse.json({ error: 'Nu am putut încărca lead-urile' }, { status: 500 })
  }
}
