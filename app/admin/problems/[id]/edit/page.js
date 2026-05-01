export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import PermissionGuard from '@/components/admin/PermissionGuard'
import ProblemForm from '@/components/admin/ProblemForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditProblemPage({ params }) {
  return (
    <PermissionGuard permission="problems.edit">
      <Content params={params} />
    </PermissionGuard>
  )
}

async function Content({ params }) {
  const { id } = await params
  const [problem, courses] = await Promise.all([
    prisma.problem.findUnique({ where: { id } }),
    prisma.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ])
  if (!problem) notFound()

  return (
    <div className="space-y-4">
      <Link href="/admin/problems" className="text-indigo-600 hover:underline text-sm">← Înapoi la bancă</Link>
      <h1 className="text-2xl font-bold text-gray-900">✏️ Editează problemă</h1>
      <ProblemForm problem={problem} courses={courses} />
    </div>
  )
}
