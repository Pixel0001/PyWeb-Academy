/**
 * GET  /api/admin/sabloane  — lista șabloanelor (active, sau toate cu ?toate=1)
 * POST /api/admin/sabloane  — creează un șablon nou
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/session'
import { checkPermission, checkAnyPermission } from '@/lib/permissions'
import { variabileNecunoscute } from '@/lib/leads/sabloane'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await requireAdmin()

    // Cine lucrează lead-urile trebuie să poată alege un șablon la butonul de
    // WhatsApp, chiar dacă nu are acces la pagina de gestionare a șabloanelor.
    const permisiune = await checkAnyPermission(['sabloane.view', 'leads.view'])
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const toate = searchParams.get('toate') === '1'

    const sabloane = await prisma.sablonMesaj.findMany({
      where: toate ? {} : { activ: true },
      orderBy: [{ ordine: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ sabloane })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Nu am putut încărca șabloanele' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('sabloane.create')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să creezi șabloane' }, { status: 403 })
    }

    const { nume, text, categorie } = await request.json()

    if (!nume?.trim()) return NextResponse.json({ error: 'Dă-i un nume șablonului' }, { status: 400 })
    if (!text?.trim()) return NextResponse.json({ error: 'Șablonul e gol' }, { status: 400 })

    // O variabilă scrisă greșit ar pleca literal în mesaj — o prindem de acum.
    const gresite = variabileNecunoscute(text)
    if (gresite.length) {
      return NextResponse.json(
        { error: `Variabile necunoscute: ${gresite.map((g) => `{{${g}}}`).join(', ')}` },
        { status: 400 }
      )
    }

    const utilizator = await getCurrentUser()
    const ultimul = await prisma.sablonMesaj.findFirst({ orderBy: { ordine: 'desc' } })

    const sablon = await prisma.sablonMesaj.create({
      data: {
        nume: nume.trim().slice(0, 100),
        text: text.trim().slice(0, 4000),
        categorie: categorie?.trim() || null,
        ordine: (ultimul?.ordine ?? -1) + 1,
        createdBy: utilizator?.email || null,
      },
    })

    return NextResponse.json({ sablon }, { status: 201 })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la crearea șablonului:', error)
    return NextResponse.json({ error: 'Nu am putut salva șablonul' }, { status: 500 })
  }
}
