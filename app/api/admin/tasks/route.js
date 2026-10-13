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
  const limita = Math.min(Number(sp.get('limit')) || 300, 500)

  const [taskuri, total, alemele, intarziate] = await Promise.all([
    prisma.task.findMany({
      where,
      select: { ...SELECT_TASK, _count: { select: { comments: true, attachments: true } } },
      orderBy: [{ updatedAt: 'desc' }],
      take: limita,
    }),
    prisma.task.count({ where }),
    prisma.task.count({ where: { assigneeIds: { has: user.id }, status: { notIn: STATUSURI_TASK_INCHISE } } }),
    prisma.task.count({ where: { dueAt: { lt: new Date() }, status: { notIn: STATUSURI_TASK_INCHISE } } }),
  ])

  const leaduri = await numeLeaduri(taskuri.map((t) => t.leadId))
  return NextResponse.json({
    taskuri: taskuri.map((t) => ({ ...t, lead: t.leadId ? leaduri[t.leadId] || null : null })),
    total,
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
