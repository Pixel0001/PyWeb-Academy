export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ProblemForm from '@/components/admin/ProblemForm'
import Link from 'next/link'

export default async function TeacherNewProblemPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !['TEACHER', 'ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect('/login')
  }

  const courses = await prisma.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } })

  return (
    <div className="space-y-4">
      <Link href="/teacher/problems" className="text-indigo-600 hover:underline text-sm">← Înapoi la bancă</Link>
      <h1 className="text-2xl font-bold text-gray-900">+ Adaugă problemă</h1>
      <ProblemForm
        courses={courses}
        apiUrl="/api/teacher/problems"
        backUrl="/teacher/problems"
      />
    </div>
  )
}
