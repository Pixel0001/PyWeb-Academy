/**
 * POST /api/admin/leads/runs/[id]/step
 *
 * Execută UN pas al rulării și întoarce progresul. Interfața cheamă ruta asta
 * în buclă până când primește `terminat: true`.
 *
 * Un pas e dimensionat (din config/leads.json → `pasi`) ca să se încadreze
 * sub limita de execuție a funcției, oricât de mare ar fi rularea în total.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { executaPas, rezumatRulare } from '@/lib/leads/runner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { id } = await params
    const { terminat, ocupat, rulare, eroare } = await executaPas(id)

    if (ocupat) {
      return NextResponse.json({ ocupat: true, mesaj: 'Un alt pas rulează chiar acum' }, { status: 202 })
    }

    const interogari = Array.isArray(rulare.interogari) ? rulare.interogari : []
    const loguri = Array.isArray(rulare.loguri) ? rulare.loguri : []

    return NextResponse.json({
      terminat,
      eroare,
      faza: rulare.faza,
      status: rulare.status,
      avertisment: rulare.avertisment,
      progres: {
        totalInterogari: interogari.length,
        interogariFacute: rulare.idxInterogare,
        procent: interogari.length
          ? Math.round((rulare.idxInterogare / interogari.length) * 100)
          : 0,
      },
      rezumat: rezumatRulare(rulare),
      loguri: loguri.slice(-25),
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la execuția pasului:', error)
    return NextResponse.json({ error: error.message || 'Pasul a eșuat' }, { status: 500 })
  }
}
