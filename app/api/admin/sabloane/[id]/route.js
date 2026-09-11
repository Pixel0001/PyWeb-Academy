/**
 * PATCH  /api/admin/sabloane/[id] — modifică un șablon (sau îl activează/dezactivează)
 * DELETE /api/admin/sabloane/[id] — șterge un șablon
 * POST   /api/admin/sabloane/[id] — marchează că a fost folosit (contorul)
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { variabileNecunoscute } from '@/lib/leads/sabloane'

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

    if (corp.nume !== undefined) {
      if (!String(corp.nume).trim()) {
        return NextResponse.json({ error: 'Numele nu poate fi gol' }, { status: 400 })
      }
      date.nume = String(corp.nume).trim().slice(0, 100)
    }

    if (corp.text !== undefined) {
      if (!String(corp.text).trim()) {
        return NextResponse.json({ error: 'Textul nu poate fi gol' }, { status: 400 })
      }
      const gresite = variabileNecunoscute(corp.text)
      if (gresite.length) {
        return NextResponse.json(
          { error: `Variabile necunoscute: ${gresite.map((g) => `{{${g}}}`).join(', ')}` },
          { status: 400 }
        )
      }
      date.text = String(corp.text).trim().slice(0, 4000)
    }

    if (corp.categorie !== undefined) date.categorie = corp.categorie?.trim() || null
    if (corp.activ !== undefined) date.activ = Boolean(corp.activ)
    if (corp.ordine !== undefined) date.ordine = Number(corp.ordine) || 0

    const sablon = await prisma.sablonMesaj.update({ where: { id }, data: date })
    return NextResponse.json({ sablon })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Nu am putut salva' }, { status: 500 })
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
    await prisma.sablonMesaj.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Nu am putut șterge' }, { status: 500 })
  }
}

// Contorul „folosit de N ori" — ca să vezi care șabloane chiar se trimit.
export async function POST(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    await prisma.sablonMesaj.update({ where: { id }, data: { folosit: { increment: 1 } } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }) // doar statistică, nu blocăm nimic
  }
}
