import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { setImpersonation, readImpersonation } from '@/lib/impersonation'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    // Verificăm că este SUPERADMIN ne-impersonat (originalRole, dacă deja impersonează,
    // tot SUPERADMIN trebuie să fie)
    const existing = await readImpersonation()
    const realUserId = existing?.originalUserId || session?.user?.id

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Real user trebuie să fie SUPERADMIN
    const realUser = await prisma.user.findUnique({
      where: { id: realUserId },
      select: { id: true, role: true, active: true }
    })

    if (!realUser || realUser.role !== 'SUPERADMIN' || !realUser.active) {
      return NextResponse.json({ error: 'Doar SUPERADMIN poate impersona conturi' }, { status: 403 })
    }

    const { userId } = await request.json()
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId lipsă' }, { status: 400 })
    }

    if (userId === realUser.id) {
      return NextResponse.json({ error: 'Nu te poți impersona pe tine însuți' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, active: true, name: true }
    })

    if (!target) {
      return NextResponse.json({ error: 'Utilizatorul țintă nu există' }, { status: 404 })
    }
    if (!target.active) {
      return NextResponse.json({ error: 'Contul țintă este dezactivat' }, { status: 400 })
    }
    // Permitem impersonare doar pentru ADMIN și TEACHER
    if (!['ADMIN', 'TEACHER'].includes(target.role)) {
      return NextResponse.json({ error: 'Poți impersona doar conturi de ADMIN sau TEACHER' }, { status: 400 })
    }

    await setImpersonation(realUser.id, target.id)

    // Determinăm unde să redirectăm
    const redirectTo = target.role === 'TEACHER' ? '/teacher' : '/admin'

    return NextResponse.json({ success: true, redirectTo, targetName: target.name, targetRole: target.role })
  } catch (error) {
    console.error('Impersonate start error:', error)
    return NextResponse.json({ error: 'Eroare la pornirea impersonării', details: error.message }, { status: 500 })
  }
}
