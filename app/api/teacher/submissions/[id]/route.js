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
  }
  if (typeof grade === 'number') data.grade = Math.max(0, Math.min(100, grade))
  if (typeof feedback === 'string') data.feedback = feedback
  if (status && ['PENDING', 'GRADED', 'NEEDS_REVISION'].includes(status)) data.status = status
  else if (typeof grade === 'number') data.status = 'GRADED'

  const updated = await prisma.problemSubmission.update({ where: { id }, data })
  return NextResponse.json({ submission: updated })
}
