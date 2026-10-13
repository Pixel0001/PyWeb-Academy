/**
 * GET  /api/admin/categorii — categoriile (comune pentru taskuri și programări)
 * POST /api/admin/categorii — { name, color, defaultDurationMinutes }
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkAnyPermission } from '@/lib/permissions'
import { curataCategorie } from '@/lib/lucru/categorii'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CITIRE = ['tasks.view', 'appointments.view']
const SCRIERE = ['tasks.create', 'tasks.edit', 'appointments.create', 'appointments.edit']

export async function GET() {
  const { allowed } = await checkAnyPermission(CITIRE)
  if (!allowed) return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  const categorii = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ categorii })
}

export async function POST(request) {
  const { allowed } = await checkAnyPermission(SCRIERE)
  if (!allowed) return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  try {
    const date = curataCategorie(await request.json())
    if (!date.name) throw new Error('Scrie numele categoriei.')
    const categorie = await prisma.category.create({ data: date })
    return NextResponse.json({ categorie })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
