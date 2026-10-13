/**
 * PATCH  /api/admin/programari/:id — { status } sau câmpuri (reprogramare, contact…)
 * DELETE /api/admin/programari/:id
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cuPermisiune, arePermisiune } from '@/lib/lucru/echipa'
import { actualizeazaProgramare, schimbaStatusProgramare } from '@/lib/lucru/programari'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  const { user, eroare, cod } = await cuPermisiune('appointments.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params

  const p = await prisma.appointment
    .findUnique({ where: { id }, select: { creatorId: true, responsabilId: true } })
    .catch(() => null)
  if (!p) return NextResponse.json({ error: 'Programare inexistentă' }, { status: 404 })
  const aMea = p.creatorId === user.id || p.responsabilId === user.id
  if (!aMea && !(await arePermisiune('appointments.edit'))) {
    return NextResponse.json(
      { error: 'Nu ai voie să modifici programările altora (appointments.edit).' },
      { status: 403 }
    )
  }

  try {
    const { status, ignoraSuprapunere, ...campuri } = await request.json()
    let programare
    if (status !== undefined && !Object.keys(campuri).length) {
      programare = await schimbaStatusProgramare(id, user, status)
    } else {
      programare = await actualizeazaProgramare(
        id,
        user,
        status !== undefined ? { ...campuri, status } : campuri,
        { ignoraSuprapunere: Boolean(ignoraSuprapunere) }
      )
    }
    return NextResponse.json({ programare })
  } catch (e) {
    return NextResponse.json(
      { error: e.message, suprapunere: Boolean(e.suprapunere) },
      { status: e.suprapunere ? 409 : 400 }
    )
  }
}

export async function DELETE(_request, { params }) {
  const { user, eroare, cod } = await cuPermisiune('appointments.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params
  const p = await prisma.appointment.findUnique({ where: { id }, select: { creatorId: true } }).catch(() => null)
  if (!p) return NextResponse.json({ error: 'Programare inexistentă' }, { status: 404 })
  if (p.creatorId !== user.id && !(await arePermisiune('appointments.delete'))) {
    return NextResponse.json(
      { error: 'Doar cine a creat-o (sau cu appointments.delete) o poate șterge.' },
      { status: 403 }
    )
  }
  await prisma.appointment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
