import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getStudentLearningAccess, PAYMENT_LOCK_MESSAGE } from '@/lib/learning-access'

// Detaliul lecției pentru elev — teoria + problemele (fără răspunsuri/explicații înainte de submit)

async function findStudent(token) {
  return prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, fullName: true },
  })
}

export async function GET(req, { params }) {
  const { token, lessonId } = await params
  const student = await findStudent(token)
  if (!student) return NextResponse.json({ error: 'Token invalid' }, { status: 404 })

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { select: { id: true, slug: true, title: true } },
      problems: {
        orderBy: { lessonOrder: 'asc' },
        select: {
          id: true, title: true, description: true, type: true, difficulty: true,
          options: true, starterCode: true, hint: true, points: true, language: true,
          lessonOrder: true,
        },
      },
    },
  })
  if (!lesson) return NextResponse.json({ error: 'Lecție inexistentă' }, { status: 404 })

  // Verifică acces folosind helper-ul centralizat
  const access = await getStudentLearningAccess(student.id)
  if (!access.isActive) {
    return NextResponse.json({ error: 'Cont dezactivat', locked: true, reason: 'INACTIVE' }, { status: 403 })
  }
  if (!access.canAccessLesson({ isFree: lesson.isFree, moduleId: lesson.module.id })) {
    return NextResponse.json({
      error: PAYMENT_LOCK_MESSAGE,
      locked: true,
      reason: 'PAYMENT_REQUIRED',
    }, { status: 403 })
  }

  // Submisii existente pentru aceste probleme
  const problemIds = lesson.problems.map(p => p.id)
  const subs = await prisma.problemSubmission.findMany({
    where: { studentId: student.id, problemId: { in: problemIds }, lessonId: lesson.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, problemId: true, status: true, grade: true, feedback: true,
      autoCorrect: true, answer: true, code: true, createdAt: true, gradedAt: true,
    },
  })
  const subByProblem = {}
  for (const s of subs) if (!subByProblem[s.problemId]) subByProblem[s.problemId] = s

  const progress = await prisma.lessonProgress.findUnique({
    where: { studentId_lessonId: { studentId: student.id, lessonId: lesson.id } },
  })

  // Verifică dacă există un advance pentru modul
  const advance = await prisma.moduleAdvance.findUnique({
    where: { studentId_moduleId: { studentId: student.id, moduleId: lesson.module.id } },
  })

  return NextResponse.json({
    student,
    lesson: {
      id: lesson.id, title: lesson.title, theory: lesson.theory, videoUrl: lesson.videoUrl,
      module: lesson.module, isFree: lesson.isFree,
      problems: lesson.problems.map(p => ({
        ...p,
        submission: subByProblem[p.id] || null,
      })),
    },
    progress,
    advanceGranted: !!advance,
  })
}

// PATCH { theoryCompleted?: bool, currentProblemIndex?: number }
export async function PATCH(req, { params }) {
  const { token, lessonId } = await params
  const student = await findStudent(token)
  if (!student) return NextResponse.json({ error: 'Token invalid' }, { status: 404 })

  const body = await req.json()
  const data = {}
  if (typeof body.theoryCompleted === 'boolean') data.theoryCompleted = body.theoryCompleted
  if (typeof body.currentProblemIndex === 'number') data.currentProblemIndex = body.currentProblemIndex
  if (body.completed === true) data.completedAt = new Date()

  const progress = await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: student.id, lessonId } },
    update: data,
    create: { studentId: student.id, lessonId, ...data },
  })
  return NextResponse.json({ progress })
}
