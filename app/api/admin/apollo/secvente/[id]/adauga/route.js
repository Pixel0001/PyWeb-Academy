/**
 * POST /api/admin/apollo/secvente/[id]/adauga
 *
 * Bagă contactele în secvență. De aici încolo Apollo trimite emailurile,
 * inclusiv follow-up-urile, după pașii secvenței.
 *
 * Înainte de asta verificăm sănătatea mailbox-ului: dacă dă bounce-uri sau
 * ajunge în spam, refuzăm. Un domeniu ars nu se mai repară ușor, iar Apollo
 * oprește singur secvența dacă bounce-ul trece de pragul lui.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'
import { adaugaInSecventa, creeazaContact, listeazaMailboxuri } from '@/lib/apollo/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request, { params }) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să trimiți emailuri' }, { status: 403 })
    }

    const { id: secventaId } = await params
    const { persoaneIds, mailboxIds, ignoraAvertismente } = await request.json()

    if (!Array.isArray(persoaneIds) || !persoaneIds.length) {
      return NextResponse.json({ error: 'Niciun contact selectat' }, { status: 400 })
    }
    if (!Array.isArray(mailboxIds) || !mailboxIds.length) {
      return NextResponse.json({ error: 'Alege cel puțin o adresă de expediere' }, { status: 400 })
    }

    // ── Sănătatea mailbox-urilor alese ────────────────────────────
    const toate = await listeazaMailboxuri()
    const alese = toate.filter((m) => mailboxIds.includes(m.id))

    if (alese.length !== mailboxIds.length) {
      return NextResponse.json({ error: 'Un mailbox ales nu mai există în Apollo' }, { status: 400 })
    }

    const bolnave = alese.filter((m) => !m.poateTrimite)
    if (bolnave.length && !ignoraAvertismente) {
      return NextResponse.json(
        {
          error: 'Mailbox în stare proastă — trimiterea a fost oprită.',
          mailboxuriProblema: bolnave.map((m) => ({ email: m.email, probleme: m.probleme })),
          potiIgnora: true,
        },
        { status: 409 }
      )
    }

    // ── Persoanele trebuie să aibă email ──────────────────────────
    const persoane = await prisma.apolloPersoana.findMany({
      where: { id: { in: persoaneIds }, email: { not: null } },
    })

    if (!persoane.length) {
      return NextResponse.json(
        { error: 'Niciunul dintre cei aleși nu are email. Fă întâi enrich.' },
        { status: 400 }
      )
    }

    // ── Într-o secvență intră „contacte", nu „persoane" ───────────
    const contactIds = []
    const esecuri = []

    for (const p of persoane) {
      if (p.apolloContactId) {
        contactIds.push(p.apolloContactId)
        continue
      }
      try {
        const contactId = await creeazaContact(p)
        if (contactId) {
          contactIds.push(contactId)
          await prisma.apolloPersoana.update({
            where: { id: p.id },
            data: { apolloContactId: contactId },
          })
        } else {
          esecuri.push(`${p.email}: Apollo n-a întors un id de contact`)
        }
      } catch (err) {
        esecuri.push(`${p.email}: ${err.message}`)
      }
    }

    if (!contactIds.length) {
      return NextResponse.json(
        { error: 'N-am putut crea niciun contact în Apollo', detalii: esecuri },
        { status: 500 }
      )
    }

    const rezultat = await adaugaInSecventa(secventaId, contactIds, mailboxIds)

    await prisma.apolloPersoana.updateMany({
      where: { id: { in: persoane.map((p) => p.id) } },
      data: { status: 'IN_SECVENTA', adaugatInSecventaLa: new Date() },
    })

    return NextResponse.json({
      adaugate: rezultat.adaugate,
      contacteCreate: contactIds.length,
      mailboxuri: alese.map((m) => m.email),
      esecuri,
      avertismenteIgnorate: bolnave.map((m) => m.email),
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la adăugarea în secvență:', error)
    return NextResponse.json({ error: error.message || 'Adăugarea a eșuat' }, { status: 500 })
  }
}
