/**
 * PATCH /api/admin/profil  { name }
 *
 * Fiecare om își schimbă singur numele afișat — cel cu care se semnează
 * mesajele de WhatsApp ({{numele_meu}}). Doar propriul cont, doar numele.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/session'
import { createAuditLog } from '@/lib/security/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(request) {
  try {
    await requireAdmin()
    const utilizator = await getCurrentUser()
    if (!utilizator?.email) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

    const { name } = await request.json()
    const nume = String(name || '').trim().replace(/\s+/g, ' ')

    if (nume.length < 2 || nume.length > 60) {
      return NextResponse.json({ error: 'Numele trebuie să aibă între 2 și 60 de caractere' }, { status: 400 })
    }
    // Doar litere, spații, cratimă, apostrof, punct — e numele dintr-un mesaj, nu un text liber
    if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(nume)) {
      return NextResponse.json({ error: 'Numele poate conține doar litere, spații și cratimă' }, { status: 400 })
    }

    const inainte = await prisma.user.findUnique({
      where: { email: utilizator.email },
      select: { id: true, name: true },
    })
    if (!inainte) return NextResponse.json({ error: 'Cont negăsit' }, { status: 404 })

    await prisma.user.update({ where: { id: inainte.id }, data: { name: nume } })

    await createAuditLog({
      action: 'profile_name_change',
      actorId: inainte.id,
      targetId: inainte.id,
      targetType: 'user',
      details: { de: inainte.name, la: nume },
    })

    return NextResponse.json({ name: nume })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la schimbarea numelui:', error)
    return NextResponse.json({ error: 'Nu am putut salva numele' }, { status: 500 })
  }
}
