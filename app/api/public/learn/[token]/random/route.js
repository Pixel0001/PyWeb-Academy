import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { smartRandomSelect, suggestNextDifficulty } from '@/lib/problem-utils'

// Generează probleme random pentru elev când nu are acces la modulul următor
// GET ?difficulty=EASY|MEDIUM|HARD|RANDOM&count=3&topic=...
export async function GET(req, { params }) {
  const { token } = await params
  const student = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, fullName: true },
  })
  if (!student) return NextResponse.json({ error: 'Token invalid' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  let difficulty = searchParams.get('difficulty') || 'RANDOM'
  const count = Math.min(10, Math.max(1, parseInt(searchParams.get('count') || '3', 10)))
  const topic = searchParams.get('topic') || undefined

  // Sugestie auto-progresie
  const recent = await prisma.problemSubmission.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { problem: { select: { difficulty: true } } },
  })
  const suggestion = suggestNextDifficulty(
    recent.map(r => ({ isCorrect: !!r.autoCorrect || (r.grade ?? 0) >= 60, problem: r.problem })),
    recent[0]?.problem?.difficulty || 'EASY',
  )

  if (difficulty === 'RANDOM') difficulty = ['EASY', 'MEDIUM', 'HARD'][Math.floor(Math.random() * 3)]

  const where = { active: true }
  if (difficulty !== 'ANY') where.difficulty = difficulty
  if (topic) where.topic = topic

  // Evită problemele deja submise recent (ultimele 30 zile)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentSubs = await prisma.problemSubmission.findMany({
    where: { studentId: student.id, createdAt: { gte: cutoff } },
    select: { problemId: true },
  })
  const recentSet = new Set(recentSubs.map(r => r.problemId))

  const candidates = await prisma.problem.findMany({
    where, take: 100,
    select: {
      id: true, title: true, description: true, type: true, difficulty: true, topic: true,
      options: true, starterCode: true, hint: true, points: true, language: true,
    },
  })
  const picked = smartRandomSelect(candidates, { count, recentProblemIds: recentSet })

  return NextResponse.json({ student, problems: picked, suggestion })
}
