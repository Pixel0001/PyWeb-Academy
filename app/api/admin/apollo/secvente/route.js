/**
 * GET  /api/admin/apollo/secvente  — programele de trimitere + variabilele
 * POST /api/admin/apollo/secvente  — creează o secvență cu pași și texte
 *
 * Crearea nu consumă credite. Secvența se creează OPRITĂ implicit: o pornești
 * după ce recitești textele, ca să nu plece nimic din greșeală.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { listeazaProgramari, creeazaSecventa, VARIABILE } from '@/lib/apollo/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const programari = await listeazaProgramari()
    return NextResponse.json({ programari, variabile: VARIABILE })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || 'Eroare' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să creezi secvențe' }, { status: 403 })
    }

    const { nume, programareId, pasi, activa } = await request.json()

    const rezultat = await creeazaSecventa({
      nume,
      programareId,
      pasi,
      activa: Boolean(activa),
    })

    return NextResponse.json(rezultat, { status: 201 })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la crearea secvenței:', error)
    return NextResponse.json({ error: error.message || 'Crearea a eșuat' }, { status: 400 })
  }
}
