export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import {
  TrophyIcon, ArrowLeftIcon, StarIcon,
  ChevronDoubleUpIcon, LockClosedIcon, Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline'
import { TrophyIcon as TrophySolid, StarIcon as StarSolid } from '@heroicons/react/24/solid'

const LEVELS = [
  { min: 0,    max: 99,       num: 1, name: 'Novice',     color: 'text-slate-500',   bg: 'bg-slate-100',   bar: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  { min: 100,  max: 299,      num: 2, name: 'Explorator', color: 'text-blue-600',    bg: 'bg-blue-50',     bar: 'bg-blue-400',    badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  { min: 300,  max: 699,      num: 3, name: 'Practicant', color: 'text-emerald-600', bg: 'bg-emerald-50',  bar: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { min: 700,  max: 1499,     num: 4, name: 'Expert',     color: 'text-amber-600',   bg: 'bg-amber-50',    bar: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  { min: 1500, max: 2999,     num: 5, name: 'Master',     color: 'text-purple-600',  bg: 'bg-purple-50',   bar: 'bg-purple-400',  badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  { min: 3000, max: Infinity, num: 6, name: 'Legend',     color: 'text-rose-600',    bg: 'bg-rose-50',     bar: 'bg-rose-400',    badge: 'bg-rose-100 text-rose-700 border-rose-200' },
]

function getLevel(xp) {
  return [...LEVELS].reverse().find(l => xp >= l.min) ?? LEVELS[0]
}

const RANK_COLORS = [
  'text-yellow-500',  // 1st
  'text-slate-400',   // 2nd
  'text-amber-600',   // 3rd
]

export default async function LeaderboardPage({ params }) {
  const { token } = await params

  // Find current student
  const me = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, fullName: true, active: true },
  })
  if (!me || me.active === false) notFound()

  // Get all active students with their graded submissions + bonus points
  const [allStudents, allSubmissions, allBonusPoints] = await Promise.all([
    prisma.student.findMany({
      where: { active: true },
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

  // Build XP map
  const xpMap = new Map()
  for (const s of allStudents) xpMap.set(s.id, 0)

  for (const sub of allSubmissions) {
    const xp = Math.round((sub.problem?.points ?? 10) * (sub.grade / 100))
    xpMap.set(sub.studentId, (xpMap.get(sub.studentId) ?? 0) + xp)
  }
  for (const bp of allBonusPoints) {
    xpMap.set(bp.studentId, (xpMap.get(bp.studentId) ?? 0) + bp.points)
  }

  // Build ranked list (only students with XP > 0 or always show all)
  const ranked = allStudents
    .map(s => ({ ...s, xp: xpMap.get(s.id) ?? 0 }))
    .sort((a, b) => b.xp - a.xp)

  const myRank = ranked.findIndex(s => s.id === me.id) + 1
  const myXP = xpMap.get(me.id) ?? 0
  const myLevel = getLevel(myXP)

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-4 py-4 flex items-center gap-3 shadow-lg">
        <Link href={`/learn/${token}`} className="p-2 hover:bg-white/10 rounded-xl transition">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <TrophyIcon className="w-6 h-6 text-amber-300" />
        <div>
          <h1 className="font-extrabold text-lg leading-tight">Clasament</h1>
          <p className="text-white/60 text-xs">Toți elevii după XP acumulat</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* My position card — extins cu progres și XP până la următorul nivel */}
        {(() => {
          const myNextLevel = LEVELS[myLevel.num] ?? null
          const myXpInto = myXP - myLevel.min
          const myXpNeeded = myNextLevel ? myNextLevel.min - myLevel.min : 1
          const myPct = myNextLevel ? Math.min(100, Math.round((myXpInto / myXpNeeded) * 100)) : 100
          const xpToNext = myNextLevel ? myNextLevel.min - myXP : 0
          const playerAhead = ranked[myRank - 2] // jucătorul de deasupra
          const xpToOvertake = playerAhead ? Math.max(0, playerAhead.xp - myXP + 1) : 0

          return (
            <div className={`rounded-2xl p-5 border-2 ${myLevel.bg} shadow-sm`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-extrabold text-xl shrink-0 shadow-md">
                  #{myRank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-gray-900 text-base">Tu · {me.fullName}</div>
                  <div className={`text-sm font-bold ${myLevel.color}`}>
                    Nivel {myLevel.num} — {myLevel.name}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl font-extrabold text-gray-900">{myXP}</div>
                  <div className="text-xs text-gray-500">XP total</div>
                </div>
              </div>

              {/* Progres către următorul nivel */}
              {myNextLevel ? (
                <>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className={myLevel.color}>Nv.{myLevel.num} {myLevel.name}</span>
                    <span className="text-gray-500">
                      <strong className="text-gray-900">{xpToNext} XP</strong> până la <span className={myNextLevel.color}>{myNextLevel.name}</span>
                    </span>
                  </div>
                  <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full ${myLevel.bar} rounded-full transition-all duration-700`} style={{ width: `${myPct}%` }} />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 text-right">{myXpInto} / {myXpNeeded} XP ({myPct}%)</div>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="text-2xl">👑</div>
                  <div className="text-sm font-bold text-rose-600">Ai atins nivelul maxim — Legend!</div>
                </div>
              )}

              {/* Provocare: cât XP până depășești pe cineva */}
              {playerAhead && xpToOvertake > 0 && (
                <div className="mt-3 px-3 py-2 bg-white/60 rounded-xl flex items-center gap-2 text-xs">
                  <Bars3BottomLeftIcon className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-gray-700">
                    <strong className="text-blue-900">+{xpToOvertake} XP</strong> ca să-l depășești pe <strong>{playerAhead.fullName}</strong> (locul #{myRank - 1})
                  </span>
                </div>
              )}
            </div>
          )
        })()}

        {/* Leaderboard list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <StarIcon className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-gray-700">Top elevi</span>
            <span className="ml-auto text-xs text-gray-400">{ranked.length} elevi</span>
          </div>

          <div className="divide-y divide-gray-50">
            {ranked.map((student, idx) => {
              const rank = idx + 1
              const level = getLevel(student.xp)
              const isMe = student.id === me.id
              const nextLevel = LEVELS[level.num] ?? null
              const xpIntoLevel = student.xp - level.min
              const xpNeeded = nextLevel ? nextLevel.min - level.min : 1
              const pct = nextLevel ? Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)) : 100

              return (
                <div
                  key={student.id}
                  className={`px-4 py-3 flex items-center gap-3 transition ${isMe ? 'bg-blue-50 border-l-2 border-blue-600' : 'hover:bg-gray-50'}`}
                >
                  {/* Rank */}
                  <div className={`w-8 text-center shrink-0 font-extrabold text-lg ${RANK_COLORS[idx] ?? 'text-gray-400'}`}>
                    {rank <= 3
                      ? <TrophySolid className={`w-5 h-5 mx-auto ${RANK_COLORS[idx]}`} />
                      : rank}
                  </div>

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isMe
                      ? 'bg-gradient-to-br from-blue-900 to-blue-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {student.fullName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-semibold truncate ${isMe ? 'text-blue-900' : 'text-gray-900'}`}>
                        {isMe ? `${student.fullName} (tu)` : student.fullName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${level.badge}`}>
                        Nv.{level.num} {level.name}
                      </span>
                      {student.xp > 0 && (
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-20">
                          <div className={`h-full ${level.bar} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right shrink-0">
                    <div className={`text-base font-extrabold ${isMe ? 'text-blue-900' : 'text-gray-900'}`}>
                      {student.xp}
                    </div>
                    <div className="text-[10px] text-gray-400">XP</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Toate nivelurile — traseu cu progres */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <ChevronDoubleUpIcon className="w-3.5 h-3.5" /> Toate nivelurile
          </div>
          <div className="space-y-2">
            {LEVELS.map((l, i) => {
              const isCurrent = l.num === myLevel.num
              const isPassed = myXP >= l.min && !isCurrent
              const isLocked = myXP < l.min
              const next = LEVELS[i + 1]
              const xpForLevel = next ? next.min - l.min : 0
              const xpInLevel = isCurrent ? myXP - l.min : (isPassed ? xpForLevel : 0)
              const pct = xpForLevel > 0 ? Math.min(100, Math.round((xpInLevel / xpForLevel) * 100)) : 100

              return (
                <div
                  key={l.num}
                  className={`relative px-3 py-3 rounded-xl border-2 transition ${
                    isCurrent ? `${l.bg} border-current shadow-md` :
                    isPassed ? 'bg-emerald-50/40 border-emerald-100' :
                    'bg-gray-50 border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${
                      isCurrent ? `${l.bar} text-white` :
                      isPassed ? 'bg-emerald-500 text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {isPassed ? '✓' : l.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold text-sm ${isCurrent ? l.color : isPassed ? 'text-emerald-700' : 'text-gray-500'}`}>
                          Nivel {l.num} — {l.name}
                        </span>
                        {isCurrent && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${l.badge}`}>
                            ACUM
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {l.min === 0 ? 'De la 0 XP' : `De la ${l.min.toLocaleString()} XP`}
                        {next && ` · până la ${(next.min - 1).toLocaleString()} XP`}
                        {!next && ' · Nivelul maxim 👑'}
                      </div>
                      {/* Bar */}
                      {next && (
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full ${isPassed ? 'bg-emerald-400' : isCurrent ? l.bar : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {isLocked && <LockClosedIcon className="w-4 h-4 text-gray-400 shrink-0" />}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 text-center">
            🎯 Cum câștigi XP: <strong>rezolvi probleme</strong> (puncte × notă/100) sau <strong>puncte bonus</strong> de la profesor.
          </div>
        </div>
      </div>
    </div>
  )
}
