export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { areCheie, CONFIG } from '@/lib/apollo/client'
import ApolloClient from './ApolloClient'

export const metadata = {
  title: 'Apollo & Email | PyWeb Admin',
}

export default async function ApolloPage() {
  const permisiune = await checkPermission('apollo.view')

  if (!permisiune.allowed) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-900">Acces restricționat</h1>
        <p className="mt-1 text-sm text-red-700">
          Nu ai permisiunea <code className="font-mono">apollo.view</code>. Cere-i unui SUPERADMIN
          să ți-o acorde din Securitate → Permisiuni.
        </p>
      </div>
    )
  }

  // Creditele consumate luna asta — Apollo nu expune soldul, îl numărăm noi.
  const inceputLuna = new Date()
  inceputLuna.setDate(1)
  inceputLuna.setHours(0, 0, 0, 0)

  const [persoane, crediteLuna, totalPersoane, cuEmail, inSecventa] = await Promise.all([
    prisma.apolloPersoana.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.apolloPersoana.aggregate({
      where: { enrichedLa: { gte: inceputLuna } },
      _sum: { crediteFolosite: true },
    }),
    prisma.apolloPersoana.count(),
    prisma.apolloPersoana.count({ where: { email: { not: null } } }),
    prisma.apolloPersoana.count({ where: { status: 'IN_SECVENTA' } }),
  ])

  const folosite = crediteLuna._sum.crediteFolosite || 0
  const total = CONFIG.credite.totalLunar

  return (
    <ApolloClient
      persoaneInitiale={JSON.parse(JSON.stringify(persoane))}
      areCheie={areCheie()}
      credite={{
        folosite,
        total,
        ramase: Math.max(0, total - folosite),
        procent: total ? Math.round((folosite / total) * 100) : 0,
        planUsd: CONFIG.credite.planUsd,
      }}
      statistici={{ totalPersoane, cuEmail, inSecventa }}
      config={{
        sabloaneCautare: CONFIG.sabloaneCautare,
        seniorityDisponibile: CONFIG.seniorityDisponibile,
        marimiCompanie: CONFIG.marimiCompanie,
      }}
      poateGestiona={(await checkPermission('apollo.manage')).allowed}
    />
  )
}
