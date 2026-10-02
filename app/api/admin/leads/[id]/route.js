/**
 * PATCH  /api/admin/leads/[id] — status, recontactare, responsabil, și datele
 *                                firmei (din fereastra „Editează").
 * DELETE /api/admin/leads/[id] — șterge un lead (cu notițele lui).
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { VALORI_STATUS, VALORI_SURSA, STATUSURI_APEL } from '@/lib/leads/statusuri'
import { calculeazaScor } from '@/lib/leads/scoring'
import { verificaSite } from '@/lib/leads/site-check'
import { INCLUDE_LISTA, normalizeazaSite } from '../route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30
export const preferredRegion = 'fra1' // aproape de Moldova: verificări de site mai exacte

/** Textul tăiat la o lungime rezonabilă; gol → null. */
const text = (v, max) => String(v ?? '').trim().slice(0, max) || null

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('leads.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const { id } = await params
    const corp = await request.json()
    const date = {}

    if (corp.status !== undefined) {
      if (!VALORI_STATUS.includes(corp.status)) {
        return NextResponse.json({ error: `Status invalid: ${corp.status}` }, { status: 400 })
      }
      date.status = corp.status
      // „Fără răspuns", „Contactat", „Follow up..." = am sunat acum
      if (STATUSURI_APEL.includes(corp.status) && corp.dataApel === undefined) {
        date.dataApel = new Date()
      }
    }

    if (corp.notite !== undefined) date.notite = String(corp.notite).slice(0, 5000)
    if (corp.dataApel !== undefined) {
      date.dataApel = corp.dataApel ? new Date(corp.dataApel) : null
    }

    // Recontactarea: dată + oră, sau null ca s-o scoatem din listă.
    if (corp.nextFollowUpAt !== undefined) {
      if (!corp.nextFollowUpAt) {
        date.nextFollowUpAt = null
      } else {
        const cand = new Date(corp.nextFollowUpAt)
        if (Number.isNaN(cand.getTime())) {
          return NextResponse.json({ error: 'Dată de recontactare invalidă' }, { status: 400 })
        }
        date.nextFollowUpAt = cand
      }
    }

    // Cine se ocupă de firma asta — primește notificările în privat.
    if (corp.responsabilId !== undefined) {
      date.responsabilId = corp.responsabilId || null
    }

    // ── Datele firmei, din fereastra „Editează" ─────────────────────
    if (corp.denumire !== undefined) {
      const denumire = text(corp.denumire, 200)
      if (!denumire) return NextResponse.json({ error: 'Numele nu poate fi gol' }, { status: 400 })
      date.denumire = denumire
    }
    if (corp.telefon !== undefined) {
      date.telefon = text(corp.telefon, 40)
      date.telefonLocal = date.telefon
    }
    if (corp.oras !== undefined) date.oras = text(corp.oras, 80)
    if (corp.adresa !== undefined) date.adresa = text(corp.adresa, 300)
    if (corp.categorie !== undefined) date.categoriePrincipala = text(corp.categorie, 100)
    if (corp.sursaDetaliu !== undefined) date.sursaDetaliu = text(corp.sursaDetaliu, 300)
    if (corp.sursa !== undefined) {
      if (!VALORI_SURSA.includes(corp.sursa)) {
        return NextResponse.json({ error: `Sursă invalidă: ${corp.sursa}` }, { status: 400 })
      }
      date.sursa = corp.sursa
    }

    // Site schimbat → îl verificăm din nou și refacem scorul
    if (corp.siteUrl !== undefined) {
      const vechi = await prisma.webLead.findUnique({
        where: { id },
        select: { siteUrl: true, rating: true, nrRecenzii: true },
      })
      if (!vechi) return NextResponse.json({ error: 'Lead inexistent' }, { status: 404 })

      const siteUrl = normalizeazaSite(corp.siteUrl)
      if (siteUrl !== (vechi.siteUrl || null)) {
        date.siteUrl = siteUrl
        try {
          const v = await verificaSite(siteUrl)
          date.calitateSite = v.calitate
          date.observatiiSite = v.observatii
          date.verificatLa = new Date()
          date.scor = calculeazaScor({
            calitateSite: v.calitate,
            rating: vechi.rating,
            nrRecenzii: vechi.nrRecenzii,
          })
        } catch {
          /* rămâne neverificat */
        }
      }
    }

    if (!Object.keys(date).length) {
      return NextResponse.json({ error: 'Nimic de actualizat' }, { status: 400 })
    }

    const lead = await prisma.webLead.update({ where: { id }, data: date, include: INCLUDE_LISTA })
    return NextResponse.json({ lead })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la actualizarea lead-ului:', error)
    return NextResponse.json({ error: 'Nu am putut actualiza lead-ul' }, { status: 500 })
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
    // Notițele se șterg odată cu lead-ul (onDelete: Cascade nu e garantat pe Mongo)
    await prisma.webLeadNota.deleteMany({ where: { webLeadId: id } })
    await prisma.webLead.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la ștergerea lead-ului:', error)
    return NextResponse.json({ error: 'Nu am putut șterge lead-ul' }, { status: 500 })
  }
}
