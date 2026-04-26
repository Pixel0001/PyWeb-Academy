export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/lib/prisma'
import DeleteCourseButton from '@/components/admin/DeleteCourseButton'
import PermissionGuard from '@/components/admin/PermissionGuard'
import { checkPermission } from '@/lib/permissions'

export default async function CoursesPage() {
  return (
    <PermissionGuard permission="courses.view">
      <CoursesPageContent />
    </PermissionGuard>
  )
}

async function CoursesPageContent() {
  const [canCreate, canEdit, canDelete] = await Promise.all([
    checkPermission('courses.create'),
    checkPermission('courses.edit'),
    checkPermission('courses.delete')
  ])
  
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-4 xs:space-y-6">
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-0">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-gray-900">Cursuri</h1>
          <p className="text-sm xs:text-base text-gray-600">
            Gestionează cursurile disponibile &mdash;{' '}
            <Link href="/#cursuri" target="_blank" className="text-indigo-600 hover:underline text-sm">
              Vezi pe site →
            </Link>
          </p>
        </div>
        {canCreate.allowed && (
          <Link
            href="/admin/courses/new"
            className="px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm xs:text-base font-medium hover:bg-indigo-700 transition-colors text-center whitespace-nowrap"
          >
            + Adaugă curs
          </Link>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vârstă</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preț</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Nu există cursuri. Adaugă primul curs!
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{course.title}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{course.descriptionShort}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{course.category || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {course.ageMin && course.ageMax ? `${course.ageMin}-${course.ageMax} ani` : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{course.price} MDL</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.active ? 'Activ' : 'Inactiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {canEdit.allowed && (
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Editează
                      </Link>
                    )}
                    {canDelete.allowed && (
                      <DeleteCourseButton id={course.id} title={course.title} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3 xs:space-y-4">
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl xs:rounded-2xl shadow-sm border border-gray-100 p-8 xs:p-12 text-center text-gray-500">
            Nu există cursuri. Adaugă primul curs!
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl xs:rounded-2xl shadow-sm border border-gray-100 p-3 xs:p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header cu titlu și status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm xs:text-base leading-tight mb-1">{course.title}</h3>
                    <p className="text-xs xs:text-sm text-gray-500 line-clamp-2">{course.descriptionShort}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 xs:px-2.5 py-0.5 rounded-full text-[10px] xs:text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                    course.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {course.active ? 'Activ' : 'Inactiv'}
                  </span>
                </div>

                {/* Detalii */}
                <div className="grid grid-cols-2 gap-2 xs:gap-3 text-xs xs:text-sm">
                  <div>
                    <span className="text-gray-500 block mb-0.5">Categorie</span>
                    <span className="text-gray-900 font-medium">{course.category || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Vârstă</span>
                    <span className="text-gray-900 font-medium">
                      {course.ageMin && course.ageMax ? `${course.ageMin}-${course.ageMax} ani` : '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block mb-0.5">Preț</span>
                    <span className="text-gray-900 font-semibold text-sm xs:text-base">{course.price} MDL</span>
                  </div>
                </div>

                {/* Acțiuni */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {canEdit.allowed && (
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="flex-1 px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs xs:text-sm font-medium hover:bg-indigo-700 transition-colors text-center"
                    >
                      Editează
                    </Link>
                  )}
                  {canDelete.allowed && (
                    <div className="flex-shrink-0">
                      <DeleteCourseButton id={course.id} title={course.title} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
