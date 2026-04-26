import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import TeacherSidebar from '@/components/teacher/TeacherSidebar'
import TeacherHeader from '@/components/teacher/TeacherHeader'

export default async function TeacherLayout({ children }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Only allow TEACHER, ADMIN and SUPERADMIN roles
  if (!['SUPERADMIN', 'TEACHER', 'ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherSidebar />
      <div className="lg:pl-64">
        <TeacherHeader user={session.user} />
        <main className="p-3 xs:p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
