export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import BlogForm from '@/components/admin/BlogForm'
import PermissionGuard from '@/components/admin/PermissionGuard'

export default async function NewBlogPage() {
  const [allCourses, allBlogs] = await Promise.all([
    prisma.course.findMany({ where: { active: true }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.blog.findMany({ select: { id: true, title: true, slug: true }, orderBy: { publishedAt: 'desc' } })
  ])

  return (
    <PermissionGuard permission="blogs.create">
      <div className="space-y-4 xs:space-y-6">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-gray-900">Adaugă blog nou</h1>
          <p className="text-sm xs:text-base text-gray-600">Construiește articolul folosind blocuri de conținut</p>
        </div>
        <div className="bg-white rounded-xl xs:rounded-2xl shadow-sm border border-gray-100 p-3 xs:p-4 sm:p-6">
          <BlogForm allCourses={allCourses} allBlogs={allBlogs} />
        </div>
      </div>
    </PermissionGuard>
  )
}
