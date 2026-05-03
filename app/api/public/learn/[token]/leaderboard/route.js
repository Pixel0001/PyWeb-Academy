import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Public leaderboard pentru aplicația mobilă/web
// Returnează rankingul + XP-ul elevului curent
export async function GET(req, { params }) {
  const { token } = await params
  const me = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, fullName: true, active: true },
  })
  if (!me) return NextResponse.json({ error: 'Token invalid' }, { status: 404 })
  if (me.active === false) return NextResponse.json({ error: 'Cont dezactivat' }, { status: 403 })

  const [allStudents, allSubmissions, allBonusPoints] = await Promise.all([
    prisma.student.findMany({
      select: { id: true, fullName: true },
    }),
    prisma.problemSubmission.findMany({
      where: { status: 'GRADED', grade: { gte: 60 } },
      select: { studentId: true, grade: true, problem: { select: { points: true } } },
    }),
    prisma.bonusPoint.findMany({
      select: { studentId: true, points: true },
    }),
  ])

  const xpMap = new Map()
  for (const s of allStudents) xpMap.set(s.id, 0)
  for (const sub of allSubmissions) {
    const xp = Math.round((sub.problem?.points ?? 10) * (sub.grade / 100))
    xpMap.set(sub.studentId, (xpMap.get(sub.studentId) ?? 0) + xp)
  }
  for (const bp of allBonusPoints) {
    xpMap.set(bp.studentId, (xpMap.get(bp.studentId) ?? 0) + bp.points)
  }

  const ranked = allStudents
    .map(s => ({ id: s.id, fullName: s.fullName, xp: xpMap.get(s.id) ?? 0 }))
    .sort((a, b) => b.xp - a.xp)

  const myRank = ranked.findIndex(s => s.id === me.id) + 1
  const myXP = xpMap.get(me.id) ?? 0

  return NextResponse.json({
    ranked,
    me: { id: me.id, fullName: me.fullName, xp: myXP, rank: myRank },
    total: ranked.length,
  })
}
