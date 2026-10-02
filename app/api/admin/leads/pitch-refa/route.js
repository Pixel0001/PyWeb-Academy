/**
 * Refacerea cu AI a pitch-urilor care au ieșit din șablon.
 *
 * Când OpenAI n-a mers (parametri refuzați, credite terminate), rularea a
 * pus pitch-ul din șablon — corect, dar generic. După ce AI-ul merge din nou,
 * le refacem doar pe acelea: le recunoaștem pentru că textul lor e exact cel
 * pe care l-ar da șablonul pentru firma respectivă.
 *
 * GET  — câte sunt de refăcut (fără să schimbe nimic)
 * POST — le reface cât îi permite timpul; interfața îl cheamă până la `ramase: 0`.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { genereazaPitchuri, pitchSablon, vorbimRomana, furnizorPitch } from '@/lib/leads/pitch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BUGET_MS = 230 * 1000
const PE_RUNDA = 60 // 3 loturi a câte 20, în paralel

/** Lead-urile românești al căror pitch e exact cel din șablon. */
async function dinSablon() {
  const toate = await prisma.webLead.findMany({
    where: { pitch: { not: null } },
    orderBy: { scor: 'desc' },
  })
  return toate.filter((l) => vorbimRomana(l) && l.pitch === pitchSablon(l))
}

async function areVoie() {
  await requireAdmin()
  return (await checkPermission('leads.manage')).allowed
}

function eroare(error) {
  if (['Unauthorized', 'Forbidden'].includes(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
  console.error('Eroare la refacerea pitch-urilor:', error)
  return NextResponse.json({ error: 'Nu am putut reface pitch-urile' }, { status: 500 })
}

export async function GET() {
  try {
    if (!(await areVoie())) return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    const lista = await dinSablon()
    return NextResponse.json({ deRefacut: lista.length, areAI: furnizorPitch().nume === 'openai' })
  } catch (error) {
    return eroare(error)
  }
}

export async function POST() {
  try {
    if (!(await areVoie())) return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    if (furnizorPitch().nume !== 'openai') {
      return NextResponse.json({ error: 'Lipsește OPENAI_API_KEY — pitch-urile nu se pot face cu AI' }, { status: 400 })
    }

    const start = Date.now()
    const termen = {
      expirat: () => Date.now() - start >= BUGET_MS,
      ramasMs: () => Math.max(0, BUGET_MS - (Date.now() - start)),
      scursMs: () => Date.now() - start,
    }

    const lista = await dinSablon()
    let refacute = 0
    let cost = 0
    const erori = []

    for (let i = 0; i < lista.length && !termen.expirat(); i += PE_RUNDA) {
      const lot = lista.slice(i, i + PE_RUNDA)
      const rez = await genereazaPitchuri(lot, { termen })
      cost += rez.cost || 0
      erori.push(...rez.erori)

      // Salvăm doar ce a scris AI-ul; ce a căzut iar pe șablon rămâne pentru data viitoare
      const bune = lot.filter((l) => {
        const nou = rez.pitchuri.get(l.placeId)
        return nou && nou !== pitchSablon(l)
      })
      await Promise.all(
        bune.map((l) => prisma.webLead.update({ where: { id: l.id }, data: { pitch: rez.pitchuri.get(l.placeId) } }))
      )
      refacute += bune.length

      // AI-ul nu mai scrie nimic (ex. credite terminate) — nu ardem timpul degeaba
      if (!bune.length) break
    }

    return NextResponse.json({
      refacute,
      ramase: Math.max(lista.length - refacute, 0),
      cost: Math.round(cost * 10000) / 10000,
      erori: [...new Set(erori)].slice(0, 3),
    })
  } catch (error) {
    return eroare(error)
  }
}
