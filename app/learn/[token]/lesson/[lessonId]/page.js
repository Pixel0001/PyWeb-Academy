export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import LessonRunner from '@/components/public/LessonRunner'
import { LockClosedIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'

export default async function LessonPage({ params }) {
  const { token, lessonId } = await params
  const student = await prisma.student.findFirst({ where: { accessToken: token } })
  if (!student) notFound()
  if (student.active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md bg-white rounded-2xl shadow-lg border border-rose-200 p-8 text-center">
          <LockClosedIcon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900">Cont dezactivat</h1>
          <p className="text-sm text-gray-600 mt-2">Contul tău este momentan dezactivat. Te rugăm să contactezi profesorul.</p>
        </div>
      </div>
    )
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { select: { id: true, title: true, slug: true } },
      problems: { orderBy: { lessonOrder: 'asc' } },
    },
  })
  if (!lesson) notFound()

  // Acces?
  let access = student.superStudent || lesson.isFree
  if (!access) {
    const ma = await prisma.moduleAccess.findUnique({
      where: { studentId_moduleId: { studentId: student.id, moduleId: lesson.module.id } },
    })
    access = !!ma
  }

  if (!access) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-7 h-7 text-slate-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Lectia e platita</h1>
          <p className="text-slate-500 text-sm mb-5">Ai nevoie de acces la modulul <strong className="text-slate-800">{lesson.module.title}</strong>. Contacteaza profesorul.</p>
          <Link href={`/learn/${token}`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            <ChevronLeftIcon className="w-4 h-4" /> Inapoi
          </Link>
        </div>
      </div>
    )
  }

  // Submisii existente
  const subs = await prisma.problemSubmission.findMany({
    where: { studentId: student.id, lessonId, problemId: { in: lesson.problems.map(p => p.id) } },
    orderBy: { createdAt: 'desc' },
  })
  const subByProblem = {}
  for (const s of subs) if (!subByProblem[s.problemId]) subByProblem[s.problemId] = s

  const problemsWithSub = lesson.problems.map(p => ({ ...p, submission: subByProblem[p.id] || null }))

  const progress = await prisma.lessonProgress.findUnique({
    where: { studentId_lessonId: { studentId: student.id, lessonId } },
  })

  const advance = await prisma.moduleAdvance.findUnique({
    where: { studentId_moduleId: { studentId: student.id, moduleId: lesson.module.id } },
  })

  // Toate lectiile modulului + progresul lor
  const [moduleLessons, allProgresses] = await Promise.all([
    prisma.lesson.findMany({
      where: { moduleId: lesson.module.id, active: true },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true, isFree: true, _count: { select: { problems: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { studentId: student.id, lesson: { moduleId: lesson.module.id } },
      select: { lessonId: true, completedAt: true, theoryCompleted: true },
    }),
  ])
  const progressByLesson = Object.fromEntries(allProgresses.map(p => [p.lessonId, p]))

  return (
    <LessonRunner
      token={token}
      lesson={lesson}
      problems={problemsWithSub}
      initialProgress={progress}
      advanceGranted={!!advance}
      moduleLessons={moduleLessons}
      progressByLesson={progressByLesson}
      superStudent={student.superStudent ?? false}
    />
  )
}
