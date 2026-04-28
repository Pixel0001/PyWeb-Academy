import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AttendanceHistoryClient from '@/components/teacher/AttendanceHistoryClient'

export const dynamic = 'force-dynamic'

export default async function TeacherAttendancePage() {
  const session = await getServerSession(authOptions)

  // Get last 200 sessions for teacher's groups
  const sessions = await prisma.lessonSession.findMany({
    where: {
      group: { teacherId: session.user.id }
    },
    select: {
      id: true,
      date: true,
      groupId: true,
      lessonsDeducted: true,
      group: {
        select: {
          name: true,
          course: { select: { title: true } },
        }
      },
      attendances: {
        select: { status: true }
      }
    },
    orderBy: { date: 'desc' },
    take: 200,
  })

  // Serialize Date -> ISO string for client component
  const serialized = sessions.map(s => ({
    ...s,
    date: s.date instanceof Date ? s.date.toISOString() : s.date,
  }))

  return (
    <div className="space-y-4 xs:space-y-5 md:space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl xs:text-2xl md:text-3xl font-bold text-gray-900">Istoric Prezențe</h1>
          <p className="text-gray-600 mt-1 text-xs xs:text-sm md:text-base">
            Filtrează după grupă, status sau dată — ultimele 200 de sesiuni
          </p>
        </div>
        <Link
          href="/teacher/groups"
          className="text-teal-600 hover:text-teal-700 text-xs xs:text-sm font-medium"
        >
          Vezi grupele tale →
        </Link>
      </div>

      <AttendanceHistoryClient sessions={serialized} />
    </div>
  )
}
