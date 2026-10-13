export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/session'
import { echipa, echipaPublica } from '@/lib/lucru/echipa'
import { AccesInterzis } from '@/components/admin/lucru/ui'
import ProiectDetaliu from './ProiectDetaliu'

export const metadata = {
  title: 'Proiect | PyWeb Admin',
}

export default async function ProiectPage({ params }) {
  const permisiune = await checkPermission('projects.view')
  if (!permisiune.allowed) return <AccesInterzis permisiune="projects.view" />

  const { id } = await params
  const [utilizator, oameni, categorii, proiecte, edita, sterge, creaTask, creaProgramare] = await Promise.all([
    getCurrentUser(),
    echipa(),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.project.findMany({
      where: { status: { in: ['ACTIVE', 'ON_HOLD'] } },
      select: { id: true, name: true, seq: true },
      orderBy: { name: 'asc' },
    }),
    checkPermission('projects.edit'),
    checkPermission('projects.delete'),
    checkPermission('tasks.create'),
    checkPermission('appointments.create'),
  ])

  return (
    <ProiectDetaliu
      id={id}
      eu={utilizator?.id}
      echipa={echipaPublica(oameni)}
      categorii={JSON.parse(JSON.stringify(categorii))}
      proiecte={proiecte}
      poateEdita={edita.allowed}
      poateSterge={sterge.allowed}
      poateCreaTask={creaTask.allowed}
      poateCreaProgramare={creaProgramare.allowed}
    />
  )
}
