import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

async function deductFromLeaderboards(studentId, submissions) {
  if (!submissions.length) return
  const now = new Date()
  const events = await prisma.leaderboardEvent.findMany({
    where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    select: { id: true, type: true, startsAt: true },
  })
  if (!events.length) return

  for (const ev of events) {
    const relevant = submissions.filter(s =>
      s.grade >= 60 &&
      new Date(s.createdAt) >= new Date(ev.startsAt)
    )
    if (!relevant.length) continue

    let deduct = 0
    if (ev.type === 'XP' || ev.type === 'COINS') {
      deduct = relevant.reduce((sum, s) => sum + (s.leaderboardXp || s.xpAwarded || 0), 0)
    } else if (ev.type === 'CODING') {
      deduct = relevant
        .filter(s => s.problemType === 'CODING')
        .reduce((sum, s) => sum + (s.leaderboardXp || s.xpAwarded || 0), 0)
    } else if (ev.type === 'GEMS') {
      deduct = relevant.reduce((sum, s) => sum + (s.leaderboardGems || 0), 0)
    }
    if (deduct <= 0) continue

    const entry = await prisma.leaderboardEntry.findUnique({
      where: { eventId_studentId: { eventId: ev.id, studentId } },
      select: { id: true, score: true },
    })
    if (!entry) continue
    await prisma.leaderboardEntry.update({
      where: { id: entry.id },
      data: { score: Math.max(0, entry.score - deduct) },
    })
  }
}

export async function POST(req, { params }) {
  const { token, lessonId } = await params

  const student = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, active: true },
  })
  if (!student) return NextResponse.json({ error: 'Token invalid' }, { status: 404 })
  if (student.active === false) return NextResponse.json({ error: 'Cont dezactivat' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { problemId } = body
  if (!problemId || typeof problemId !== 'string') {
    return NextResponse.json({ error: 'problemId obligatoriu' }, { status: 400 })
  }

  const problem = await prisma.problem.findFirst({
    where: { id: problemId, lessonId },
    select: { id: true, type: true },
  })
  if (!problem) return NextResponse.json({ error: 'Problema nu aparține lecției' }, { status: 403 })

  // Citim submisiile ÎNAINTE de ștergere
  const subsToDelete = await prisma.problemSubmission.findMany({
    where: { studentId: student.id, problemId, lessonId },
    select: {
      id: true, grade: true, createdAt: true,
      xpAwarded: true, leaderboardXp: true, leaderboardGems: true,
    },
  })
  const subsWithType = subsToDelete.map(s => ({
    ...s,
    problemType: problem.type,
    grade: s.grade || 0,
  }))

  // Șterge submisiile
  const deleted = await prisma.problemSubmission.deleteMany({
    where: { studentId: student.id, problemId, lessonId },
  })

  // Scade exact din leaderboard
  await deductFromLeaderboards(student.id, subsWithType)

  // Scoate problema din hintsUsed
  const progress = await prisma.lessonProgress.findUnique({
    where: { studentId_lessonId: { studentId: student.id, lessonId } },
    select: { hintsUsed: true },
  })
  if (progress && Array.isArray(progress.hintsUsed) && progress.hintsUsed.includes(problemId)) {
    await prisma.lessonProgress.update({
      where: { studentId_lessonId: { studentId: student.id, lessonId } },
      data: { hintsUsed: progress.hintsUsed.filter(id => id !== problemId) },
    })
  }

  return NextResponse.json({ ok: true, deletedSubmissions: deleted.count })
}
