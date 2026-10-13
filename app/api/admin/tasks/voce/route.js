/**
 * POST /api/admin/tasks/voce — FormData { audio, tip: task|programare|auto }
 * Întoarce { transcriere, campuri } — formularul se completează, nu se salvează nimic.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkAnyPermission } from '@/lib/permissions'
import { echipa } from '@/lib/lucru/echipa'
import { transcrie, interpreteaza, EroareVoce } from '@/lib/lucru/voce'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request) {
  const { allowed, user } = await checkAnyPermission(['tasks.create', 'appointments.create'])
  if (!user) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  if (!allowed) return NextResponse.json({ error: 'Nu ai voie să creezi taskuri sau programări.' }, { status: 403 })

  const form = await request.formData().catch(() => null)
  const audio = form?.get('audio')
  if (!audio || typeof audio === 'string') {
    return NextResponse.json({ error: 'Lipsește înregistrarea.' }, { status: 400 })
  }
  if (audio.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'Înregistrarea e prea lungă.' }, { status: 400 })
  }
  const tip = ['task', 'programare'].includes(form.get('tip')) ? form.get('tip') : 'auto'

  try {
    const [oameni, proiecte, categorii] = await Promise.all([
      echipa(),
      prisma.project.findMany({ where: { status: { in: ['ACTIVE', 'ON_HOLD'] } }, select: { id: true, name: true }, take: 200 }),
      prisma.category.findMany({ select: { id: true, name: true } }),
    ])
    const mime = audio.type || 'audio/webm'
    const ext = mime.includes('mp4') ? 'mp4' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'webm'
    const transcriere = await transcrie(await audio.arrayBuffer(), mime, `voce.${ext}`)
    if (!transcriere) return NextResponse.json({ error: 'Nu s-a auzit nimic. Mai încearcă o dată.' }, { status: 400 })

    const campuri = await interpreteaza(
      transcriere,
      { echipa: oameni.map((o) => ({ id: o.id, name: o.name || o.email })), proiecte, categorii },
      tip
    )
    return NextResponse.json({ transcriere, campuri })
  } catch (e) {
    console.error('[voce]', e?.message)
    const mesaj = e instanceof EroareVoce ? e.message : `Eroare la procesarea vocii: ${e?.message || ''}`.trim()
    return NextResponse.json({ error: mesaj }, { status: 400 })
  }
}
