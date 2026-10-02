/**
 * GET  /api/admin/leads — lista lead-urilor, filtrată și paginată pe server.
 * POST /api/admin/leads — adaugă un lead de mână (recomandare, Facebook, telefon...).
 */

import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { VALORI_STATUS, VALORI_SURSA, STATUSURI_INCHISE } from '@/lib/leads/statusuri'
import { intervalPerioada, aziSiMaine } from '@/lib/leads/timp'
import { calculeazaScor } from '@/lib/leads/scoring'
import { verificaSite } from '@/lib/leads/site-check'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30
export const preferredRegion = 'fra1' // aproape de Moldova: verificări de site mai exacte

const MARIMI_PAGINA = [25, 50, 100]

/**
 * Traduce filtrele din interfață în condiții Prisma.
 * Exportată pentru că exportul Excel folosește exact aceleași filtre —
 * ce vezi pe ecran e ce iese în fișier.
 */
export async function construiesteFiltre(searchParams) {
  const conditii = []

  // Mai multe statusuri deodată: „Fără răspuns" + „Follow up 1"
  const statusuri = (searchParams.get('status') || '')
    .split(',')
    .filter((s) => VALORI_STATUS.includes(s))
  if (statusuri.length === 1) conditii.push({ status: statusuri[0] })
  else if (statusuri.length > 1) conditii.push({ status: { in: statusuri } })

  const sursa = searchParams.get('sursa')
  if (sursa === 'GOOGLE_MAPS') {
    // Lead-urile dinainte de câmpul „sursă" n-au valoarea scrisă deloc
    conditii.push({ OR: [{ sursa: 'GOOGLE_MAPS' }, { sursa: null }, { sursa: { isSet: false } }] })
  } else if (VALORI_SURSA.includes(sursa)) {
    conditii.push({ sursa })
  }

  const tara = searchParams.get('tara')
  if (tara === 'MD') {
    // Lead-urile dinainte de câmpul „țară" sunt toate din Moldova
    conditii.push({ OR: [{ tara: 'MD' }, { tara: null }, { tara: { isSet: false } }] })
  } else if (/^[A-Z]{2}$/.test(tara || '')) {
    conditii.push({ tara })
  }

  if (searchParams.get('urgent') === '1') conditii.push({ urgent: true })

  const oras = searchParams.get('oras')
  if (oras) conditii.push({ oras })

  const calitate = searchParams.get('calitate')
  if (calitate === 'NEVERIFICAT') {
    conditii.push({ OR: [{ calitateSite: null }, { calitateSite: { isSet: false } }] })
  } else if (calitate) {
    conditii.push({ calitateSite: calitate })
  }

  const categorie = searchParams.get('categorie')
  if (categorie) {
    // Termenul căutat (salon de frumusețe) sau categoria scrisă de mână
    conditii.push({ OR: [{ categorii: { has: categorie } }, { categoriePrincipala: categorie }] })
  }

  // „doar firmele mele" / firmele unui anumit om
  const responsabil = searchParams.get('responsabil')
  if (responsabil === 'fara') conditii.push({ responsabilId: null })
  else if (responsabil) conditii.push({ responsabilId: responsabil })

  const scorMin = parseInt(searchParams.get('scorMin') || '0', 10)
  if (scorMin > 0) conditii.push({ scor: { gte: scorMin } })

  const cautare = searchParams.get('q')?.trim()
  if (cautare) {
    // Telefonul se caută și după cifre, ca „069 123" să găsească „069 123 456"
    const cifre = cautare.replace(/\D/g, '')
    conditii.push({
      OR: [
        { denumire: { contains: cautare, mode: 'insensitive' } },
        { adresa: { contains: cautare, mode: 'insensitive' } },
        { siteUrl: { contains: cautare, mode: 'insensitive' } },
        { telefon: { contains: cautare } },
        ...(cifre.length >= 4 ? [{ telefonLocal: { contains: cifre.slice(-6) } }] : []),
      ],
    })
  }

  // ── Doar firmele noi ────────────────────────────────────────────
  // „Nou" = descoperit în rularea cerută (implicit: ultima rulare).
  // Firmele găsite la rulări anterioare rămân în bază cu statusul și
  // notițele intacte, dar nu-ți mai încarcă lista.
  const runId = searchParams.get('runId')
  if (searchParams.get('doarNoi') === '1') {
    let idRulare = runId
    if (!idRulare) {
      const ultima = await prisma.leadRun.findFirst({
        orderBy: { startedAt: 'desc' },
        select: { id: true },
      })
      idRulare = ultima?.id
    }
    // Fără nicio rulare încă, „doar noi" n-are ce filtra — lăsăm tot.
    if (idRulare) conditii.push({ descoperitInRunId: idRulare })
  } else if (runId) {
    conditii.push({ runId })
  }

  // ── Recontactare ────────────────────────────────────────────────
  const followUp = searchParams.get('followUp')
  if (followUp) {
    const acum = new Date()
    const { maine } = aziSiMaine(acum)

    if (followUp === 'restante') conditii.push({ nextFollowUpAt: { lt: acum } })
    else if (followUp === 'azi') conditii.push({ nextFollowUpAt: { gte: acum, lt: maine } })
    else if (followUp === 'urmeaza') conditii.push({ nextFollowUpAt: { gte: maine } })
    else if (followUp === 'fara') conditii.push({ nextFollowUpAt: null })
  }

  // ── Când a intrat în CRM ────────────────────────────────────────
  const interval = intervalPerioada(
    searchParams.get('perioada'),
    searchParams.get('de'),
    searchParams.get('pana')
  )
  if (interval) conditii.push({ createdAt: interval })

  if (!conditii.length) return {}
  if (conditii.length === 1) return conditii[0]
  return { AND: conditii }
}

