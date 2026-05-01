export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SubmissionsList from '@/components/teacher/SubmissionsList'

export default async function TeacherSubmissionsPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const sp = (await searchParams) || {}
  const status = sp.status || 'PENDING'
  const studentFilter = sp.studentId || ''
  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(session.user.role)

  // Build where for teacher view
  let studentIdsScope = null
  if (!isAdmin) {
    const tlinks = await prisma.groupStudent.findMany({
      where: { group: { teacherId: session.user.id, active: true } },
      select: { studentId: true }, distinct: ['studentId'],
    })
    studentIdsScope = tlinks.map(t => t.studentId)
  }

  const where = {}
  if (studentIdsScope) where.studentId = { in: studentIdsScope }
  if (status && status !== 'ALL') where.status = status
  if (studentFilter) where.studentId = studentFilter

  const [submissions, students, counts] = await Promise.all([
    prisma.problemSubmission.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        student: { select: { id: true, fullName: true } },
        problem: { select: { id: true, title: true, difficulty: true, topic: true, type: true } },
        lesson: { select: { id: true, title: true, module: { select: { id: true, title: true } } } },
      },
    }),
    studentIdsScope
      ? prisma.student.findMany({ where: { id: { in: studentIdsScope } }, select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } })
      : prisma.student.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } }),
    prisma.problemSubmission.groupBy({
      by: ['status'],
      where: studentIdsScope ? { studentId: { in: studentIdsScope } } : {},
      _count: true,
    }),
  ])

  const countMap = Object.fromEntries(counts.map(c => [c.status, c._count]))

  return (
    <div className="space-y-4">
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold">📨 Submisii Probleme</h1>
          <p className="text-sm text-gray-600">Răspunsurile elevilor — verifică, notează, dă feedback</p>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'PENDING', label: '⏳ În așteptare', color: 'amber' },
          { key: 'GRADED', label: '✅ Notate', color: 'emerald' },
          { key: 'NEEDS_REVISION', label: '⚠️ Refacere', color: 'red' },
          { key: 'ALL', label: 'Toate', color: 'gray' },
        ].map(p => (
          <Link key={p.key}
            href={`/teacher/submissions?status=${p.key}${studentFilter ? `&studentId=${studentFilter}` : ''}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${status === p.key ? `bg-${p.color}-600 text-white border-transparent` : `bg-white text-gray-700 border-gray-200 hover:border-${p.color}-300`}`}>
            {p.label} {p.key !== 'ALL' && countMap[p.key] ? <span className="ml-1 text-xs opacity-75">({countMap[p.key]})</span> : null}
          </Link>
        ))}
      </div>

      <SubmissionsList submissions={submissions} students={students} currentStudent={studentFilter} status={status} />
    </div>
  )
}
