/**
 * POST /api/admin/sabloane/biblioteca  { chei: [...] }
 *
 * Adaugă în listă șabloanele gata scrise din bibliotecă. Textul se ia de aici,
 * de pe server — din pagină vin doar cheile. Ce ai adăugat deja (după cheie)
 * nu se mai adaugă o dată, chiar dacă l-ai redenumit sau modificat.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { SABLOANE_GATA } from '@/lib/leads/sabloane-gata'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('sabloane.create')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să adaugi șabloane' }, { status: 403 })
    }

    const { chei } = await request.json()
    const cerute = new Set(Array.isArray(chei) ? chei : [])
    const deAdaugat = SABLOANE_GATA.filter((s) => cerute.has(s.cheie))
    if (!deAdaugat.length) {
      return NextResponse.json({ error: 'Niciun șablon ales' }, { status: 400 })
    }

    const existente = await prisma.sablonMesaj.findMany({
      where: { cheie: { in: deAdaugat.map((s) => s.cheie) } },
      select: { cheie: true },
    })
    const avem = new Set(existente.map((s) => s.cheie))
    const noi = deAdaugat.filter((s) => !avem.has(s.cheie))

    if (!noi.length) return NextResponse.json({ sabloane: [], sarite: deAdaugat.length })

    const utilizator = await getCurrentUser()
    const ultimul = await prisma.sablonMesaj.findFirst({ orderBy: { ordine: 'desc' } })
    let ordine = (ultimul?.ordine ?? -1) + 1

    const create = []
    for (const s of noi) {
      create.push(
        await prisma.sablonMesaj.create({
          data: {
            nume: s.nume,
            text: s.text,
            categorie: s.categorie || null,
            etapa: s.etapa && s.etapa !== 'PRIMUL_CONTACT' ? s.etapa : null,
            limba: s.limba && s.limba !== 'ro' ? s.limba : null,
            situatii: s.situatii || [],
            cuvinte: s.cuvinte || [],
            cheie: s.cheie,
            ordine: ordine++,
            createdBy: utilizator?.email || null,
          },
        })
      )
    }

    return NextResponse.json({ sabloane: create, sarite: deAdaugat.length - create.length }, { status: 201 })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la adăugarea din bibliotecă:', error)
    return NextResponse.json({ error: 'Nu am putut adăuga șabloanele' }, { status: 500 })
  }
}
