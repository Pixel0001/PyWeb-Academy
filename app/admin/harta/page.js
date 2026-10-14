export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { SELECT_PROIECT, numaraTaskuri } from '@/lib/lucru/proiecte'
import { AccesInterzis, TitluPagina } from '@/components/admin/lucru/ui'
import { HartaProiecte } from '@/components/admin/lucru/Harti'

export const metadata = {
  title: 'Hartă proiecte | PyWeb Admin',
}

export default async function HartaPage() {
  const permisiune = await checkPermission('projects.view')
  if (!permisiune.allowed) return <AccesInterzis permisiune="projects.view" />

  const proiecte = await prisma.project.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    select: SELECT_PROIECT,
    take: 1000,
  })
  const taskuri = await numaraTaskuri(proiecte.map((p) => p.id))
  const pini = proiecte
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({ ...p, taskuri: taskuri[p.id] || { total: 0, gata: 0, deschise: 0 } }))

  return (
    <div className="lucru w-full text-ink">
      <TitluPagina>Hartă proiecte</TitluPagina>
      <HartaProiecte proiecte={JSON.parse(JSON.stringify(pini))} />
    </div>
  )
}
