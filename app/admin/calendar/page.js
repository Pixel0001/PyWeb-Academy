export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/session'
import { echipa, echipaPublica } from '@/lib/lucru/echipa'
import { AccesInterzis } from '@/components/admin/lucru/ui'
import CalendarClient from './CalendarClient'

export const metadata = {
  title: 'Calendar | PyWeb Admin',
}

export default async function CalendarPage() {
  const permisiune = await checkPermission('tasks.view')
  if (!permisiune.allowed) return <AccesInterzis permisiune="tasks.view" />

  const [utilizator, oameni, categorii, proiecte, programari] = await Promise.all([
    getCurrentUser(),
    echipa(),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, color: true } }),
    prisma.project.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    checkPermission('appointments.view'),
  ])

  return (
    <CalendarClient
      eu={utilizator?.id}
      echipa={echipaPublica(oameni)}
      categorii={categorii}
      proiecte={proiecte}
      vedeProgramari={programari.allowed}
    />
  )
}
