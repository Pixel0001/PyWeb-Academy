export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import RandomProblemsRunner from '@/components/public/RandomProblemsRunner'

export default async function RandomPage({ params }) {
  const { token } = await params
  const student = await prisma.student.findFirst({ where: { accessToken: token }, select: { id: true, fullName: true } })
  if (!student) notFound()

  const topics = await prisma.problem.findMany({
    where: { active: true }, distinct: ['topic'], select: { topic: true }, take: 100,
  })

  return <RandomProblemsRunner token={token} student={student} topics={topics.map(t => t.topic).filter(Boolean).sort()} />
}
