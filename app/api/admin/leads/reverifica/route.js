/**
 * POST /api/admin/leads/reverifica
 * Verifică din nou site-urile marcate MORT sau NEADAPTAT_MOBIL (sau altă calitate cerută).
 *
 * Gratuit — nu atinge Google, doar deschide site-urile. Folosit după ce am
 * învățat să recunoaștem site-urile protejate de roboți (Cloudflare etc.):
 * multe „moarte" erau de fapt vii, doar blocau serverul nostru.
 *
 * Lucrează în loturi, cât îi permite timpul; interfața îl cheamă până la `ramase: 0`.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { verificaSite } from '@/lib/leads/site-check'
import { calculeazaScor } from '@/lib/leads/scoring'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300
export const preferredRegion = 'fra1' // aproape de Moldova: verificări de site mai exacte

const BUGET_MS = 240 * 1000
const CONCURENTA = 10
const CALITATI_PERMISE = ['MORT', 'NECLAR', 'LENT', 'FARA_HTTPS', 'NEADAPTAT_MOBIL']

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const corp = await request.json().catch(() => ({}))
    // Implicit: cele „moarte" (multe erau protejate de Cloudflare) și cele „nemobile"
    // (multe aveau design pentru telefon, lipsea doar eticheta viewport)
    const cerute = Array.isArray(corp.calitati) ? corp.calitati : [corp.calitate || 'MORT', 'NEADAPTAT_MOBIL']
    const calitati = cerute.filter((c) => CALITATI_PERMISE.includes(c))
    const calitate = calitati[0] || 'MORT'
    // Ce am verificat deja în runda asta nu se mai ia o dată (ar rămâne MORT și s-ar relua la infinit)
    const inceputRunda = corp.inceputRunda ? new Date(corp.inceputRunda) : new Date()

    const where = {
      calitateSite: { in: calitati.length ? calitati : ['MORT'] },
      siteUrl: { not: null },
      OR: [{ verificatLa: null }, { verificatLa: { lt: inceputRunda } }],
    }

    const start = Date.now()
    const schimbari = {}
    let verificate = 0

    while (Date.now() - start < BUGET_MS) {
      const lot = await prisma.webLead.findMany({
        where,
        select: { id: true, siteUrl: true, rating: true, nrRecenzii: true },
        take: CONCURENTA,
      })
      if (!lot.length) break

      await Promise.all(
        lot.map(async (lead) => {
          let v
          try {
            v = await verificaSite(lead.siteUrl)
          } catch {
            v = null
          }
          await prisma.webLead.update({
            where: { id: lead.id },
            data: v
              ? {
                  calitateSite: v.calitate,
                  observatiiSite: v.observatii,
                  verificatLa: new Date(),
                  scor: calculeazaScor({ calitateSite: v.calitate, rating: lead.rating, nrRecenzii: lead.nrRecenzii }),
                }
              : { verificatLa: new Date() },
          })
          const nou = v?.calitate || calitate
          schimbari[nou] = (schimbari[nou] || 0) + 1
          verificate++
        })
      )
    }

    const ramase = await prisma.webLead.count({ where })

    return NextResponse.json({ verificate, schimbari, ramase, inceputRunda: inceputRunda.toISOString() })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la reverificare:', error)
    return NextResponse.json({ error: 'Nu am putut reverifica site-urile' }, { status: 500 })
  }
}
