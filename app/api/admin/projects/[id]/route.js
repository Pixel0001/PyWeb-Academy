/**
 * GET    /api/admin/projects/:id — proiectul cu taskuri, fișiere și programări
 * PATCH  /api/admin/projects/:id
 * DELETE /api/admin/projects/:id — taskurile și programările rămân, fără proiect
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cuPermisiune } from '@/lib/lucru/echipa'
import { SELECT_TASK } from '@/lib/lucru/taskuri'
import { SELECT_PROIECT, curataProiect, numeLeaduri } from '@/lib/lucru/proiecte'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OBJECT_ID = /^[a-f\d]{24}$/i

export async function GET(_request, { params }) {
  const { eroare, cod } = await cuPermisiune('projects.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Proiect inexistent' }, { status: 404 })

  const proiect = await prisma.project.findUnique({ where: { id }, select: SELECT_PROIECT })
  if (!proiect) return NextResponse.json({ error: 'Proiect inexistent' }, { status: 404 })

  const [taskuri, programari, leaduri] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: id },
      select: { ...SELECT_TASK, attachments: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.appointment.findMany({
      where: { projectId: id },
      orderBy: { startAt: 'desc' },
      take: 50,
      select: { id: true, title: true, status: true, startAt: true, endAt: true, dateKey: true, contactName: true, company: true },
    }),
    numeLeaduri([proiect.leadId]),
  ])

  // Fișierele proiectului = atașamentele tuturor taskurilor lui
  const fisiere = taskuri.flatMap((t) =>
    t.attachments.map((a) => ({ ...a, taskTitle: t.title, taskSeq: t.seq }))
  )
  return NextResponse.json({
    proiect: { ...proiect, lead: proiect.leadId ? leaduri[proiect.leadId] || null : null },
    taskuri: taskuri.map(({ attachments, ...t }) => ({ ...t, nrAtasamente: attachments.length })),
    fisiere,
    programari,
  })
}

export async function PATCH(request, { params }) {
  const { eroare, cod } = await cuPermisiune('projects.edit')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params
  try {
    const date = curataProiect(await request.json(), { partial: true })
    const proiect = await prisma.project.update({ where: { id }, data: date, select: SELECT_PROIECT })
    return NextResponse.json({ proiect })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(_request, { params }) {
  const { eroare, cod } = await cuPermisiune('projects.delete')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params
  await prisma.task.updateMany({ where: { projectId: id }, data: { projectId: null } })
  await prisma.appointment.updateMany({ where: { projectId: id }, data: { projectId: null } })
  await prisma.project.delete({ where: { id } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
