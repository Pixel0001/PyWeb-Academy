/**
 * GET /api/admin/leads/export?format=xlsx|csv
 *
 * Descarcă leaduri.xlsx (sau leaduri.csv, identic, ca rezervă).
 * Acceptă aceleași filtre ca lista, ca să pot exporta doar ce mă interesează.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { construiesteXlsx, construiesteCsv } from '@/lib/leads/export'
import { construiesteFiltre, construiesteOrdine } from '../route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să exporți lead-urile' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'xlsx').toLowerCase()

    // Exact aceleași filtre ca lista de pe ecran — ce vezi e ce iese în fișier.
    const where = await construiesteFiltre(searchParams)
    const orderBy = construiesteOrdine(searchParams.get('sortare'))

    const leaduri = await prisma.webLead.findMany({ where, orderBy })

    if (!leaduri.length) {
      return NextResponse.json({ error: 'Nu există lead-uri de exportat' }, { status: 404 })
    }

    const dataAzi = new Date().toISOString().slice(0, 10)

    if (format === 'csv') {
      const csv = construiesteCsv(leaduri)
      return new NextResponse(csv, {
        headers: {
          // UTF-8 cu BOM — ca să nu strice Excel-ul diacriticele
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="leaduri-${dataAzi}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    const xlsx = await construiesteXlsx(leaduri)
    return new NextResponse(xlsx, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="leaduri-${dataAzi}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la export:', error)
    return NextResponse.json({ error: 'Exportul a eșuat' }, { status: 500 })
  }
}
