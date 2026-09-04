/**
 * GET    /api/admin/leads/runs/[id]  — progresul unei rulări (interfața face poll)
 * DELETE /api/admin/leads/runs/[id]  — oprește rularea
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { anuleazaRulare, rezumatRulare } from '@/lib/leads/runner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { id } = await params
    const rulare = await prisma.leadRun.findUnique({ where: { id } })
    if (!rulare) {
      return NextResponse.json({ error: 'Rularea nu există' }, { status: 404 })
    }

    const interogari = Array.isArray(rulare.interogari) ? rulare.interogari : []
    const loguri = Array.isArray(rulare.loguri) ? rulare.loguri : []

    return NextResponse.json({
      rulare: {
        ...rulare,
        interogari: undefined, // lista întreagă e mare — trimitem doar rezumatul
        loguri: loguri.slice(-60),
      },
      progres: {
        totalInterogari: interogari.length,
        interogariFacute: rulare.idxInterogare,
        procent: interogari.length
          ? Math.round((rulare.idxInterogare / interogari.length) * 100)
          : 0,
      },
      rezumat: rezumatRulare(rulare),
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la citirea rulării:', error)
    return NextResponse.json({ error: 'Nu am putut citi rularea' }, { status: 500 })
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
    const rulare = await anuleazaRulare(id)
    return NextResponse.json({ rulare })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la anularea rulării:', error)
    return NextResponse.json({ error: 'Nu am putut anula rularea' }, { status: 500 })
  }
}
