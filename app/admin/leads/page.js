export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/session'
import { CATEGORII, CONFIG, TARI, GRUPURI_CATEGORII } from '@/lib/leads/config'
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

  // Lead-urile nu se mai încarcă aici: lista le cere singură, filtrată și paginată
  const [rulari, apeluriLuna, echipa, rulareActiva] = await Promise.all([
    prisma.leadRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        faza: true,
        orase: true,
        categorii: true,
        tara: true,
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
    // Cine poate fi responsabil de un lead — și dacă are Telegram legat
    prisma.user.findMany({
      where: { active: true, role: { in: ['SUPERADMIN', 'ADMIN'] } },
      select: { id: true, name: true, email: true, telegramChatId: true },
      orderBy: { name: 'asc' },
    }),
    prisma.leadRun.findFirst({
      where: { status: { in: ['QUEUED', 'RULEAZA'] } },
      select: { id: true, status: true, faza: true },
    }),
  ])


  return (
    <LeadsClient
      statisticiInitiale={{ apeluriLunaCurenta: apeluriLuna._sum.apeluriApi || 0 }}
      rulari={JSON.parse(JSON.stringify(rulari))}
      rulareActiva={rulareActiva}
      numeleMeu={(await getCurrentUser())?.name || ''}
      echipa={echipa.map((o) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        telegramLegat: Boolean(o.telegramChatId),
      }))}
      optiuni={{
        tari: TARI,
        grupuriCategorii: GRUPURI_CATEGORII,
        // Toate categoriile predefinite — pentru filtrul din listă
        categorii: GRUPURI_CATEGORII.flatMap((g) => g.categorii.map((c) => c.ro)),
        // Bifate implicit la prima căutare: cele de până acum
        categoriiImplicite: CATEGORII,
        areOpenAI: Boolean(process.env.OPENAI_API_KEY),
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
