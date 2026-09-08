/**
 * GET /api/admin/apollo/secvente/[id]
 * Tot ce s-a întâmplat cu o secvență: statistici, pașii de follow-up,
 * răspunsurile primite și contactele din ea.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { statisticiSecventa, mesajeSecventa, contacteSecventa } from '@/lib/apollo/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const doarRaspunsuri = searchParams.get('doarRaspunsuri') === '1'

    const [statistici, mesaje, contacte] = await Promise.all([
      statisticiSecventa(id),
      mesajeSecventa(id, { doarRaspunsuri }).catch(() => ({ mesaje: [] })),
      contacteSecventa(id).catch(() => ({ contacte: [], total: 0 })),
    ])

    return NextResponse.json({ statistici, mesaje: mesaje.mesaje, contacte })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la statisticile secvenței:', error)
    return NextResponse.json(
      { error: error.message || 'Nu am putut citi secvența' },
      { status: 500 }
    )
  }
}
