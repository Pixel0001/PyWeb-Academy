export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/session'
import { echipa, echipaPublica } from '@/lib/lucru/echipa'
import { AccesInterzis } from '@/components/admin/lucru/ui'
import ProgramariClient from './ProgramariClient'

export const metadata = {
  title: 'Programări | PyWeb Admin',
}

export default async function ProgramariPage({ searchParams }) {
  const permisiune = await checkPermission('appointments.view')
  if (!permisiune.allowed) return <AccesInterzis permisiune="appointments.view" />

  const [utilizator, oameni, categorii, crea, edita, sterge] = await Promise.all([
    getCurrentUser(),
    echipa(),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    checkPermission('appointments.create'),
    checkPermission('appointments.edit'),
    checkPermission('appointments.delete'),
  ])
  const sp = (await searchParams) || {}

  return (
    <ProgramariClient
      eu={utilizator?.id}
      esteSuperAdmin={utilizator?.role === 'SUPERADMIN'}
      echipa={echipaPublica(oameni)}
      categoriiInitiale={JSON.parse(JSON.stringify(categorii))}
      poateCrea={crea.allowed}
      poateEdita={edita.allowed}
      poateSterge={sterge.allowed}
      ziInitiala={typeof sp.zi === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sp.zi) ? sp.zi : null}
    />
  )
}
