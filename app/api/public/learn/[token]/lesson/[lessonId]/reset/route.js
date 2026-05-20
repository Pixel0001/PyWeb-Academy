import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Scade din leaderboard-urile active valorile exacte stocate per submisie
async function deductFromLeaderboards(studentId, submissions) {
  if (!submissions.length) return
  const now = new Date()
  const events = await prisma.leaderboardEvent.findMany({
    where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    select: { id: true, type: true, startsAt: true },
  })
  if (!events.length) return

  for (const ev of events) {
    // Filtrăm submisiile care au apărut după startul event-ului
    const relevant = submissions.filter(s =>
      s.grade >= 60 &&
      new Date(s.createdAt) >= new Date(ev.startsAt)
    )
    if (!relevant.length) continue

    let deduct = 0
    if (ev.type === 'XP' || ev.type === 'COINS') {
      // leaderboardXp = coins = multipliedXp, folosit pentru ambele tipuri de event
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

// POST - resetează complet lecția pentru elev
export async function POST(req, { params }) {
  const { token, lessonId } = await params
  const student = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, active: true },
  })
  if (!student) return NextResponse.json({ error: 'Token invalid' }, { status: 404 })
  if (student.active === false) return NextResponse.json({ error: 'Cont dezactivat' }, { status: 403 })

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true },
  })
  if (!lesson) return NextResponse.json({ error: 'Lecție inexistentă' }, { status: 404 })

  // Citim submisiile ÎNAINTE de ștergere
  const subsToDelete = await prisma.problemSubmission.findMany({
    where: { studentId: student.id, lessonId },
    select: {
      id: true, grade: true, createdAt: true,
      xpAwarded: true, leaderboardXp: true, leaderboardGems: true,
      problem: { select: { type: true } },
    },
  })

  const subsWithType = subsToDelete.map(s => ({
    ...s,
    problemType: s.problem?.type || null,
    grade: s.grade || 0,
  }))

  // Șterge submisiile
  const deleted = await prisma.problemSubmission.deleteMany({
    where: { studentId: student.id, lessonId },
  })

  // Scade exact din leaderboard-urile active
  await deductFromLeaderboards(student.id, subsWithType)

  // Resetează progresul lecției
  await prisma.lessonProgress.updateMany({
    where: { studentId: student.id, lessonId },
    data: { hintsUsed: [], completedAt: null, currentProblemIndex: 0 },
  })

  return NextResponse.json({ ok: true, deletedSubmissions: deleted.count })
}
