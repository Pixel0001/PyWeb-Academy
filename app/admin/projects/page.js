export const dynamic = 'force-dynamic'

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

  const [utilizator, oameni, crea] = await Promise.all([
    getCurrentUser(),
    echipa(),
    checkPermission('projects.create'),
  ])

  return <ProiecteClient eu={utilizator?.id} echipa={echipaPublica(oameni)} poateCrea={crea.allowed} />
}
