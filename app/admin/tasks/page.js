export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/session'
import { echipa, echipaPublica } from '@/lib/lucru/echipa'
import { AccesInterzis } from '@/components/admin/lucru/ui'
import TasksClient from './TasksClient'

export const metadata = {
  title: 'Taskuri | PyWeb Admin',
}

export default async function TasksPage({ searchParams }) {
  const permisiune = await checkPermission('tasks.view')
  if (!permisiune.allowed) return <AccesInterzis permisiune="tasks.view" />

  const [utilizator, oameni, categorii, proiecte, crea, edita, sterge] = await Promise.all([
    getCurrentUser(),
    echipa(),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.project.findMany({
      where: { status: { in: ['ACTIVE', 'ON_HOLD'] } },
      select: { id: true, name: true, seq: true },
      orderBy: { name: 'asc' },
    }),
    checkPermission('tasks.create'),
    checkPermission('tasks.edit'),
    checkPermission('tasks.delete'),
  ])

  const sp = (await searchParams) || {}

  return (
    <TasksClient
      eu={utilizator?.id}
      echipa={echipaPublica(oameni)}
      categoriiInitiale={JSON.parse(JSON.stringify(categorii))}
      proiecte={proiecte}
      poateCrea={crea.allowed}
      poateEdita={edita.allowed}
      poateSterge={sterge.allowed}
      filtreUrl={{
        project: typeof sp.project === 'string' ? sp.project : '',
        scope: typeof sp.scope === 'string' ? sp.scope : '',
        due: typeof sp.due === 'string' ? sp.due : '',
        nou: sp.nou === '1',
      }}
    />
  )
}
