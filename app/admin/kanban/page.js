export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/session'
import { echipa, echipaPublica } from '@/lib/lucru/echipa'
import { AccesInterzis } from '@/components/admin/lucru/ui'
import KanbanClient from './KanbanClient'

export const metadata = {
  title: 'Kanban | PyWeb Admin',
}

export default async function KanbanPage() {
  const permisiune = await checkPermission('tasks.view')
  if (!permisiune.allowed) return <AccesInterzis permisiune="tasks.view" />

  const [utilizator, oameni, categorii, proiecte, crea] = await Promise.all([
    getCurrentUser(),
    echipa(),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.project.findMany({
      where: { status: { in: ['ACTIVE', 'ON_HOLD'] } },
      select: { id: true, name: true, seq: true },
      orderBy: { name: 'asc' },
    }),
    checkPermission('tasks.create'),
  ])

  return (
    <KanbanClient
      eu={utilizator?.id}
      echipa={echipaPublica(oameni)}
      categorii={JSON.parse(JSON.stringify(categorii))}
      proiecte={proiecte}
      poateCrea={crea.allowed}
    />
  )
}
