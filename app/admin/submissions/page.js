export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SubmissionsList from '@/components/teacher/SubmissionsList'

export default async function AdminSubmissionsPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(session.user.role)
  if (!isAdmin) redirect('/admin')

  const sp = (await searchParams) || {}
  const status = sp.status || 'PENDING'
  const studentFilter = sp.studentId || ''

  const where = {}
  if (status && status !== 'ALL') where.status = status
  if (studentFilter) where.studentId = studentFilter

  const [submissions, students, counts] = await Promise.all([
    prisma.problemSubmission.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        student: { select: { id: true, fullName: true } },
        problem: { select: { id: true, title: true, difficulty: true, topic: true, type: true } },
        lesson: { select: { id: true, title: true, module: { select: { id: true, title: true } } } },
      },
    }),
    prisma.student.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } }),
    prisma.problemSubmission.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  const countMap = Object.fromEntries(counts.map(c => [c.status, c._count]))
  const total = counts.reduce((s, c) => s + c._count, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold">📨 Submisii Probleme</h1>
          <p className="text-sm text-gray-600">Toate submisiile elevilor — {total} total</p>
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
            href={`/admin/submissions?status=${p.key}${studentFilter ? `&studentId=${studentFilter}` : ''}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${status === p.key ? `bg-${p.color}-600 text-white border-transparent` : `bg-white text-gray-700 border-gray-200 hover:border-${p.color}-300`}`}>
            {p.label} {p.key !== 'ALL' && countMap[p.key] ? <span className="ml-1 text-xs opacity-75">({countMap[p.key]})</span> : null}
          </Link>
        ))}
      </div>

      {/* Student filter */}
      {students.length > 0 && (
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm text-gray-500">Filtrează elev:</span>
          <form method="GET" className="flex gap-2 items-center">
            <input type="hidden" name="status" value={status} />
            <select name="studentId" defaultValue={studentFilter || ''} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5">
              <option value="">Toți elevii</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
            <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm">Aplică</button>
          </form>
        </div>
      )}

      <SubmissionsList
        submissions={submissions}
        students={students}
        currentStudent={studentFilter}
        status={status}
        basePath="/admin/submissions"
      />
    </div>
  )
}
