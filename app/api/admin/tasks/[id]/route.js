/**
 * GET    /api/admin/tasks/:id — taskul cu comentarii, atașamente și istoric.
 * PATCH  /api/admin/tasks/:id — { status } | { progress } | câmpuri de editat.
 * DELETE /api/admin/tasks/:id — creatorul sau cine are tasks.delete.
 */

import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import prisma from '@/lib/prisma'
import { cuPermisiune, arePermisiune } from '@/lib/lucru/echipa'
import {
  SELECT_TASK,
  schimbaStatus,
  schimbaProgres,
  actualizeazaTask,
  poateModifica,
} from '@/lib/lucru/taskuri'
import { numeLeaduri } from '@/lib/lucru/proiecte'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OBJECT_ID = /^[a-f\d]{24}$/i

export async function GET(_request, { params }) {
  const { eroare, cod } = await cuPermisiune('tasks.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Task inexistent' }, { status: 404 })

  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      ...SELECT_TASK,
      comments: { orderBy: { createdAt: 'asc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { createdAt: 'desc' }, take: 100 },
    },
  })
  if (!task) return NextResponse.json({ error: 'Task inexistent' }, { status: 404 })
  const leaduri = await numeLeaduri([task.leadId])
  return NextResponse.json({ task: { ...task, lead: task.leadId ? leaduri[task.leadId] || null : null } })
}

export async function PATCH(request, { params }) {
  const { user, eroare, cod } = await cuPermisiune('tasks.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Task inexistent' }, { status: 404 })

  const existent = await prisma.task.findUnique({ where: { id }, select: { creatorId: true, assigneeIds: true } })
  if (!existent) return NextResponse.json({ error: 'Task inexistent' }, { status: 404 })
  if (!poateModifica(existent, user, await arePermisiune('tasks.edit'))) {
    return NextResponse.json(
      { error: 'Poți modifica doar taskurile create de tine sau asignate ție (sau cere permisiunea tasks.edit).' },
      { status: 403 }
    )
  }

  try {
    const corp = await request.json()
    let task
    if (corp.status !== undefined) task = await schimbaStatus(id, user, corp.status, { nota: corp.nota || null })
    if (corp.progress !== undefined) task = await schimbaProgres(id, user, corp.progress)
    const { status: _s, progress: _p, nota: _n, ...campuri } = corp
    if (Object.keys(campuri).length) task = await actualizeazaTask(id, user, campuri)
    return NextResponse.json({ task })
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Nu am putut salva.' }, { status: 400 })
  }
}

export async function DELETE(_request, { params }) {
  const { user, eroare, cod } = await cuPermisiune('tasks.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Task inexistent' }, { status: 404 })

  const task = await prisma.task.findUnique({
    where: { id },
    select: { creatorId: true, attachments: { select: { url: true } } },
  })
  if (!task) return NextResponse.json({ error: 'Task inexistent' }, { status: 404 })
  if (task.creatorId !== user.id && !(await arePermisiune('tasks.delete'))) {
    return NextResponse.json({ error: 'Doar cine l-a creat (sau cu tasks.delete) îl poate șterge.' }, { status: 403 })
  }

  // Fișierele din Blob se șterg și ele — altfel rămân plătite degeaba
  const urluri = task.attachments.map((a) => a.url).filter((u) => u.includes('blob.vercel-storage.com'))
  if (urluri.length && process.env.BLOB_READ_WRITE_TOKEN) await del(urluri).catch(() => {})

  await prisma.$transaction([
    prisma.taskComment.deleteMany({ where: { taskId: id } }),
    prisma.taskActivity.deleteMany({ where: { taskId: id } }),
    prisma.taskAttachment.deleteMany({ where: { taskId: id } }),
    prisma.task.delete({ where: { id } }),
  ])
  return NextResponse.json({ ok: true })
}
