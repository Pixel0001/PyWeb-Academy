/**
 * GET /api/admin/leads
 * Lista lead-urilor, cu filtre. Alimentează tabelul din /admin/leads.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { TOATE_ORASELE, CATEGORII, CALITATI_SITE, STATUSURI_LEAD } from '@/lib/leads/config'
import { furnizorPitch } from '@/lib/leads/pitch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să vezi lead-urile' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    const oras = searchParams.get('oras')
    const calitate = searchParams.get('calitate')
    const status = searchParams.get('status')
    const runId = searchParams.get('runId')
    const cautare = searchParams.get('q')
    const scorMin = parseInt(searchParams.get('scorMin') || '0', 10)
    const limita = Math.min(1000, Math.max(1, parseInt(searchParams.get('limita') || '200', 10)))

    const where = {}
    if (oras) where.oras = oras
    if (calitate) where.calitateSite = calitate
    if (status) where.status = status
    if (runId) where.runId = runId
    if (scorMin > 0) where.scor = { gte: scorMin }
    if (cautare) {
      where.OR = [
        { denumire: { contains: cautare, mode: 'insensitive' } },
        { telefon: { contains: cautare } },
        { adresa: { contains: cautare, mode: 'insensitive' } },
      ]
    }

    const [leaduri, total, statistici] = await Promise.all([
      prisma.webLead.findMany({
        where,
        orderBy: [{ scor: 'desc' }, { nrRecenzii: 'desc' }],
        take: limita,
      }),
      prisma.webLead.count({ where }),
      prisma.webLead.groupBy({ by: ['calitateSite'], _count: true }),
    ])

    return NextResponse.json({
      leaduri,
      total,
      statistici,
      optiuni: {
        orase: TOATE_ORASELE,
        categorii: CATEGORII,
        calitati: CALITATI_SITE,
        statusuri: STATUSURI_LEAD,
      },
      furnizorPitch: furnizorPitch().nume,
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la listarea lead-urilor:', error)
    return NextResponse.json({ error: 'Nu am putut încărca lead-urile' }, { status: 500 })
  }
}
