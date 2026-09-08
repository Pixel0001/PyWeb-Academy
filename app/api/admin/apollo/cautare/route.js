/**
 * POST /api/admin/apollo/cautare
 * Caută persoane în baza Apollo. GRATUIT — nu consumă credite.
 *
 * Rezultatele vin mascate de Apollo (fără email, fără nume complet). Emailul
 * apare abia după enrich, care se cere separat.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { cautaPersoane } from '@/lib/apollo/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { filtre, pagina } = await request.json()

    const areCevaDeCautat =
      filtre &&
      Object.values(filtre).some((v) =>
        Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() : false
      )
    if (!areCevaDeCautat) {
      return NextResponse.json(
        { error: 'Alege cel puțin un filtru — altfel Apollo întoarce toată baza.' },
        { status: 400 }
      )
    }

    const rezultat = await cautaPersoane(filtre, pagina || 1)
    return NextResponse.json(rezultat)
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la căutarea Apollo:', error)
    return NextResponse.json({ error: error.message || 'Căutarea a eșuat' }, { status: 500 })
  }
}
