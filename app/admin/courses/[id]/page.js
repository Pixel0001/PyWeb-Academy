export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import CourseForm from '@/components/admin/CourseForm'
import PermissionGuard from '@/components/admin/PermissionGuard'

export default async function EditCoursePage({ params }) {
  const { id } = await params
  
  const course = await prisma.course.findUnique({
    where: { id }
  })

  if (!course) {
    notFound()
  }

  return (
    <PermissionGuard permission="courses.edit">
      <div className="space-y-4 xs:space-y-6">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-gray-900">Editează curs</h1>
          <p className="text-sm xs:text-base text-gray-600 line-clamp-1">{course.title}</p>
        </div>

        <div className="bg-white rounded-xl xs:rounded-2xl shadow-sm border border-gray-100 p-3 xs:p-4 sm:p-6">
          <CourseForm course={course} />
        </div>
      </div>
    </PermissionGuard>
  )
}
