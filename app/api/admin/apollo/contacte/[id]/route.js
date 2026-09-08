/**
 * PATCH  /api/admin/apollo/contacte/[id] — notițe și status
 * DELETE /api/admin/apollo/contacte/[id] — scoate contactul din lista mea
 *
 * Ștergerea e doar locală: persoana rămâne în baza Apollo. Efectul e că, la o
 * căutare viitoare, va apărea din nou ca „nouă" — pentru că exact asta a
 * devenit din punctul nostru de vedere.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STATUSURI_VALIDE = [
  'GASIT',
  'ENRICHED',
  'FARA_EMAIL',
  'IN_SECVENTA',
  'RASPUNS',
  'REFUZ',
]

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { id } = await params
    const corp = await request.json()
    const date = {}

    if (corp.notite !== undefined) date.notite = String(corp.notite).slice(0, 5000)

    if (corp.status !== undefined) {
      if (!STATUSURI_VALIDE.includes(corp.status)) {
        return NextResponse.json({ error: `Status invalid: ${corp.status}` }, { status: 400 })
      }
      date.status = corp.status
    }

    if (!Object.keys(date).length) {
      return NextResponse.json({ error: 'Nimic de actualizat' }, { status: 400 })
    }

    const persoana = await prisma.apolloPersoana.update({ where: { id }, data: date })
    return NextResponse.json({ persoana })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la actualizarea contactului:', error)
    return NextResponse.json({ error: 'Nu am putut actualiza contactul' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { id } = await params
    await prisma.apolloPersoana.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la ștergerea contactului:', error)
    return NextResponse.json({ error: 'Nu am putut șterge contactul' }, { status: 500 })
  }
}
