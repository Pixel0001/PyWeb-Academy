export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/session'
import SabloaneClient from './SabloaneClient'

export const metadata = {
  title: 'Șabloane mesaje | PyWeb Admin',
}

export default async function SabloanePage() {
  const permisiune = await checkPermission('leads.view')

  if (!permisiune.allowed) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-900">Acces restricționat</h1>
        <p className="mt-1 text-sm text-red-700">
          Nu ai permisiunea <code className="font-mono">leads.view</code>.
        </p>
      </div>
    )
  }

  const [sabloane, utilizator] = await Promise.all([
    prisma.sablonMesaj.findMany({ orderBy: [{ ordine: 'asc' }, { createdAt: 'asc' }] }),
    getCurrentUser(),
  ])

  return (
    <SabloaneClient
      sabloaneInitiale={JSON.parse(JSON.stringify(sabloane))}
      numeleMeu={utilizator?.name || ''}
      poateEdita={(await checkPermission('leads.manage')).allowed}
    />
  )
}
