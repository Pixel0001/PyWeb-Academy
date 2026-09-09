/**
 * POST /api/admin/apollo/contacte
 *
 * Adaugă un contact de mână, fără Apollo și fără credite.
 *
 * Rostul principal: să-ți poți pune propria adresă și să vezi cu ochii tăi cum
 * arată emailul care pleacă, cum vine follow-up-ul și cum se opresc când
 * răspunzi — înainte să trimiți ceva unui prospect adevărat.
 *
 * Contactele adăugate așa primesc un `apolloPersonId` sintetic („manual:...")
 * ca să rămână unicitatea din baza de date, dar să se vadă clar că nu vin din
 * baza Apollo.
 */

import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Verificare simplă: ne interesează doar să nu trimitem Apollo o adresă
// evident stricată. Validarea serioasă o face oricum Apollo.
const EMAIL_VALID = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request) {
  try {
    await requireAdmin()

    const permisiune = await checkPermission('apollo.manage')
    if (!permisiune.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea necesară' }, { status: 403 })
    }

    const corp = await request.json()
    const email = String(corp.email || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Emailul e obligatoriu' }, { status: 400 })
    }
    if (!EMAIL_VALID.test(email)) {
      return NextResponse.json({ error: `Adresă invalidă: ${email}` }, { status: 400 })
    }

    // Nu adăugăm de două ori aceeași adresă.
    const existent = await prisma.apolloPersoana.findFirst({
      where: { email },
      select: { id: true, prenume: true, numeFamilie: true },
    })
    if (existent) {
      return NextResponse.json(
        {
          error: `Adresa ${email} e deja în listă.`,
          existentId: existent.id,
        },
        { status: 409 }
      )
    }

    const persoana = await prisma.apolloPersoana.create({
      data: {
        apolloPersonId: `manual:${randomUUID()}`,
        sursa: 'manual',
        esteTest: corp.esteTest !== false, // implicit e test — de aia se adaugă de mână
        prenume: String(corp.prenume || '').trim() || null,
        numeFamilie: String(corp.numeFamilie || '').trim() || null,
        numeMascat: false,
        titlu: String(corp.titlu || '').trim() || null,
        companie: String(corp.companie || '').trim() || null,
        email,
        emailStatus: 'manual',
        domeniu: email.split('@')[1] || null,
        status: 'ENRICHED', // are email, deci e gata de secvență
        crediteFolosite: 0, // n-a costat nimic
        enrichedLa: new Date(),
      },
    })

    return NextResponse.json({ persoana }, { status: 201 })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la adăugarea contactului:', error)
    return NextResponse.json({ error: 'Nu am putut adăuga contactul' }, { status: 500 })
  }
}
