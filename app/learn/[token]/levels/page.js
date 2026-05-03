export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import {
  ArrowLeftIcon, LockClosedIcon,
  SparklesIcon, MagnifyingGlassIcon, WrenchScrewdriverIcon,
  BoltIcon, RocketLaunchIcon, FireIcon, CheckCircleIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'
import {
  SparklesIcon as SparklesSolid, MagnifyingGlassIcon as MagnifyingGlassSolid,
  WrenchScrewdriverIcon as WrenchSolid, BoltIcon as BoltSolid,
  RocketLaunchIcon as RocketSolid, FireIcon as FireSolid,
} from '@heroicons/react/24/solid'

const LEVELS = [
  { min: 0,    max: 99,       num: 1, name: 'Novice',     Icon: SparklesIcon,  IconSolid: SparklesSolid,   color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',  bar: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-700 border-slate-300' },
  { min: 100,  max: 299,      num: 2, name: 'Explorator', Icon: MagnifyingGlassIcon,  IconSolid: MagnifyingGlassSolid, color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 border-blue-300' },
  { min: 300,  max: 699,      num: 3, name: 'Practicant', Icon: WrenchScrewdriverIcon, IconSolid: WrenchSolid,    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { min: 700,  max: 1499,     num: 4, name: 'Expert',     Icon: BoltIcon,             IconSolid: BoltSolid,       color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',  bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 border-amber-300' },
  { min: 1500, max: 2999,     num: 5, name: 'Master',     Icon: RocketLaunchIcon,     IconSolid: RocketSolid,     color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200', bar: 'bg-purple-500',  badge: 'bg-purple-100 text-purple-700 border-purple-300' },
  { min: 3000, max: Infinity, num: 6, name: 'Legend',     Icon: FireIcon,             IconSolid: FireSolid,       color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',   bar: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700 border-rose-300' },
]

function getLevel(xp) {
  return [...LEVELS].reverse().find(l => xp >= l.min) ?? LEVELS[0]
}

export default async function LevelsPage({ params }) {
  const { token } = await params

  const me = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, fullName: true, active: true },
  })
  if (!me || me.active === false) notFound()

  const [submissions, bonusPoints] = await Promise.all([
    prisma.problemSubmission.findMany({
      where: { studentId: me.id, status: 'GRADED', grade: { gte: 60 } },
      select: { grade: true, problem: { select: { points: true } } },
    }),
    prisma.bonusPoint.findMany({
      where: { studentId: me.id },
      select: { points: true },
    }),
  ])

  let myXP = 0
  for (const sub of submissions) {
    myXP += Math.round((sub.problem?.points ?? 10) * (sub.grade / 100))
  }
  for (const bp of bonusPoints) {
    myXP += bp.points
  }

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
          <h1 className="font-extrabold text-lg leading-tight">Niveluri</h1>
          <p className="text-white/60 text-xs">Progresia ta de la Novice la Legend</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">

        {/* My XP summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${myLevel.bar}`}>
            <myLevel.IconSolid className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-extrabold text-gray-900">{me.fullName}</div>
            <div className={`text-sm font-bold ${myLevel.color}`}>Nivel {myLevel.num} · {myLevel.name}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-gray-900">{myXP}</div>
            <div className="text-xs text-gray-500">XP total</div>
          </div>
        </div>

        {/* Level cards */}
        {LEVELS.map((l, i) => {
          const next = LEVELS[i + 1]
          const isCurrent = l.num === myLevel.num
          const isPassed = myXP >= (next?.min ?? Infinity) && !isCurrent
          const isLocked = myXP < l.min
          const xpRange = next ? next.min - l.min : null

          // Progress within this level
          const xpInLevel = Math.max(0, myXP - l.min)
          const pct = xpRange ? Math.min(100, Math.round((xpInLevel / xpRange) * 100)) : 100

          let statusIcon = null
          let cardBorder = `border-2 ${l.border}`
          let cardBg = l.bg

          if (isPassed) {
            cardBorder = 'border-2 border-emerald-300'
            cardBg = 'bg-emerald-50'
            statusIcon = <span className="text-emerald-600 font-black text-lg">✓</span>
          } else if (isLocked) {
            cardBorder = 'border border-gray-200'
            cardBg = 'bg-gray-50'
            statusIcon = <LockClosedIcon className="w-4 h-4 text-gray-400" />
          } else if (isCurrent) {
            statusIcon = <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${l.badge}`}>ACUM</span>
          }

          return (
            <div key={l.num} className={`rounded-2xl p-4 shadow-sm ${cardBorder} ${cardBg} ${isLocked ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                {/* Emoji + number */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isPassed ? 'bg-emerald-500' :
                  isCurrent ? l.bar :
                  'bg-gray-200'
                }`}>
                  {isPassed
                    ? <CheckCircleIcon className="w-6 h-6 text-white" />
                    : isLocked
                      ? <l.Icon className="w-6 h-6 text-gray-400" />
                      : <l.IconSolid className="w-6 h-6 text-white" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-extrabold text-base ${isLocked ? 'text-gray-400' : isPassed ? 'text-emerald-700' : l.color}`}>
                      {l.name}
                    </span>
                    {statusIcon}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {l.min === 0 ? 'Începi de la 0 XP' : `De la ${l.min.toLocaleString()} XP`}
                    {next && ` până la ${(next.min - 1).toLocaleString()} XP`}
                    {!next && ' · Nivel maxim 👑'}
                  </div>

                  {/* Progress bar — only for current or passed */}
                  {xpRange && (isCurrent || isPassed) && (
                    <div className="mt-2">
                      <div className="h-2 bg-white/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isPassed ? 'bg-emerald-400' : l.bar}`}
                          style={{ width: `${isPassed ? 100 : pct}%` }}
                        />
                      </div>
                      {isCurrent && (
                        <div className="text-[10px] text-gray-500 mt-1">
                          {xpInLevel} / {xpRange} XP ({pct}%) · mai ai <strong>{next.min - myXP} XP</strong> până la {next.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Info tip */}
        <div className="text-center text-xs text-gray-500 py-2">
          Câștigă XP rezolvând probleme sau primind puncte bonus de la profesor
        </div>

      </div>
    </div>
  )
}
