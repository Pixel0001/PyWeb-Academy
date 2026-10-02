/**
 * POST /api/admin/leads/valideaza
 * Verifică un oraș, o țară sau o categorie scrisă de mână ÎNAINTE de căutare,
 * ca să nu plătim interogări Google pentru locuri sau termeni care nu există.
 *
 * { tip: 'oras' | 'tara' | 'categorie', text, tara: { cod, nume, limba, orase } }
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { valideazaOras, valideazaTara, valideazaCategorie } from '@/lib/leads/validare'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { tip, text, tara } = await request.json()

    if (tip === 'oras') return NextResponse.json(await valideazaOras(text, tara))
    if (tip === 'tara') return NextResponse.json(await valideazaTara(text))
    if (tip === 'categorie') return NextResponse.json(await valideazaCategorie(text, tara))

    return NextResponse.json({ error: 'Tip de validare necunoscut' }, { status: 400 })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la validare:', error)
    return NextResponse.json(
      { valid: false, mesaj: 'Nu am putut verifica acum — încearcă din nou peste câteva secunde' },
      { status: 200 }
    )
  }
}
