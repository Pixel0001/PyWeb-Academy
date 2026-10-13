/**
 * GET /api/admin/programari/legaturi?q=… — lead-uri și proiecte de care se
 * poate lega o programare / un task / un proiect.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkAnyPermission } from '@/lib/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { allowed } = await checkAnyPermission(['appointments.view', 'tasks.view', 'projects.view'])
  if (!allowed) return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })

  const q = (new URL(request.url).searchParams.get('q') || '').trim()
  if (q.length < 2) return NextResponse.json({ leaduri: [], proiecte: [] })

  const cifre = q.replace(/\D/g, '')
  const [leaduri, proiecte] = await Promise.all([
    prisma.webLead.findMany({
      where: {
        OR: [
          { denumire: { contains: q, mode: 'insensitive' } },
          ...(cifre.length >= 4 ? [{ telefon: { contains: cifre.slice(-8) } }] : []),
        ],
      },
      select: { id: true, denumire: true, telefon: true, oras: true, adresa: true, status: true },
      take: 8,
      orderBy: { scor: 'desc' },
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { clientName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, seq: true, clientName: true, clientPhone: true, address: true },
      take: 6,
    }),
  ])
  return NextResponse.json({ leaduri, proiecte })
}