/** Ordinea listei, după sortarea aleasă. */
export function construiesteOrdine(sortare) {
  switch (sortare) {
    case 'followup':
      return [{ nextFollowUpAt: 'asc' }, { scor: 'desc' }]
    case 'noi':
      return [{ createdAt: 'desc' }]
    case 'vechi':
      return [{ createdAt: 'asc' }]
    case 'recenzii':
      return [{ nrRecenzii: 'desc' }]
    case 'nume':
      return [{ denumire: 'asc' }]
    default:
      return [{ scor: 'desc' }, { nrRecenzii: 'desc' }]
  }
}

export const INCLUDE_LISTA = {
  notiteIstoric: { orderBy: { createdAt: 'desc' }, take: 20 },
  responsabil: { select: { id: true, name: true, email: true } },
  _count: { select: { notiteIstoric: true } },
}

export async function GET(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să vezi lead-urile' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const where = await construiesteFiltre(searchParams)
    const orderBy = construiesteOrdine(searchParams.get('sortare'))

    // „Toate" are totuși un plafon, ca pagina să nu cadă la 20.000 de firme
    const cerut = searchParams.get('marime')
    const toate = cerut === 'toate'
    const marime = toate ? 2000 : MARIMI_PAGINA.includes(Number(cerut)) ? Number(cerut) : 50
    const paginaCeruta = Math.max(1, parseInt(searchParams.get('pagina') || '1', 10) || 1)

    const acum = new Date()
    const [totalFiltrat, total, peStatus, restante, faraSite, peOras, peCategorie, peTara, moarte, urgente, multiLocatie] = await Promise.all([
      prisma.webLead.count({ where }),
      prisma.webLead.count(),
      prisma.webLead.groupBy({ by: ['status'], _count: true }),
      prisma.webLead.count({
        where: { nextFollowUpAt: { lt: acum }, status: { notIn: STATUSURI_INCHISE } },
      }),
      prisma.webLead.count({ where: { calitateSite: { in: ['LIPSA', 'DOAR_SOCIAL'] } } }),
      // Ce orașe și categorii există deja în bază — pentru filtre
      prisma.webLead.groupBy({ by: ['oras'], _count: true }),
      prisma.webLead.groupBy({ by: ['categoriePrincipala'], _count: true }),
      prisma.webLead.groupBy({ by: ['tara'], _count: true }),
      prisma.webLead.count({ where: { calitateSite: { in: ['MORT', 'NEADAPTAT_MOBIL'] }, siteUrl: { not: null } } }),
      prisma.webLead.count({ where: { urgent: true } }),
      // Firmele cu mai multe locații — ca să se vadă câte locații Google sunt în spatele lead-urilor
      prisma.webLead.aggregate({ where: { nrLocatii: { gt: 1 } }, _sum: { nrLocatii: true }, _count: true }),
    ])

    const optiuniDinDate = (grupuri, camp) =>
      grupuri
        .filter((g) => g[camp])
        .map((g) => ({ value: g[camp], count: g._count }))
        .sort((a, b) => a.value.localeCompare(b.value, 'ro'))

    const totalPagini = toate ? 1 : Math.max(1, Math.ceil(totalFiltrat / marime))
    const pagina = Math.min(paginaCeruta, totalPagini)

    const leaduri = await prisma.webLead.findMany({
      where,
      orderBy,
      skip: toate ? 0 : (pagina - 1) * marime,
      take: marime,
      include: INCLUDE_LISTA,
    })

    return NextResponse.json({
      leaduri,
      totalFiltrat,
      pagina,
      totalPagini,
      statistici: {
        total,
        restante,
        faraSite,
        moarte,
        urgente,
        // 1 lead = 1 firmă; o firmă poate avea mai multe locații pe Google
        locatii: total - multiLocatie._count + (multiLocatie._sum.nrLocatii || 0),
        peStatus: Object.fromEntries(peStatus.map((g) => [g.status, g._count])),
      },
      orase: optiuniDinDate(peOras, 'oras'),
      categorii: optiuniDinDate(peCategorie, 'categoriePrincipala'),
      // Fără țară = Moldova (lead-urile dinainte de câmp)
      tari: Object.entries(
        peTara.reduce((acc, g) => {
          const cod = g.tara || 'MD'
          acc[cod] = (acc[cod] || 0) + g._count
          return acc
        }, {})
      ).map(([value, count]) => ({ value, count })),
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la listarea lead-urilor:', error)
    return NextResponse.json({ error: 'Nu am putut încărca lead-urile' }, { status: 500 })
  }
}

// ============================================================
// LEAD NOU, ADĂUGAT DE MÂNĂ
// ============================================================

/** Ultimele 8 cifre — „+373 69 123 456", „069123456" și „69 12 34 56" sunt același număr. */
export function cheieTelefon(telefon) {
  const cifre = String(telefon || '').replace(/\D/g, '')
  return cifre.length >= 8 ? cifre.slice(-8) : null
}

export function normalizeazaSite(url) {
  const t = String(url || '').trim()
  if (!t) return null
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

/** Firmele care par a fi aceeași cu cea nouă: același telefon, sau același nume în același oraș. */
export async function cautaDuplicate({ denumire, telefon, oras, exceptId = null }) {
  const cheie = cheieTelefon(telefon)
  const nume = denumire.trim()

  const candidati = await prisma.webLead.findMany({
    where: {
      ...(exceptId ? { id: { not: exceptId } } : {}),
      OR: [
        { denumire: { equals: nume, mode: 'insensitive' } },
        // Telefonul nu se poate compara direct în bază (formate diferite) —
        // aducem doar câmpurile mici și comparăm cifrele aici.
        ...(cheie ? [{ telefon: { not: null } }, { telefonLocal: { not: null } }] : []),
      ],
    },
    select: { id: true, denumire: true, telefon: true, telefonLocal: true, oras: true, status: true },
  })

  return candidati
    .filter((c) => {
      const acelasiTelefon =
        cheie && (cheieTelefon(c.telefon) === cheie || cheieTelefon(c.telefonLocal) === cheie)
      const acelasiNume =
        c.denumire.trim().toLowerCase() === nume.toLowerCase() &&
        (!oras || !c.oras || c.oras.toLowerCase() === oras.toLowerCase())
      return acelasiTelefon || acelasiNume
    })
    .slice(0, 5)
}

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să adaugi lead-uri' }, { status: 403 })
    }

    const corp = await request.json()
    const denumire = String(corp.denumire || '').trim().slice(0, 200)
    if (!denumire) {
      return NextResponse.json({ error: 'Scrie numele firmei' }, { status: 400 })
    }

    const telefon = String(corp.telefon || '').trim().slice(0, 40) || null
    const oras = String(corp.oras || '').trim().slice(0, 80) || null
    const sursa = VALORI_SURSA.includes(corp.sursa) ? corp.sursa : 'MANUAL'
    const status = VALORI_STATUS.includes(corp.status) ? corp.status : 'DE_SUNAT'

    // Aceeași firmă de două ori înseamnă doi oameni care o sună — întrebăm întâi
    if (!corp.forteaza) {
      const duplicate = await cautaDuplicate({ denumire, telefon, oras })
      if (duplicate.length) {
        return NextResponse.json({ error: 'Firma pare să existe deja', duplicate }, { status: 409 })
      }
    }

    let nextFollowUpAt = null
    if (corp.nextFollowUpAt) {
      nextFollowUpAt = new Date(corp.nextFollowUpAt)
      if (Number.isNaN(nextFollowUpAt.getTime())) nextFollowUpAt = null
    }

    // Site-ul se verifică la fel ca la extragere (gratuit, fără Google),
    // ca lead-ul manual să aibă și el calitate și scor.
    const siteUrl = normalizeazaSite(corp.siteUrl)
    let verificare = null
    try {
      verificare = await verificaSite(siteUrl)
    } catch {
      /* verificarea e un bonus — lead-ul se salvează oricum */
    }

    const rating = corp.rating !== undefined && corp.rating !== '' ? Number(corp.rating) : null
    const nrRecenzii = parseInt(corp.nrRecenzii || '0', 10) || 0
    const calitateSite = verificare?.calitate || null
    const categorie = String(corp.categorie || '').trim().slice(0, 100) || null

    const utilizator = await getCurrentUser()
    const autor = utilizator?.name || utilizator?.email || null
    const nota = String(corp.nota || '').trim().slice(0, 5000)

    const lead = await prisma.webLead.create({
      data: {
        placeId: `manual:${randomUUID()}`,
        denumire,
        telefon,
        telefonLocal: telefon,
        oras,
        adresa: String(corp.adresa || '').trim().slice(0, 300) || null,
        categoriePrincipala: categorie,
        categorii: categorie ? [categorie] : [],
        siteUrl,
        calitateSite,
        observatiiSite: verificare?.observatii || null,
        verificatLa: verificare ? new Date() : null,
        rating: Number.isFinite(rating) ? rating : null,
        nrRecenzii,
        scor: calculeazaScor({ calitateSite, rating, nrRecenzii }),
        sursa,
        sursaDetaliu: String(corp.sursaDetaliu || '').trim().slice(0, 300) || null,
        adaugatDe: autor,
        status,
        nextFollowUpAt,
        responsabilId: corp.responsabilId || null,
        ...(nota ? { notiteIstoric: { create: { continut: nota, autorNume: autor } } } : {}),
      },
      include: INCLUDE_LISTA,
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la adăugarea lead-ului:', error)
    return NextResponse.json({ error: 'Nu am putut salva lead-ul' }, { status: 500 })
  }
}
