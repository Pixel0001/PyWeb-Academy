/**
 * DELETE /api/admin/leads/notite/[notaId] — șterge o notiță din istoric.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { notaId } = await params
    await prisma.webLeadNota.delete({ where: { id: notaId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la ștergerea notiței:', error)
    return NextResponse.json({ error: 'Nu am putut șterge notița' }, { status: 500 })
  }
}
