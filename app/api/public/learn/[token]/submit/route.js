import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAnswer } from '@/lib/problem-utils'
import { getStudentLearningAccess, PAYMENT_LOCK_MESSAGE } from '@/lib/learning-access'

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
    select: { id: true, type: true, difficulty: true, correctAnswer: true, options: true, lessonId: true },
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

  // Dacă vine cod (fără answer text), tratează mereu ca CODING → merge la profesor
  const isCoding = problem.type === 'CODING' || (code && !answer)

  // Verificare automată doar pentru non-CODING
  let autoCorrect = null
  let status = 'PENDING'
  let grade = null
  let gradedAt = null
  if (!isCoding) {
    const v = verifyAnswer(problem, answer || '')
    autoCorrect = v.isCorrect
    status = 'GRADED'
    grade = autoCorrect ? 100 : 0
    gradedAt = new Date()
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
    },
  })

  return NextResponse.json({ submission: sub, autoCorrect }, { status: 201 })
}
