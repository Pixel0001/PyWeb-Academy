export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { TOATE_ORASELE, ORASE, CATEGORII, CONFIG } from '@/lib/leads/config'
import { furnizorPitch, modelCurent } from '@/lib/leads/pitch'
import LeadsClient from './LeadsClient'

export const metadata = {
  title: 'Leaduri Web | PyWeb Admin',
}

export default async function LeadsPage() {
  const permisiune = await checkPermission('leads.view')

  if (!permisiune.allowed) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-900">Acces restricționat</h1>
        <p className="mt-1 text-sm text-red-700">
          Nu ai permisiunea <code className="font-mono">leads.view</code>. Cere-i unui SUPERADMIN
          să ți-o acorde din Securitate → Permisiuni.
        </p>
      </div>
    )
  }

  // Începutul lunii — limita gratuită Google se resetează lunar.
  const inceputLuna = new Date()
  inceputLuna.setDate(1)
  inceputLuna.setHours(0, 0, 0, 0)

  const [leaduri, total, peCalitate, rulari, apeluriLuna, rulareActiva] = await Promise.all([
    prisma.webLead.findMany({
      orderBy: [{ scor: 'desc' }, { nrRecenzii: 'desc' }],
      take: 200,
    }),
    prisma.webLead.count(),
    prisma.webLead.groupBy({ by: ['calitateSite'], _count: true }),
    prisma.leadRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        faza: true,
        orase: true,
        categorii: true,
        apeluriApi: true,
        interogariSarite: true,
        firmeTotal: true,
        firmeNoi: true,
        faraSite: true,
        avertisment: true,
        eroare: true,
        startedAt: true,
        finishedAt: true,
      },
    }),
    prisma.leadRun.aggregate({
      where: { startedAt: { gte: inceputLuna } },
      _sum: { apeluriApi: true },
    }),
    prisma.leadRun.findFirst({
      where: { status: { in: ['QUEUED', 'RULEAZA'] } },
      select: { id: true, status: true, faza: true },
    }),
  ])

  const statistici = {
    total,
    faraSite: peCalitate
      .filter((g) => ['LIPSA', 'DOAR_SOCIAL'].includes(g.calitateSite))
      .reduce((s, g) => s + g._count, 0),
    peCalitate: Object.fromEntries(peCalitate.map((g) => [g.calitateSite || 'NEVERIFICAT', g._count])),
    apeluriLunaCurenta: apeluriLuna._sum.apeluriApi || 0,
  }

  return (
    <LeadsClient
      leaduriInitiale={JSON.parse(JSON.stringify(leaduri))}
      statistici={statistici}
      rulari={JSON.parse(JSON.stringify(rulari))}
      rulareActiva={rulareActiva}
      optiuni={{
        toateOrasele: TOATE_ORASELE,
        oraseImplicite: ORASE,
        categorii: CATEGORII,
        buget: CONFIG.buget,
        marimePagina: CONFIG.cautare.pageSize,
        paginiMax: CONFIG.cautare.paginiMax,
      }}
      areCheieGoogle={Boolean(process.env.GOOGLE_API_KEY)}
      furnizorPitch={furnizorPitch().nume}
      modelPitch={await modelCurent().catch(() => null)}
      poateRula={(await checkPermission('leads.manage')).allowed}
    />
  )
}
