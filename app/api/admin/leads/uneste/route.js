/**
 * Unirea lead-urilor care sunt de fapt aceeași firmă (Fornetti × 10).
 *
 * GET  — doar arată ce s-ar uni, fără să schimbe nimic.
 * POST — unește: păstrează lead-ul pe care s-a lucrat cel mai mult, îi
 *        adaugă locațiile celorlalte, le mută notițele pe el, apoi le șterge.
 *        Lucrează cât îi permite timpul; interfața îl cheamă până la `ramase: 0`.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { grupeazaFirme } from '@/lib/leads/firme'
import { planificaUnire } from '@/lib/leads/planificare'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BUGET_MS = 240 * 1000

const CAMPURI = {
  id: true,
  placeId: true,
  placeIds: true,
  locatii: true,
  denumire: true,
  telefon: true,
  telefonLocal: true,
  adresa: true,
  oras: true,
  tara: true,
  siteUrl: true,
  linkMaps: true,
  calitateSite: true,
  observatiiSite: true,
  categorii: true,
  rating: true,
  nrRecenzii: true,
  status: true,
  responsabilId: true,
  nextFollowUpAt: true,
  dataApel: true,
  createdAt: true,
  notite: true,
  _count: { select: { notiteIstoric: true } },
}

async function grupeDeUnit() {
  const toate = await prisma.webLead.findMany({ select: CAMPURI })
  return grupeazaFirme(toate)
    .filter((g) => g.length > 1)
    .sort((a, b) => b.length - a.length)
}

async function verificaPermisiunea() {
  await requireAdmin()
  const permisiune = await checkPermission('leads.manage')
  return permisiune.allowed
}

function raspunsEroare(error) {
  if (['Unauthorized', 'Forbidden'].includes(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
  console.error('Eroare la unirea dublurilor:', error)
  return NextResponse.json({ error: 'Nu am putut uni dublurile' }, { status: 500 })
}

export async function GET() {
  try {
    if (!(await verificaPermisiunea())) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const grupe = await grupeDeUnit()
    const leaduri = grupe.reduce((s, g) => s + g.length, 0)

    return NextResponse.json({
      grupe: grupe.length,
      leaduri,
      deSters: leaduri - grupe.length,
      exemple: grupe.slice(0, 8).map((g) => ({
        denumire: planificaUnire(g).date.denumire,
        nr: g.length,
      })),
    })
  } catch (error) {
    return raspunsEroare(error)
  }
}

export async function POST() {
  try {
    if (!(await verificaPermisiunea())) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const start = Date.now()
    const grupe = await grupeDeUnit()
    let unite = 0
    let sterse = 0

    for (const grupa of grupe) {
      if (Date.now() - start > BUGET_MS) break

      const { principal, ceilalti, date, nota } = planificaUnire(grupa)
      const idsCeilalti = ceilalti.map((l) => l.id)

      // Ordinea contează: dacă ceva pică la jumătate, dublurile rămân în bază
      // și se unesc la următoarea apăsare — nimic nu se pierde.
      await prisma.webLead.update({ where: { id: principal.id }, data: date })
      await prisma.webLeadNota.updateMany({
        where: { webLeadId: { in: idsCeilalti } },
        data: { webLeadId: principal.id },
      })
      await prisma.webLeadNota.create({
        data: { webLeadId: principal.id, continut: nota, autorNume: 'Sistem' },
      })
      await prisma.webLead.deleteMany({ where: { id: { in: idsCeilalti } } })

      unite++
      sterse += idsCeilalti.length
    }

    return NextResponse.json({ unite, sterse, ramase: grupe.length - unite })
  } catch (error) {
    return raspunsEroare(error)
  }
}
