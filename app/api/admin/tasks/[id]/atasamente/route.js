/**
 * POST   /api/admin/tasks/:id/atasamente — { name, url, size, mimeType } după urcarea în Blob
 * DELETE /api/admin/tasks/:id/atasamente?aid=… — șterge atașamentul (și fișierul)
 */

import { NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import prisma from '@/lib/prisma'
import { cuPermisiune, arePermisiune } from '@/lib/lucru/echipa'
import { logheazaAtasament } from '@/lib/lucru/taskuri'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const { user, eroare, cod } = await cuPermisiune('tasks.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params

  const corp = await request.json().catch(() => ({}))
  const url = String(corp.url || '')
  // Primim doar fișiere urcate în Blob-ul nostru
  if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
    return NextResponse.json({ error: 'Link de fișier invalid.' }, { status: 400 })
  }
  const task = await prisma.task.findUnique({ where: { id }, select: { id: true } }).catch(() => null)
  if (!task) return NextResponse.json({ error: 'Task inexistent' }, { status: 404 })

  const atasament = await prisma.taskAttachment.create({
    data: {
      taskId: id,
      userId: user.id,
      userName: user.name || null,
      name: String(corp.name || 'fișier').slice(0, 200),
      url,
      size: Math.max(0, Number(corp.size) || 0),
      mimeType: corp.mimeType ? String(corp.mimeType).slice(0, 100) : null,
    },
  })
  await logheazaAtasament(id, user, 'ATTACHMENT_ADDED', atasament.name)
  return NextResponse.json({ atasament })
}

export async function DELETE(request, { params }) {
  const { user, eroare, cod } = await cuPermisiune('tasks.view')
  if (eroare) return NextResponse.json(eroare, { status: cod })
  const { id } = await params
  const aid = new URL(request.url).searchParams.get('aid')

  const a = await prisma.taskAttachment.findFirst({ where: { id: aid || undefined, taskId: id } }).catch(() => null)
  if (!a) return NextResponse.json({ error: 'Atașament inexistent' }, { status: 404 })
  if (a.userId !== user.id && !(await arePermisiune('tasks.edit'))) {
    return NextResponse.json({ error: 'Poți șterge doar fișierele urcate de tine.' }, { status: 403 })
  }

  if (process.env.BLOB_READ_WRITE_TOKEN && a.url.includes('blob.vercel-storage.com')) {
    await del(a.url).catch(() => {})
  }
  await prisma.taskAttachment.delete({ where: { id: a.id } })
  await logheazaAtasament(id, user, 'ATTACHMENT_DELETED', a.name)
  return NextResponse.json({ ok: true })
}
