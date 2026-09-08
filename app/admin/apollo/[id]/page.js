export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'
import ContactDetailClient from './ContactDetailClient'

export async function generateMetadata({ params }) {
  const { id } = await params
  const p = await prisma.apolloPersoana.findUnique({
    where: { id },
    select: { prenume: true, numeFamilie: true },
  })
  const nume = [p?.prenume, p?.numeFamilie].filter(Boolean).join(' ')
  return { title: `${nume || 'Contact'} | Apollo` }
}

export default async function ContactPage({ params }) {
  const permisiune = await checkPermission('apollo.view')

  if (!permisiune.allowed) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-900">Acces restricționat</h1>
      </div>
    )
  }

  const { id } = await params
  const persoana = await prisma.apolloPersoana.findUnique({
    where: { id },
    include: { campanie: { select: { id: true, nume: true, client: true } } },
  })

  if (!persoana) notFound()

  return (
    <ContactDetailClient
      persoana={JSON.parse(JSON.stringify(persoana))}
      poateGestiona={(await checkPermission('apollo.manage')).allowed}
    />
  )
}
