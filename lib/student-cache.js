/**
 * Helpers cu cache pentru date student în cadrul aceluiași request Next.js.
 * React cache() deduplicates calls within one render tree — un singur query per request
 * indiferent de câte server components îl apelează.
 */
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import prisma from './prisma'

/**
 * Găsește studentul după token — DEDUPLICAT per request (React cache).
 * Folost de layout, page, leaderboard etc. în același render.
 */
export const getStudentByToken = cache(async (token) => {
  if (!token) return null
  return prisma.student.findFirst({
    where: { accessToken: token },
    select: {
      id: true,
      fullName: true,
      active: true,
      superStudent: true,
      activeThemeId: true,
      equipped: {
        include: {
          cosmetic: { select: { name: true, rarity: true, type: true } },
        },
      },
    },
  })
})

/**
 * Fetch tema activă — cached 5 minute (temele se schimbă rar).
 */
export const getThemeById = unstable_cache(
  async (themeId) => {
    if (!themeId) return null
    return prisma.theme.findUnique({ where: { id: themeId } })
  },
  ['theme-by-id'],
  { revalidate: 300, tags: ['themes'] }
)

/**
 * Toate temele active — cached 5 minute.
 */
export const getAllThemes = unstable_cache(
  async () => prisma.theme.findMany({ where: { active: true } }),
  ['all-themes'],
  { revalidate: 300, tags: ['themes'] }
)

/**
 * Cosmeticele active din shop — cached 5 minute (se schimbă rar).
 */
export const getShopCosmetics = unstable_cache(
  async () =>
    prisma.cosmetic.findMany({
      where: { active: true, shopVisible: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
  ['shop-cosmetics'],
  { revalidate: 300, tags: ['cosmetics'] }
)

/**
 * Chest-urile active — cached 5 minute.
 */
export const getShopChests = unstable_cache(
  async () =>
    prisma.chest.findMany({
      where: { active: true },
      orderBy: { tier: 'asc' },
      include: { rewards: { include: { cosmetic: true } } },
    }),
  ['shop-chests'],
  { revalidate: 300, tags: ['chests'] }
)

/**
 * Datele studentului din shop (inventar + equipped + economie) — per request, fără cache persistent.
 * Se apelează direct din route handler cu studentId.
 */
export async function getStudentShopData(studentId) {
  const { getStudentEconomy } = await import('./economy')
  const [econ, inventory, equipped, activeEvents] = await Promise.all([
    getStudentEconomy(studentId),
    prisma.cosmeticInventory.findMany({
      where: { studentId },
      include: { cosmetic: true },
    }),
    prisma.equippedCosmetic.findMany({
      where: { studentId },
      include: { cosmetic: true },
    }),
    prisma.leaderboardEvent.findMany({
      where: {
        active: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
      orderBy: { endsAt: 'asc' },
    }),
  ])
  return { econ, inventory, equipped, activeEvents }
}

/**
 * Clasamentul XP — cached 60 secunde.
 * Calculează XP din submissions + bonus points pentru toți elevii.
 */
export const getLeaderboardRanking = unstable_cache(
  async () => {
    const [allStudents, allSubmissions, allBonusPoints] = await Promise.all([
      prisma.student.findMany({
        where: { accessToken: { not: null }, active: true },
        select: { id: true, fullName: true },
      }),
      prisma.problemSubmission.findMany({
        where: { status: 'GRADED' },
        select: {
          studentId: true,
          problemId: true,
          grade: true,
          problem: { select: { points: true } },
        },
      }),
      prisma.bonusPoint.findMany({ select: { studentId: true, points: true } }),
    ])

    const xpMap = new Map()
    for (const s of allStudents) xpMap.set(s.id, 0)

    const bestPerProblem = new Map()
    for (const sub of allSubmissions) {
      const key = sub.studentId + '|' + sub.problemId
      const cur = bestPerProblem.get(key)
      if (!cur || (sub.grade ?? 0) > cur.grade) {
        bestPerProblem.set(key, {
          studentId: sub.studentId,
          grade: sub.grade ?? 0,
          points: sub.problem?.points ?? 10,
        })
      }
    }
    for (const b of bestPerProblem.values()) {
      const xp = Math.round(b.points * (b.grade / 100))
      xpMap.set(b.studentId, (xpMap.get(b.studentId) ?? 0) + xp)
    }
    for (const bp of allBonusPoints) {
      xpMap.set(bp.studentId, (xpMap.get(bp.studentId) ?? 0) + bp.points)
    }

    return allStudents
      .map(s => ({ ...s, xp: xpMap.get(s.id) ?? 0 }))
      .sort((a, b) => b.xp - a.xp)
  },
  ['leaderboard-ranking'],
  { revalidate: 60, tags: ['leaderboard'] }
)
