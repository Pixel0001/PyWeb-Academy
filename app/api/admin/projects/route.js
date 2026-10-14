/**
 * GET  /api/admin/projects — proiectele, cu numărul de taskuri
 * POST /api/admin/projects — proiect nou
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cuPermisiune } from '@/lib/lucru/echipa'
import { urmatorulNumar } from '@/lib/lucru/taskuri'
import { SELECT_PROIECT, curataProiect, numaraTaskuri, numeLeaduri } from '@/lib/lucru/proiecte'
import { VALORI_STATUS_PROIECT } from '@/lib/lucru/constante'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { eroare, cod } = await cuPermisiune('projects.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })

  const sp = new URL(request.url).searchParams
  const conditii = []
  const statusuri = (sp.get('status') || '').split(',').filter((s) => VALORI_STATUS_PROIECT.includes(s))
  if (statusuri.length) conditii.push({ status: { in: statusuri } })
  const q = (sp.get('q') || '').trim()
  if (q) {
    const nr = /^#?(\d{1,6})$/.exec(q)
    conditii.push(
      nr
        ? { seq: Number(nr[1]) }
        : {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { clientName: { contains: q, mode: 'insensitive' } },
              { address: { contains: q, mode: 'insensitive' } },
            ],
          }
    )
  }

  const where = conditii.length ? { AND: conditii } : {}
  const ps = sp.get('ps')
  const marime = ps === 'all' ? 2000 : Math.min(Math.max(Number(ps) || 20, 1), 2000)
  const pagina = Math.max(1, Number(sp.get('page')) || 1)
  const [proiecte, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: SELECT_PROIECT,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (pagina - 1) * marime,
      take: marime,
    }),
    prisma.project.count({ where }),
  ])
  const [taskuri, leaduri] = await Promise.all([
    numaraTaskuri(proiecte.map((p) => p.id)),
    numeLeaduri(proiecte.map((p) => p.leadId)),
  ])
  return NextResponse.json({
    proiecte: proiecte.map((p) => ({
      ...p,
      taskuri: taskuri[p.id] || { total: 0, gata: 0, deschise: 0 },
      lead: p.leadId ? leaduri[p.leadId] || null : null,
    })),
    total,
    pagina,
    totalPagini: Math.max(1, Math.ceil(total / marime)),
  })
}

export async function POST(request) {
  const { user, eroare, cod } = await cuPermisiune('projects.create')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  try {
    const date = curataProiect(await request.json())
    const proiect = await prisma.project.create({
      data: { ...date, ownerId: user.id, seq: await urmatorulNumar('project') },
      select: SELECT_PROIECT,
    })
    return NextResponse.json({ proiect })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
