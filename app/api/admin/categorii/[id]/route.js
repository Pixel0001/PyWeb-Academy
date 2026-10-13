/**
 * PATCH  /api/admin/categorii/:id
 * DELETE /api/admin/categorii/:id — taskurile/programările rămân, fără categorie
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkAnyPermission } from '@/lib/permissions'
import { curataCategorie } from '@/lib/lucru/categorii'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SCRIERE = ['tasks.edit', 'appointments.edit']

export async function PATCH(request, { params }) {
  const { allowed } = await checkAnyPermission(SCRIERE)
  if (!allowed) return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  const { id } = await params
  try {
    const categorie = await prisma.category.update({ where: { id }, data: curataCategorie(await request.json()) })
    return NextResponse.json({ categorie })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(_request, { params }) {
  const { allowed } = await checkAnyPermission(SCRIERE)
  if (!allowed) return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  const { id } = await params
  await prisma.task.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
  await prisma.appointment.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
  await prisma.category.delete({ where: { id } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
