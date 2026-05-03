import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { gradeCode, detectAiCode, checkAiQuota, logAiUsage, getStudentAiUsage } from '@/lib/ai-grader'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Vercel — extindem timeout pentru OpenAI

// Penalty pentru cod detectat ca AI: scade din nota finală
const AI_PENALTY = 50 // dacă isAi → scade 50 puncte (de obicei = 0p)

function getIp(req) {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

/**
 * GET — câte cereri AI mai are studentul azi (pentru UI)
 */
export async function GET(req, { params }) {
  const { token } = await params
  const student = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, active: true },
  })
  if (!student || student.active === false) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
  }
  const usage = await getStudentAiUsage(student.id)
  return NextResponse.json(usage)
}

/**
 * POST — trimite cod la AI pentru notare
 * Body: { problemId, lessonId?, code, output?, source? }
 * Răspuns: { submission, aiGrade, aiDetect, usage }
 */
export async function POST(req, { params }) {
  const { token } = await params
  const ip = getIp(req)

  const student = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, active: true },
  })
  if (!student) return NextResponse.json({ error: 'Token invalid' }, { status: 404 })
  if (student.active === false) return NextResponse.json({ error: 'Cont dezactivat' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { problemId, lessonId, code, output, source = 'lesson' } = body
  if (!problemId || !code) {
    return NextResponse.json({ error: 'problemId și code sunt obligatorii' }, { status: 400 })
  }

  // 1. Quota check
  const quota = await checkAiQuota({ studentId: student.id, ip })
  if (!quota.allowed) {
    const messages = {
      AI_DISABLED: 'Profesorul AI este temporar dezactivat. Cere ajutor profesorului tău.',
      STUDENT_LIMIT: `Ai folosit deja toate cele ${quota.limit} verificări AI pentru azi. Încearcă mâine!`,
      IP_LIMIT: 'Prea multe cereri într-un timp scurt. Așteaptă 1 oră.',
      GLOBAL_BUDGET: 'Bugetul zilnic AI a fost atins. Încearcă mâine.',
    }
    return NextResponse.json({
      error: messages[quota.reason] || 'Limită atinsă',
      quota,
    }, { status: 429 })
  }

  // 2. Încarcă problema
  const problem = await prisma.problem.findUnique({ where: { id: problemId } })
  if (!problem) return NextResponse.json({ error: 'Problemă inexistentă' }, { status: 404 })
  if (problem.type !== 'CODING') {
    return NextResponse.json({ error: 'AI grading e doar pentru probleme CODING' }, { status: 400 })
  }

  // 3. Verifică submisii existente — nu permitem dacă e blocată sau notată > 60 (deja corect)
  const prevSubs = await prisma.problemSubmission.findMany({
    where: { studentId: student.id, problemId, lessonId: lessonId || null },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  const alreadyLocked = prevSubs.some(s => s.locked)
  const alreadyCorrect = prevSubs.some(s => s.status === 'GRADED' && (s.grade ?? 0) >= 60)
  if (alreadyLocked || alreadyCorrect) {
    return NextResponse.json({ error: 'Problemă deja rezolvată sau blocată' }, { status: 400 })
  }

  // 4. Cere AI: grading + detection în paralel
  let aiGrade, aiDetect
  try {
    [aiGrade, aiDetect] = await Promise.all([
      gradeCode({
        problemTitle: problem.title,
        problemDescription: problem.description,
        expectedSolution: problem.correctAnswer || '',
        studentCode: code,
        language: problem.language || 'python',
        studentOutput: output || '',
      }),
      detectAiCode({ code, language: problem.language || 'python' }),
    ])
  } catch (e) {
    await logAiUsage({
      studentId: student.id, ip, endpoint: 'grade-code',
      tokensIn: 0, tokensOut: 0, success: false, errorMsg: e?.message,
    })
    console.error('[ai-grade] OpenAI error:', e)
    return NextResponse.json({
      error: 'Profesorul AI nu poate răspunde acum. Încearcă din nou peste câteva secunde.',
    }, { status: 503 })
  }

  // 5. Aplică penalty dacă e AI-generated
  let finalGrade = aiGrade.grade
  if (aiDetect.isAi) {
    finalGrade = Math.max(0, finalGrade - AI_PENALTY)
  }

  // 6. Loghează usage
  await logAiUsage({
    studentId: student.id, ip, endpoint: 'grade-code',
    tokensIn: (aiGrade.tokensIn || 0) + (aiDetect.tokensIn || 0),
    tokensOut: (aiGrade.tokensOut || 0) + (aiDetect.tokensOut || 0),
    success: true,
  })

  // 7. Salvează ca ProblemSubmission
  const attemptNumber = prevSubs.length + 1
  const sub = await prisma.problemSubmission.create({
    data: {
      studentId: student.id,
      problemId,
      lessonId: lessonId || null,
      answer: null,
      code,
      source,
      difficulty: problem.difficulty,
      autoCorrect: finalGrade >= 60,
      status: 'GRADED',
      grade: finalGrade,
      gradedAt: new Date(),
      attemptNumber,
      locked: true, // codul evaluat de AI = final (profesorul poate face override)
      aiGraded: true,
      aiReasoning: aiGrade.reasoning,
      aiRubric: aiGrade.rubric,
      aiSuspectedAi: aiDetect.isAi,
      aiSuspicionScore: aiDetect.score,
      aiTokensIn: (aiGrade.tokensIn || 0) + (aiDetect.tokensIn || 0),
      aiTokensOut: (aiGrade.tokensOut || 0) + (aiDetect.tokensOut || 0),
      feedback: aiGrade.reasoning,
    },
  })

  const usage = await getStudentAiUsage(student.id)

  return NextResponse.json({
    submission: sub,
    aiGrade: { ...aiGrade, finalGrade },
    aiDetect,
    aiPenaltyApplied: aiDetect.isAi ? AI_PENALTY : 0,
    usage,
  })
}
