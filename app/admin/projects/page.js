export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/session'
import { echipa, echipaPublica } from '@/lib/lucru/echipa'
import { AccesInterzis } from '@/components/admin/lucru/ui'
import ProiecteClient from './ProiecteClient'

export const metadata = {
  title: 'Proiecte | PyWeb Admin',
}

export default async function ProjectsPage() {
  const permisiune = await checkPermission('projects.view')
  if (!permisiune.allowed) return <AccesInterzis permisiune="projects.view" />

  const [utilizator, oameni, categorii, proiecte, crea, edita, sterge, creaTask] = await Promise.all([
    getCurrentUser(),
    echipa(),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.project.findMany({
      where: { status: { in: ['ACTIVE', 'ON_HOLD'] } },
      select: { id: true, name: true, seq: true },
      orderBy: { name: 'asc' },
    }),
    checkPermission('projects.create'),
    checkPermission('projects.edit'),
    checkPermission('projects.delete'),
    checkPermission('tasks.create'),
  ])

  return (
    <ProiecteClient
      eu={utilizator?.id}
      echipa={echipaPublica(oameni)}
      categorii={JSON.parse(JSON.stringify(categorii))}
      proiecteOptiuni={proiecte}
      poateCrea={crea.allowed}
      poateEdita={edita.allowed}
      poateSterge={sterge.allowed}
      poateCreaTask={creaTask.allowed}
    />
  )
}
