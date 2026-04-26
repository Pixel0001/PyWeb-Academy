import CourseForm from '@/components/admin/CourseForm'
import PermissionGuard from '@/components/admin/PermissionGuard'

export default function NewCoursePage() {
  return (
    <PermissionGuard permission="courses.create">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adaugă curs nou</h1>
          <p className="text-gray-600">Completează detaliile cursului</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <CourseForm />
        </div>
      </div>
    </PermissionGuard>
  )
}
