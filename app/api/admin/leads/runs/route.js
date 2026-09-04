/**
 * GET  /api/admin/leads/runs  — istoricul rulărilor
 * POST /api/admin/leads/runs  — pregătește o rulare nouă (fără să cheltuie nimic încă)
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { creeazaRulare } from '@/lib/leads/runner'
import { CONFIG, construiesteInterogari, estimeazaCost } from '@/lib/leads/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.view')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să vezi rulările' }, { status: 403 })
    }

    const rulari = await prisma.leadRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        faza: true,
        orase: true,
        categorii: true,
        idxInterogare: true,
        apeluriApi: true,
        interogariSarite: true,
        costUsd: true,
        firmeTotal: true,
        firmeNoi: true,
        faraSite: true,
        avertisment: true,
        eroare: true,
        startedAt: true,
        finishedAt: true,
      },
    })

    // Câte apeluri am consumat luna asta — limita gratuită e 1000/lună.
    const inceputLuna = new Date()
    inceputLuna.setDate(1)
    inceputLuna.setHours(0, 0, 0, 0)

    const lunaCurenta = await prisma.leadRun.aggregate({
      where: { startedAt: { gte: inceputLuna } },
      _sum: { apeluriApi: true },
    })

    return NextResponse.json({
      rulari: rulari.map((r) => ({
        ...r,
        totalInterogari: Array.isArray(r.orase)
          ? r.orase.length * (r.categorii?.length || 0)
          : 0,
      })),
      apeluriLunaCurenta: lunaCurenta._sum.apeluriApi || 0,
      areCheieGoogle: Boolean(process.env.GOOGLE_API_KEY),
      buget: CONFIG.buget,
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la listarea rulărilor:', error)
    return NextResponse.json({ error: 'Nu am putut încărca rulările' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să pornești rulări' }, { status: 403 })
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Lipsește GOOGLE_API_KEY din variabilele de mediu. Vezi README-LEADURI.md.' },
        { status: 400 }
      )
    }

    const utilizator = await getCurrentUser()
    const { orase, categorii } = await request.json()

    if (!Array.isArray(orase) || !orase.length) {
      return NextResponse.json({ error: 'Alege cel puțin un oraș' }, { status: 400 })
    }
    if (!Array.isArray(categorii) || !categorii.length) {
      return NextResponse.json({ error: 'Alege cel puțin o categorie' }, { status: 400 })
    }

    // Nu lăsăm pe cineva să pornească din greșeală o rulare care depășește plafonul.
    const estimarePrealabila = estimeazaCost(construiesteInterogari(orase, categorii).length)
    if (estimarePrealabila.depasesteLimita) {
      return NextResponse.json(
        {
          error:
            `Selecția asta ar putea ajunge la ${estimarePrealabila.apeluriMax} apeluri API, ` +
            `peste plafonul de ${estimarePrealabila.limita}. Alege mai puține orașe sau categorii.`,
          estimare: estimarePrealabila,
        },
        { status: 400 }
      )
    }

    // Nu pornim o rulare nouă cât timp alta e în curs.
    const inCurs = await prisma.leadRun.findFirst({
      where: { status: { in: ['QUEUED', 'RULEAZA'] } },
    })
    if (inCurs) {
      return NextResponse.json(
        { error: 'Există deja o rulare în curs. Așteapt-o sau anuleaz-o.', runId: inCurs.id },
        { status: 409 }
      )
    }

    const { rulare, estimare } = await creeazaRulare({
      orase,
      categorii,
      createdBy: utilizator?.email || null,
    })

    return NextResponse.json({ rulare, estimare }, { status: 201 })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la crearea rulării:', error)
    return NextResponse.json({ error: 'Nu am putut crea rularea' }, { status: 500 })
  }
}
