export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import StudentForm from '@/components/admin/StudentForm'

export default async function EditStudentPage({ params }) {
  const { id } = await params
  
  const student = await prisma.student.findUnique({
    where: { id }
  })

  if (!student) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editează elev</h1>
        <p className="text-gray-600">{student.fullName}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <StudentForm student={student} />
      </div>
    </div>
  )
}
