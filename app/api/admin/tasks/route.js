/**
 * GET  /api/admin/tasks — lista de taskuri, filtrată pe server.
 * POST /api/admin/tasks — task nou (din formular sau din voce).
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cuPermisiune } from '@/lib/lucru/echipa'
import { creeazaTask, SELECT_TASK } from '@/lib/lucru/taskuri'
import { STATUSURI_TASK_INCHISE } from '@/lib/lucru/constante'
import { construiesteFiltre } from '@/lib/lucru/filtre-taskuri'
import { numeLeaduri } from '@/lib/lucru/proiecte'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { user, eroare, cod } = await cuPermisiune('tasks.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })

  const sp = new URL(request.url).searchParams
  const where = construiesteFiltre(sp, user)
  // Paginare ca în StefanPWA: 20 pe pagină implicit, „all" = tot
  const ps = sp.get('ps')
  const marime = ps === 'all' ? 2000 : Math.min(Math.max(Number(ps) || Number(sp.get('limit')) || 20, 1), 2000)
  const pagina = Math.max(1, Number(sp.get('page')) || 1)
  const sortare = sp.get('sort')
  const orderBy =
    sortare === 'dueAsc'
      ? [{ dueAt: 'asc' }, { createdAt: 'desc' }]
      : sortare === 'dueDesc'
        ? [{ dueAt: 'desc' }, { createdAt: 'desc' }]
        : [{ status: 'asc' }, { createdAt: 'desc' }]

  const [taskuri, total, alemele, intarziate] = await Promise.all([
    prisma.task.findMany({
      where,
      select: { ...SELECT_TASK, _count: { select: { comments: true, attachments: true } } },
      orderBy,
      skip: (pagina - 1) * marime,
      take: marime,
    }),
    prisma.task.count({ where }),
    prisma.task.count({ where: { assigneeIds: { has: user.id }, status: { notIn: STATUSURI_TASK_INCHISE } } }),
    prisma.task.count({ where: { dueAt: { lt: new Date() }, status: { notIn: STATUSURI_TASK_INCHISE } } }),
  ])

  const leaduri = await numeLeaduri(taskuri.map((t) => t.leadId))
  return NextResponse.json({
    taskuri: taskuri.map((t) => ({ ...t, lead: t.leadId ? leaduri[t.leadId] || null : null })),
    total,
    pagina,
    totalPagini: Math.max(1, Math.ceil(total / marime)),
    statistici: { alemele, intarziate },
  })
}

export async function POST(request) {
  const { user, eroare, cod } = await cuPermisiune('tasks.create')
  if (eroare) return NextResponse.json(eroare, { status: cod })

  try {
    const corp = await request.json()
    const task = await creeazaTask(user, corp, corp.sursa === 'VOICE' ? 'VOICE' : 'WEB')
    return NextResponse.json({ task })
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Nu am putut crea taskul.' }, { status: 400 })
  }
}
