export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import BlogForm from '@/components/admin/BlogForm'
import PermissionGuard from '@/components/admin/PermissionGuard'

export default async function EditBlogPage({ params }) {
  const { id } = await params

  const [blog, allCourses, allBlogs] = await Promise.all([
    prisma.blog.findUnique({ where: { id } }),
    prisma.course.findMany({ where: { active: true }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.blog.findMany({ select: { id: true, title: true, slug: true }, orderBy: { publishedAt: 'desc' } })
  ])

  if (!blog) notFound()

  return (
    <PermissionGuard permission="blogs.edit">
      <div className="space-y-4 xs:space-y-6">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-gray-900">Editează blog</h1>
          <p className="text-sm xs:text-base text-gray-600 line-clamp-1">{blog.title}</p>
        </div>
        <div className="bg-white rounded-xl xs:rounded-2xl shadow-sm border border-gray-100 p-3 xs:p-4 sm:p-6">
          <BlogForm blog={blog} allCourses={allCourses} allBlogs={allBlogs} />
        </div>
      </div>
    </PermissionGuard>
  )
}
