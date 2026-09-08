export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import LeadDetailClient from './LeadDetailClient'

export async function generateMetadata({ params }) {
  const { id } = await params
  const lead = await prisma.webLead.findUnique({
    where: { id },
    select: { denumire: true },
  })
  return { title: `${lead?.denumire || 'Lead'} | PyWeb Admin` }
}

export default async function LeadDetailPage({ params }) {
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

  const { id } = await params

  const lead = await prisma.webLead.findUnique({
    where: { id },
    include: { notiteIstoric: { orderBy: { createdAt: 'desc' } } },
  })

  if (!lead) notFound()

  // Rularea în care a fost descoperită firma — util ca să știu de unde a venit.
  const rulare = lead.descoperitInRunId
    ? await prisma.leadRun.findUnique({
        where: { id: lead.descoperitInRunId },
        select: { id: true, startedAt: true, orase: true, categorii: true },
      })
    : null

  return (
    <LeadDetailClient
      lead={JSON.parse(JSON.stringify(lead))}
      rulare={rulare ? JSON.parse(JSON.stringify(rulare)) : null}
      poateEdita={(await checkPermission('leads.manage')).allowed}
    />
  )
}
