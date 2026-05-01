export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import RandomProblemsRunner from '@/components/public/RandomProblemsRunner'

export default async function RandomPage({ params }) {
  const { token } = await params
  const student = await prisma.student.findFirst({ where: { accessToken: token }, select: { id: true, fullName: true, active: true } })
  if (!student) notFound()
  if (student.active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md bg-white rounded-2xl shadow-lg border border-rose-200 p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900">Cont dezactivat</h1>
          <p className="text-sm text-gray-600 mt-2">Contul tău este momentan dezactivat.</p>
        </div>
      </div>
    )
  }

  const topics = await prisma.problem.findMany({
    where: { active: true }, distinct: ['topic'], select: { topic: true }, take: 100,
  })

  return <RandomProblemsRunner token={token} student={student} topics={topics.map(t => t.topic).filter(Boolean).sort()} />
}
