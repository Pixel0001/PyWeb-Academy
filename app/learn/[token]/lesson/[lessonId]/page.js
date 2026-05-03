export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import LessonRunner from '@/components/public/LessonRunner'
import LessonLoading from './loading'
import { LockClosedIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'

async function LessonContent({ token, lessonId }) {
  // ── BATCH 1: student + lesson în PARALEL ──
  const [student, lesson] = await Promise.all([
    prisma.student.findFirst({ where: { accessToken: token } }),
    prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: { select: { id: true, title: true, slug: true } },
        problems: { orderBy: { lessonOrder: 'asc' } },
      },
    }),
  ])

  if (!student || !lesson) notFound()

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

  const moduleId = lesson.module.id
  const problemIds = lesson.problems.map(p => p.id)

  // ── BATCH 2: TOATE restul în PARALEL (8 query-uri deodată) ──
  const [latestPayment, manualAccesses, manualLessonAccesses, subs, progress, advance, moduleLessons, allProgresses] = await Promise.all([
    prisma.learningPayment.findFirst({ where: { studentId: student.id }, orderBy: { paymentDate: 'desc' } }),
    prisma.moduleAccess.findMany({ where: { studentId: student.id }, select: { moduleId: true } }),
    prisma.lessonAccess.findMany({ where: { studentId: student.id }, select: { lessonId: true } }),
    prisma.problemSubmission.findMany({
      where: { studentId: student.id, lessonId, problemId: { in: problemIds } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.lessonProgress.findUnique({
      where: { studentId_lessonId: { studentId: student.id, lessonId } },
    }),
    prisma.moduleAdvance.findUnique({
      where: { studentId_moduleId: { studentId: student.id, moduleId } },
    }),
    prisma.lesson.findMany({
      where: { moduleId, active: true },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true, isFree: true, _count: { select: { problems: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { studentId: student.id, lesson: { moduleId } },
      select: { lessonId: true, completedAt: true, theoryCompleted: true },
    }),
  ])

  // Acces inline — fără DB call extra
  const subscriptionActive = latestPayment && new Date(latestPayment.expiresAt) > new Date()
  const manualModuleIds = new Set(manualAccesses.map(a => a.moduleId))
  const manualLessonIds = new Set(manualLessonAccesses.map(a => a.lessonId))
  const canAccess = student.superStudent || subscriptionActive || lesson.isFree || manualModuleIds.has(moduleId) || manualLessonIds.has(lesson.id)

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-rose-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-rose-100 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Abonament necesar</h1>
          <p className="text-slate-600 text-sm mb-2">
            Lecția <strong>{lesson.title}</strong> face parte din modulul <strong>{lesson.module.title}</strong> și necesită un abonament activ.
          </p>
          <p className="text-slate-500 text-sm mb-5">
            Vorbește cu profesorul pentru a achita abonamentul și a continua aceste module.{' '}
            <span className="text-emerald-600 font-semibold">Progresul tău este salvat</span> și te așteaptă.
          </p>
          <Link href={`/learn/${token}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
            <ChevronLeftIcon className="w-4 h-4" /> Înapoi la modulele tale
          </Link>
        </div>
      </div>
    )
  }

  const subsByProblem = {}
  for (const s of subs) {
    if (!subsByProblem[s.problemId]) subsByProblem[s.problemId] = []
    subsByProblem[s.problemId].push(s)
  }
  const hintsUsed = Array.isArray(progress?.hintsUsed) ? progress.hintsUsed : []
  const problemsWithSub = lesson.problems.map(p => {
    const all = subsByProblem[p.id] || []
    const latest = all[0] || null
    const allLockedOrCorrect = all.some(s => s.locked || (s.status === 'GRADED' && (s.grade ?? 0) >= 60 && s.autoCorrect !== false))
    const solutionViewed = all.some(s => s.solutionViewed)
    return {
      ...p,
      submission: latest,
      attemptsCount: all.length,
      hintUsed: hintsUsed.includes(p.id) || all.some(s => s.hintUsed),
      locked: allLockedOrCorrect,
      solutionViewed,
    }
  })
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
      grantedLessonIds={[...manualLessonIds]}
    />
  )
}

export default async function LessonPage({ params }) {
  const { token, lessonId } = await params
  return (
    <Suspense fallback={<LessonLoading />}>
      <LessonContent token={token} lessonId={lessonId} />
    </Suspense>
  )
}
