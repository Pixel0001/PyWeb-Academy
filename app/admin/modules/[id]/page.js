export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import PermissionGuard from '@/components/admin/PermissionGuard'
import { checkPermission } from '@/lib/permissions'
const ModuleEditor = dynamic(() => import('@/components/admin/ModuleEditor'))
const LessonsManager = dynamic(() => import('@/components/admin/LessonsManager'))
const ModuleAccessManager = dynamic(() => import('@/components/admin/ModuleAccessManager'))

export default async function ModuleDetailPage({ params }) {
  return (
    <PermissionGuard permission="modules.view">
      <Content params={params} />
    </PermissionGuard>
  )
}

async function Content({ params }) {
  const { id } = await params
  const [m, students, canEdit, canAccess] = await Promise.all([
    prisma.learningModule.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { problems: true, submissions: true } } },
        },
        accesses: {
          include: { student: { select: { id: true, fullName: true, accessToken: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.student.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } }),
    checkPermission('modules.edit'),
    checkPermission('modules.access'),
  ])
  if (!m) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/modules" className="hover:text-indigo-600">📚 Module</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{m.title}</span>
      </div>

      <ModuleEditor module={m} canEdit={canEdit.allowed} />

      <LessonsManager moduleId={m.id} lessons={m.lessons} canEdit={canEdit.allowed} />

      {canAccess.allowed && (
        <ModuleAccessManager moduleId={m.id} accesses={m.accesses} students={students} />
      )}
    </div>
  )
}
