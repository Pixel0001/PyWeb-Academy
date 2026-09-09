/**
 * PUT /api/admin/apollo/emailuri/[templateId]
 *
 * Schimbă textul unui email dintr-o secvență.
 *
 * De reținut: modificarea afectează DOAR emailurile care pleacă de acum
 * încolo. Cele deja trimise rămân cum au fost — nu există „retragere".
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { actualizeazaEmail } from '@/lib/apollo/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function PUT(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.manage')
    if (!permisiune.allowed) {
      return NextResponse.json(
        { error: 'Nu ai permisiunea să modifici emailurile' },
        { status: 403 }
      )
    }

    const { templateId } = await params
    const { subiect, corp } = await request.json()

    const rezultat = await actualizeazaEmail(templateId, { subiect, corp })
    return NextResponse.json(rezultat)
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la modificarea emailului:', error)
    return NextResponse.json({ error: error.message || 'Modificarea a eșuat' }, { status: 400 })
  }
}
