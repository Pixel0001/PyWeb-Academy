import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET single submission cu detalii complete
// PATCH { grade, feedback, status: 'GRADED'|'NEEDS_REVISION' } - notează

async function ensureAccess(session, studentId) {
  if (['ADMIN', 'SUPERADMIN'].includes(session.user.role)) return true
  // profesor: trebuie să aibă elevul într-o grupă a sa
  const link = await prisma.groupStudent.findFirst({
    where: { studentId, group: { teacherId: session.user.id, active: true } },
  })
  return !!link
}

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const sub = await prisma.problemSubmission.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, fullName: true, parentName: true, parentEmail: true } },
      problem: true,
      lesson: { include: { module: true } },
    },
  })
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!(await ensureAccess(session, sub.studentId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ submission: sub })
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { grade, feedback, status } = body

  const sub = await prisma.problemSubmission.findUnique({ where: { id } })
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(await ensureAccess(session, sub.studentId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = {
    gradedById: session.user.id,
    gradedAt: new Date(),
    status: status && ['PENDING', 'GRADED', 'NEEDS_REVISION'].includes(status) ? status : 'GRADED',
  }
  if (grade !== null && grade !== undefined) data.grade = Math.max(0, Math.min(100, Number(grade)))
  if (typeof feedback === 'string') data.feedback = feedback

  const updated = await prisma.problemSubmission.update({ where: { id }, data })
  return NextResponse.json({ submission: updated })
}

// DELETE - șterge o submisie (sau mai multe, prin body { ids: [...] })
// NU afectează scorul/XP-ul elevului — ProblemSubmission este standalone (fără FK către XP/bonus).
// Permis pentru ADMIN/SUPERADMIN oricând; profesor doar pentru elevii din grupele sale.
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(session.user.role)

  // bulk delete prin body
  let ids = []
  try {
    const body = await req.json().catch(() => ({}))
    if (Array.isArray(body?.ids)) ids = body.ids.filter(Boolean)
  } catch {}

  if (id && id !== 'bulk') ids = [id]
  if (ids.length === 0) return NextResponse.json({ error: 'Nimic de șters' }, { status: 400 })

  const subs = await prisma.problemSubmission.findMany({
    where: { id: { in: ids } },
    select: { id: true, studentId: true },
  })
  if (subs.length === 0) return NextResponse.json({ deleted: 0 })

  if (!isAdmin) {
    const studentIds = [...new Set(subs.map(s => s.studentId))]
    const allowed = await prisma.groupStudent.findMany({
      where: { studentId: { in: studentIds }, group: { teacherId: session.user.id, active: true } },
      select: { studentId: true }, distinct: ['studentId'],
    })
    const allowedSet = new Set(allowed.map(a => a.studentId))
    const blocked = subs.find(s => !allowedSet.has(s.studentId))
    if (blocked) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await prisma.problemSubmission.deleteMany({ where: { id: { in: subs.map(s => s.id) } } })
  return NextResponse.json({ deleted: result.count })
}
