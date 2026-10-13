/**
 * POST /api/admin/tasks/:id/comentarii — { body }
 */

import { NextResponse } from 'next/server'
import { cuPermisiune } from '@/lib/lucru/echipa'
import { adaugaComentariu } from '@/lib/lucru/taskuri'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const { user, eroare, cod } = await cuPermisiune('tasks.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params

  try {
    const { body } = await request.json()
    const comentariu = await adaugaComentariu(id, user, body)
    return NextResponse.json({ comentariu })
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Nu am putut salva comentariul.' }, { status: 400 })
  }
}
