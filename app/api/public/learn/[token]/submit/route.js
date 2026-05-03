import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAnswer } from '@/lib/problem-utils'
import { getStudentLearningAccess, PAYMENT_LOCK_MESSAGE } from '@/lib/learning-access'
import { getMaxAttempts, gradeForAttempt, applyHintPenalty } from '@/lib/problem-scoring'

// Trimite o submisie de problemă (din lecție sau random)
// POST { problemId, lessonId?, answer?, code?, source: 'lesson'|'random', timeSpent? }

export async function POST(req, { params }) {
  const { token } = await params
  const student = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, active: true },
  })
  if (!student) return NextResponse.json({ error: 'Token invalid' }, { status: 404 })
  if (student.active === false) return NextResponse.json({ error: 'Cont dezactivat' }, { status: 403 })

  const body = await req.json()
  const { problemId, lessonId, answer, code, source = 'lesson', timeSpent = 0 } = body
  if (!problemId) return NextResponse.json({ error: 'problemId obligatoriu' }, { status: 400 })

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    select: { id: true, type: true, difficulty: true, correctAnswer: true, options: true, lessonId: true, points: true },
  })
  if (!problem) return NextResponse.json({ error: 'Problemă inexistentă' }, { status: 404 })

  // Verifică acces
  const access = await getStudentLearningAccess(student.id)
  if (source === 'random') {
    if (!access.canAccessRandom) {
      return NextResponse.json({ error: PAYMENT_LOCK_MESSAGE, locked: true, reason: 'PAYMENT_REQUIRED' }, { status: 403 })
    }
  } else if (lessonId) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { isFree: true, moduleId: true } })
    if (lesson && !access.canAccessLesson(lesson)) {
      return NextResponse.json({ error: PAYMENT_LOCK_MESSAGE, locked: true, reason: 'PAYMENT_REQUIRED' }, { status: 403 })
    }
  }

  // Submisii anterioare pentru aceeași problemă din aceeași lecție/source
  const prevSubs = await prisma.problemSubmission.findMany({
    where: {
      studentId: student.id,
      problemId,
      lessonId: lessonId || null,
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, locked: true, status: true, grade: true, hintUsed: true, attemptNumber: true, autoCorrect: true },
  })

  if (prevSubs.some(s => s.locked)) {
    return NextResponse.json({
      error: 'Problemă blocată. Resetează lecția pentru a încerca din nou.',
      locked: true,
    }, { status: 403 })
  }

  const alreadyCorrect = prevSubs.some(s => s.status === 'GRADED' && (s.grade ?? 0) >= 60 && s.autoCorrect !== false)
  if (alreadyCorrect) {
    return NextResponse.json({
      error: 'Problemă deja rezolvată corect.',
      locked: true,
    }, { status: 403 })
  }

  // Hint folosit pentru această problemă în această lecție
  let hintUsed = false
  if (lessonId) {
    const progress = await prisma.lessonProgress.findUnique({
      where: { studentId_lessonId: { studentId: student.id, lessonId } },
      select: { hintsUsed: true },
    })
    hintUsed = Array.isArray(progress?.hintsUsed) && progress.hintsUsed.includes(problemId)
  }
  if (prevSubs.some(s => s.hintUsed)) hintUsed = true

  const attemptNumber = prevSubs.length + 1
  const maxAttempts = getMaxAttempts(problem)

  // Dacă vine cod (fără answer text), tratează mereu ca CODING → merge la profesor
  const isCoding = problem.type === 'CODING' || (code && !answer)

  let autoCorrect = null
  let status = 'PENDING'
  let grade = null
  let gradedAt = null
  let locked = false

  if (!isCoding) {
    const v = verifyAnswer(problem, answer || '')
    autoCorrect = v.isCorrect
    status = 'GRADED'
    gradedAt = new Date()
    if (autoCorrect) {
      grade = applyHintPenalty(gradeForAttempt(problem, attemptNumber), hintUsed)
      locked = true
    } else {
      grade = 0
      if (attemptNumber >= maxAttempts) locked = true
    }
  }

  const sub = await prisma.problemSubmission.create({
    data: {
      studentId: student.id,
      problemId,
      lessonId: lessonId || null,
      answer: answer || null,
      code: code || null,
      source,
      difficulty: problem.difficulty,
      timeSpent: Number(timeSpent) || 0,
      autoCorrect,
      status,
      grade,
      gradedAt,
      attemptNumber,
      hintUsed,
      locked,
    },
  })

  // Marchează ca citite notificările REVISION_REQUEST pentru această problemă
  // (când elevul reia o problemă cerută la refacere, notificarea persistentă dispare)
  try {
    await prisma.notification.updateMany({
      where: {
        studentId: student.id,
        type: 'REVISION_REQUEST',
        read: false,
        AND: [
          { data: { path: ['problemId'], equals: problemId } },
        ],
      },
      data: { read: true },
    })
  } catch (e) {
    // Pe MongoDB filtrarea pe data JSON poate eșua silențios; fallback manual
    try {
      const notifs = await prisma.notification.findMany({
        where: { studentId: student.id, type: 'REVISION_REQUEST', read: false },
        select: { id: true, data: true },
      })
      const idsToRead = notifs.filter(n => n.data?.problemId === problemId).map(n => n.id)
      if (idsToRead.length > 0) {
        await prisma.notification.updateMany({
          where: { id: { in: idsToRead } },
          data: { read: true },
        })
      }
    } catch {}
  }

  return NextResponse.json({
    submission: sub,
    autoCorrect,
    attemptNumber,
    maxAttempts,
    locked,
    hintUsed,
  }, { status: 201 })
}
