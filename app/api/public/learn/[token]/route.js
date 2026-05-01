import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Date dashboard pentru elev: modulele cu accesul lui + lecții free pe modulele fără acces
export async function GET(req, { params }) {
  const { token } = await params
  const student = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, fullName: true },
  })
  if (!student) return NextResponse.json({ error: 'Token invalid' }, { status: 404 })

  const [modules, accesses, advances, progresses] = await Promise.all([
    prisma.learningModule.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        lessons: {
          where: { active: true },
          orderBy: { order: 'asc' },
          select: { id: true, title: true, slug: true, order: true, isFree: true, _count: { select: { problems: true } } },
        },
      },
    }),
    prisma.moduleAccess.findMany({ where: { studentId: student.id }, select: { moduleId: true } }),
    prisma.moduleAdvance.findMany({ where: { studentId: student.id }, select: { moduleId: true } }),
    prisma.lessonProgress.findMany({
      where: { studentId: student.id },
      select: { lessonId: true, theoryCompleted: true, currentProblemIndex: true, completedAt: true },
    }),
  ])

  const accessSet = new Set(accesses.map(a => a.moduleId))
  const advanceSet = new Set(advances.map(a => a.moduleId))
  const progressMap = new Map(progresses.map(p => [p.lessonId, p]))

  // Calculează disponibilitatea: primul modul mereu accesibil (lecții free); modulele următoare doar dacă advance pe precedentul
  const enriched = modules.map((m, idx) => {
    const prev = modules[idx - 1]
    const unlocked = idx === 0 || (prev && advanceSet.has(prev.id))
    const hasFullAccess = accessSet.has(m.id)
    return {
      id: m.id,
      slug: m.slug,
      title: m.title,
      description: m.description,
      language: m.language,
      coverImage: m.coverImage,
      order: m.order,
      unlocked,        // dacă elevul are voie la modul (advance pe modulul anterior)
      hasFullAccess,   // dacă vede toate lecțiile sau doar cele free
      advanceGranted: advanceSet.has(m.id),
      lessons: m.lessons.map(l => ({
        ...l,
        accessible: hasFullAccess || l.isFree,
        progress: progressMap.get(l.id) || null,
      })),
    }
  })

  return NextResponse.json({ student, modules: enriched })
}
