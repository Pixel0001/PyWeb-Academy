/**
 * POST /api/admin/apollo/cautare
 * Caută persoane în baza Apollo. GRATUIT — nu consumă credite.
 *
 * Rezultatele se SALVEAZĂ automat (cu status GASIT, 0 credite), din două motive:
 *  - nu se pierde nimic la refresh sau la închiderea paginii;
 *  - la o căutare viitoare știm pe cine am mai văzut, ca să nu-l reiei degeaba.
 *
 * Emailul apare abia după enrich, care se cere separat.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { cautaPersoane } from '@/lib/apollo/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { filtre, pagina, ascundeCunoscute, campanieId } = await request.json()

    const areCevaDeCautat =
      filtre &&
      Object.values(filtre).some((v) =>
        Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() : false
      )
    if (!areCevaDeCautat) {
      return NextResponse.json(
        { error: 'Alege cel puțin un filtru — altfel Apollo întoarce toată baza.' },
        { status: 400 }
      )
    }

    const rezultat = await cautaPersoane(filtre, pagina || 1)

    if (!rezultat.persoane.length) {
      return NextResponse.json({ ...rezultat, noi: 0, cunoscute: 0 })
    }

    // ── Pe cine avem deja? ──────────────────────────────────────────
    const ids = rezultat.persoane.map((p) => p.apolloPersonId)
    const existente = await prisma.apolloPersoana.findMany({
      where: { apolloPersonId: { in: ids } },
      select: {
        id: true,
        apolloPersonId: true,
        status: true,
        email: true,
        enrichedLa: true,
        adaugatInSecventaLa: true,
      },
    })
    const dupaId = new Map(existente.map((p) => [p.apolloPersonId, p]))

    // ── Salvăm cei noi, ca să nu se piardă ──────────────────────────
    // 0 credite: doar ce ne-a dat căutarea gratuită. Emailul rămâne gol până
    // la enrich, iar `@unique` pe apolloPersonId face duplicatele imposibile.
    const noi = rezultat.persoane.filter((p) => !dupaId.has(p.apolloPersonId))

    if (noi.length) {
      await prisma.apolloPersoana.createMany({
        data: noi.map((p) => ({
          apolloPersonId: p.apolloPersonId,
          prenume: p.prenume || null,
          numeFamilie: p.numeFamilie || null,
          numeMascat: p.numeMascat !== false,
          titlu: p.titlu || null,
          companie: p.companie || null,
          status: 'GASIT',
          crediteFolosite: 0,
          ...(campanieId ? { campanieId } : {}),
        })),
      })

      // Le citim înapoi ca să avem id-urile din baza noastră.
      const create = await prisma.apolloPersoana.findMany({
        where: { apolloPersonId: { in: noi.map((p) => p.apolloPersonId) } },
        select: { id: true, apolloPersonId: true, status: true, email: true },
      })
      for (const p of create) dupaId.set(p.apolloPersonId, p)
    }

    // ── Adnotăm fiecare rezultat cu ce știm deja despre el ──────────
    let persoane = rezultat.persoane.map((p) => {
      const salvat = dupaId.get(p.apolloPersonId)
      const eNou = noi.some((n) => n.apolloPersonId === p.apolloPersonId)

      return {
        ...p,
        id: salvat?.id || null,
        eNou,
        dejaEnriched: Boolean(salvat?.enrichedLa),
        emailStiut: salvat?.email || null,
        statusSalvat: salvat?.status || 'GASIT',
        inSecventa: Boolean(salvat?.adaugatInSecventaLa),
      }
    })

    const cunoscute = persoane.filter((p) => !p.eNou).length

    // „Nu-mi mai arăta pe cine am văzut deja" — util când reiei o căutare
    // și vrei doar ce e nou de data asta.
    if (ascundeCunoscute) {
      persoane = persoane.filter((p) => p.eNou)
    }

    return NextResponse.json({
      ...rezultat,
      persoane,
      noi: noi.length,
      cunoscute,
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la căutarea Apollo:', error)
    return NextResponse.json({ error: error.message || 'Căutarea a eșuat' }, { status: 500 })
  }
}
