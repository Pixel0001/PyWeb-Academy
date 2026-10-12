/**
 * POST /api/admin/sabloane/[id]/preferat — pune sau scoate șablonul de la
 * preferatele TALE. Preferatele apar primele când trimiți un mesaj.
 *
 * E o alegere personală, nu o editare a șablonului: ajunge să poți vedea
 * șabloanele (sau lead-urile, de unde le trimiți).
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/session'
import { checkAnyPermission } from '@/lib/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    await requireAdmin()
    const permisiune = await checkAnyPermission(['sabloane.view', 'leads.view'])
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const utilizator = await getCurrentUser()
    if (!utilizator?.id) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

    const { id } = await params
    const sablon = await prisma.sablonMesaj.findUnique({ where: { id }, select: { preferatDe: true } })
    if (!sablon) return NextResponse.json({ error: 'Șablon inexistent' }, { status: 404 })

    const era = (sablon.preferatDe || []).includes(utilizator.id)
    const preferatDe = era
      ? sablon.preferatDe.filter((u) => u !== utilizator.id)
      : [...(sablon.preferatDe || []), utilizator.id]

    await prisma.sablonMesaj.update({ where: { id }, data: { preferatDe } })
    return NextResponse.json({ preferat: !era })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Nu am putut salva preferatul' }, { status: 500 })
  }
}
