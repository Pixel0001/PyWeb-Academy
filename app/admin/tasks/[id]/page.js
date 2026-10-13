export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/session'
import { echipa, echipaPublica } from '@/lib/lucru/echipa'
import { AccesInterzis } from '@/components/admin/lucru/ui'
import TaskDetaliu from './TaskDetaliu'

export const metadata = {
  title: 'Task | PyWeb Admin',
}

export default async function TaskPage({ params }) {
  const permisiune = await checkPermission('tasks.view')
  if (!permisiune.allowed) return <AccesInterzis permisiune="tasks.view" />

  const { id } = await params
  const [utilizator, oameni, categorii, proiecte, edita, sterge] = await Promise.all([
    getCurrentUser(),
    echipa(),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.project.findMany({
      where: { status: { in: ['ACTIVE', 'ON_HOLD'] } },
      select: { id: true, name: true, seq: true },
      orderBy: { name: 'asc' },
    }),
    checkPermission('tasks.edit'),
    checkPermission('tasks.delete'),
  ])

  return (
    <TaskDetaliu
      id={id}
      eu={utilizator?.id}
      esteSuperAdmin={utilizator?.role === 'SUPERADMIN'}
      echipa={echipaPublica(oameni)}
      categorii={JSON.parse(JSON.stringify(categorii))}
      proiecte={proiecte}
      poateEdita={edita.allowed}
      poateSterge={sterge.allowed}
    />
  )
}
