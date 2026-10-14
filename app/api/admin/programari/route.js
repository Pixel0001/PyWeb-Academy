/**
 * GET  /api/admin/programari?de=YYYY-MM-DD&pana=YYYY-MM-DD — programările din interval
 * POST /api/admin/programari — programare nouă (liberă sau legată de lead/proiect)
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cuPermisiune } from '@/lib/lucru/echipa'
import { SELECT_PROGRAMARE, creeazaProgramare } from '@/lib/lucru/programari'
import { numeLeaduri } from '@/lib/lucru/proiecte'
import { VALORI_STATUS_PROGRAMARE } from '@/lib/lucru/constante'
import { cheieZi, adaugaZile } from '@/lib/lucru/timp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ZI = /^\d{4}-\d{2}-\d{2}$/
const OBJECT_ID = /^[a-f\d]{24}$/i

export async function GET(request) {
  const { user, eroare, cod } = await cuPermisiune('appointments.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })

  const sp = new URL(request.url).searchParams
  const azi = cheieZi()
  const de = ZI.test(sp.get('de') || '') ? sp.get('de') : azi
  let pana = ZI.test(sp.get('pana') || '') ? sp.get('pana') : adaugaZile(de, 6)
  if (pana < de) pana = de
  if (pana > adaugaZile(de, 62)) pana = adaugaZile(de, 62)

  const conditii = [{ dateKey: { gte: de, lte: pana } }]
  const resp = sp.get('responsabil')
  if (resp === 'eu') conditii.push({ responsabilId: user.id })
  else if (OBJECT_ID.test(resp || '')) conditii.push({ responsabilId: resp })
  const statusuri = (sp.get('status') || '').split(',').filter((s) => VALORI_STATUS_PROGRAMARE.includes(s))
  if (statusuri.length) conditii.push({ status: { in: statusuri } })
  const categorie = sp.get('category')
  if (OBJECT_ID.test(categorie || '')) conditii.push({ categoryId: categorie })
  const q = (sp.get('q') || '').trim()
  if (q) {
    conditii.push({
      OR: ['title', 'contactName', 'company', 'contactPhone', 'location'].map((c) => ({
        [c]: { contains: q, mode: 'insensitive' },
      })),
    })
  }

  const [programari, urmatoare] = await Promise.all([
    prisma.appointment.findMany({
      where: { AND: conditii },
      select: SELECT_PROGRAMARE,
      orderBy: { startAt: 'asc' },
      take: 1000,
    }),
    // Următoarele, indiferent de interval — pentru „Ce urmează"
    prisma.appointment.findMany({
      where: { startAt: { gte: new Date() }, status: { in: ['NEW', 'CONFIRMED'] } },
      select: SELECT_PROGRAMARE,
      orderBy: { startAt: 'asc' },
      take: 5,
    }),
  ])
  const leaduri = await numeLeaduri([...programari, ...urmatoare].map((p) => p.leadId))
  const cuLead = (p) => ({ ...p, lead: p.leadId ? leaduri[p.leadId] || null : null })

  return NextResponse.json({ de, pana, programari: programari.map(cuLead), urmatoare: urmatoare.map(cuLead) })
}

export async function POST(request) {
  const { user, eroare, cod } = await cuPermisiune('appointments.create')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  try {
    const corp = await request.json()
    const programare = await creeazaProgramare(user, corp, { ignoraSuprapunere: Boolean(corp.ignoraSuprapunere) })
    return NextResponse.json({ programare })
  } catch (e) {
    return NextResponse.json(
      { error: e.message, suprapunere: Boolean(e.suprapunere) },
      { status: e.suprapunere ? 409 : 400 }
    )
  }
}
