/**
 * POST /api/admin/leads/[id]/notite
 * Adaugă o notiță în istoricul firmei.
 *
 * Notițele sunt înregistrări separate, nu un câmp care se suprascrie:
 * când suni a treia oară vrei să vezi ce s-a discutat la primele două.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { id } = await params
    const { continut } = await request.json()

    if (!continut || !String(continut).trim()) {
      return NextResponse.json({ error: 'Notița e goală' }, { status: 400 })
    }

    const lead = await prisma.webLead.findUnique({ where: { id }, select: { id: true } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead-ul nu există' }, { status: 404 })
    }

    const utilizator = await getCurrentUser()

    const nota = await prisma.webLeadNota.create({
      data: {
        webLeadId: id,
        continut: String(continut).trim().slice(0, 5000),
        autorNume: utilizator?.name || utilizator?.email || null,
      },
    })

    return NextResponse.json({ nota }, { status: 201 })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la adăugarea notiței:', error)
    return NextResponse.json({ error: 'Nu am putut salva notița' }, { status: 500 })
  }
}
