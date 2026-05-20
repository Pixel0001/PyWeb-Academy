// recalculate-leaderboard-scores.mjs
//
// Recalculează scorurile leaderboard-urilor active pe baza submisiilor reale.
//
// Logică exactă (mirrors economy.js -> updateLeaderboards):
//   XP / COINS  → sum(leaderboardXp ?? xpAwarded)  per submisie cu grade>=60 in fereastra event
//   CODING      → la fel, dar doar problem.type === 'CODING'
//   GEMS        → sum(leaderboardGems)
//
// leaderboardXp   = coins = multipliedXp (post-streak-multiplier) — stocat din submisie
// leaderboardGems = gems acordate (fara bonus milestone) — stocat din submisie
// Fallback pe xpAwarded (pre-multiplier) pt submisii vechi, inainte de acest fix.
//
// Run: node scripts/recalculate-leaderboard-scores.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const now = new Date()

  const events = await prisma.leaderboardEvent.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      endsAt:   { gte: now },
    },
    include: { entries: true },
  })

  if (!events.length) {
    console.log('Nu exista event-uri active. Nimic de recalculat.')
    return
  }

  console.log(`Gasite ${events.length} event-uri active.\n`)

  for (const ev of events) {
    console.log(`\n=== Event: "${ev.name}" (${ev.type}) ===`)
    console.log(`   Perioada: ${ev.startsAt.toISOString()} -> ${ev.endsAt.toISOString()}`)
    console.log(`   Entries: ${ev.entries.length}`)

    let updated = 0
    let unchanged = 0

    for (const entry of ev.entries) {
      const subs = await prisma.problemSubmission.findMany({
        where: {
          studentId: entry.studentId,
          grade: { gte: 60 },
          createdAt: { gte: ev.startsAt },
        },
        select: {
          leaderboardXp:   true,
          leaderboardGems: true,
          xpAwarded:       true,
          problem: { select: { type: true } },
        },
      })

      let correctScore = 0

      if (ev.type === 'XP' || ev.type === 'COINS') {
        correctScore = subs.reduce((sum, s) =>
          sum + (s.leaderboardXp ?? s.xpAwarded ?? 0), 0)

      } else if (ev.type === 'CODING') {
        correctScore = subs
          .filter(s => s.problem?.type === 'CODING')
          .reduce((sum, s) =>
            sum + (s.leaderboardXp ?? s.xpAwarded ?? 0), 0)

      } else if (ev.type === 'GEMS') {
        correctScore = subs.reduce((sum, s) =>
          sum + (s.leaderboardGems ?? 0), 0)
      }

      if (correctScore === entry.score) {
        unchanged++
        continue
      }

      const diff = entry.score - correctScore
      const arrow = diff > 0
        ? `- ${diff} (abuz detectat)`
        : `+ ${Math.abs(diff)} (corectie)`
      console.log(`   Student ${entry.studentId}: ${entry.score} -> ${correctScore}  ${arrow}`)

      await prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: { score: Math.max(0, correctScore) },
      })
      updated++
    }

    console.log(`   OK: ${updated} actualizate | ${unchanged} nemodificate`)
  }

  console.log('\nRecalculare finalizata.')
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
