export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import PermissionGuard from '@/components/admin/PermissionGuard'
import ProblemForm from '@/components/admin/ProblemForm'
import Link from 'next/link'

export default async function NewProblemPage() {
  return (
    <PermissionGuard permission="problems.create">
      <Content />
    </PermissionGuard>
  )
}

async function Content() {
  const courses = await prisma.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } })
  return (
    <div className="space-y-4">
      <Link href="/admin/problems" className="text-indigo-600 hover:underline text-sm">← Înapoi la bancă</Link>
      <h1 className="text-2xl font-bold text-gray-900">+ Adaugă problemă</h1>
      <ProblemForm courses={courses} />
    </div>
  )
}
