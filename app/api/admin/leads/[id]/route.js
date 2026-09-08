/**
 * PATCH /api/admin/leads/[id] — actualizează coloanele mele de lucru
 *                               (STATUS, DATA_APEL, NOTITE) în timpul apelurilor.
 * DELETE /api/admin/leads/[id] — șterge un lead.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { VALORI_STATUS } from '@/lib/leads/statusuri'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { id } = await params
    const corp = await request.json()
    const date = {}

    if (corp.status !== undefined) {
      if (!VALORI_STATUS.includes(corp.status)) {
        return NextResponse.json({ error: `Status invalid: ${corp.status}` }, { status: 400 })
      }
      date.status = corp.status
      // Prima dată când marchez „SUNAT", notez automat data apelului.
      if (corp.status === 'SUNAT' && corp.dataApel === undefined) {
        date.dataApel = new Date()
      }
    }

    if (corp.notite !== undefined) date.notite = String(corp.notite).slice(0, 5000)
    if (corp.dataApel !== undefined) {
      date.dataApel = corp.dataApel ? new Date(corp.dataApel) : null
    }

    // Recontactarea: dată + oră, sau null ca s-o scoatem din listă.
    if (corp.nextFollowUpAt !== undefined) {
      if (!corp.nextFollowUpAt) {
        date.nextFollowUpAt = null
      } else {
        const cand = new Date(corp.nextFollowUpAt)
        if (Number.isNaN(cand.getTime())) {
          return NextResponse.json({ error: 'Dată de recontactare invalidă' }, { status: 400 })
        }
        date.nextFollowUpAt = cand
      }
    }

    if (!Object.keys(date).length) {
      return NextResponse.json({ error: 'Nimic de actualizat' }, { status: 400 })
    }

    const lead = await prisma.webLead.update({
      where: { id },
      data: date,
      include: { notiteIstoric: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })
    return NextResponse.json({ lead })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la actualizarea lead-ului:', error)
    return NextResponse.json({ error: 'Nu am putut actualiza lead-ul' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { id } = await params
    await prisma.webLead.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la ștergerea lead-ului:', error)
    return NextResponse.json({ error: 'Nu am putut șterge lead-ul' }, { status: 500 })
  }
}
