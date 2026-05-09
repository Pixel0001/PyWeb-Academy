export const revalidate = 120 // ISR: leaderboard revalidat la fiecare 2min

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { TrophyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { getStudentByToken, getThemeById, getLeaderboardRanking } from '@/lib/student-cache'
import LeaderboardTabs from '@/components/public/LeaderboardTabs'
import CosmeticArt from '@/components/public/CosmeticArt'
import TitleBadge from '@/components/public/TitleBadge'

export default async function LeaderboardPage({ params }) {
  const { token } = await params

  // React cache() — deduplicat cu layout, include equipped + activeThemeId
  const me = await getStudentByToken(token)
  if (!me || me.active === false) notFound()

  // Tema + ranking + events active in paralel — ranking e cached 60s
  const now = new Date()
  const [theme, ranked, activeEvents] = await Promise.all([
    me.activeThemeId ? getThemeById(me.activeThemeId) : Promise.resolve(null),
    getLeaderboardRanking(),
    prisma.leaderboardEvent.findMany({
      where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { endsAt: 'asc' },
      include: {
        entries: {
          orderBy: { score: 'desc' },
          include: { student: { select: { id: true, fullName: true } } },
        },
      },
    }),
  ])

  const ranked_top3 = ranked.slice(0, 3)
  const RANK_BG2   = ['bg-yellow-400', 'bg-slate-300',   'bg-amber-600'  ]
  const RANK_RING2 = ['ring-yellow-300','ring-slate-200', 'ring-amber-400']
  const RANK_TEXT2 = ['text-amber-900', 'text-slate-700', 'text-amber-100']

  return (
    <div className="min-h-screen bg-slate-100">

      {/* TOP BAR + PODIUM */}
      <div className="bg-gradient-to-b from-blue-950 via-blue-900 to-indigo-800 text-white px-4 pt-4 pb-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href={'/learn/' + token} className="p-2 hover:bg-white/10 rounded-xl transition">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-extrabold text-xl leading-tight">Clasament</h1>
            <p className="text-white/50 text-xs">Toți elevii după XP acumulat</p>
          </div>
          <TrophyIcon className="w-7 h-7 text-amber-300" />
        </div>

        {ranked_top3.length >= 3 && (
          <div className="flex items-end justify-center gap-3 max-w-xs mx-auto">
            {[1, 0, 2].map((pos) => {
              const s = ranked_top3[pos]
              const isFirst = pos === 0
              const barPy = pos === 0 ? 'py-5' : pos === 1 ? 'py-3' : 'py-2'
              const RANK_BG2   = ['bg-yellow-400', 'bg-slate-300',   'bg-amber-600'  ]
              const RANK_RING2 = ['ring-yellow-300','ring-slate-200', 'ring-amber-400']
              const RANK_TEXT2 = ['text-amber-900', 'text-slate-700', 'text-amber-100']
              return (
                <div key={s.id} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  {isFirst && <span className="text-yellow-400 text-lg">🏆</span>}
                    <div className="relative">
                    <div className={'rounded-full flex items-center justify-center font-extrabold shadow-lg ring-2 overflow-hidden ' + (isFirst ? 'w-16 h-16 text-xl ' : 'w-12 h-12 text-base ') + RANK_BG2[pos] + ' ' + RANK_RING2[pos] + ' ' + RANK_TEXT2[pos]}>
                      {s.titleIcon
                        ? <img src={s.titleIcon} alt="" className="w-full h-full object-cover" />
                        : s.titleRarity
                          ? <CosmeticArt type="TITLE" rarity={s.titleRarity} className="w-full h-full" />
                          : s.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className={'absolute -bottom-1 -right-1 rounded-full flex items-center justify-center font-black ring-2 ring-white ' + (isFirst ? 'w-6 h-6 text-[10px] ' : 'w-5 h-5 text-[9px] ') + RANK_BG2[pos] + ' ' + RANK_TEXT2[pos]}>
                      {pos + 1}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-white/80 text-center leading-tight truncate w-full px-1">
                    {s.fullName.split(' ')[0]}
                  </span>
                  {s.titleName && (
                    <TitleBadge
                      name={s.titleName}
                      effect={s.titleEffect || 'none'}
                      rarity={s.titleRarity || 'COMMON'}
                      className="text-[9px]"
                    />
                  )}
                  <div className={'w-full rounded-t-xl text-center ' + barPy + ' ' + (isFirst ? 'bg-yellow-500/20 border border-yellow-400/20' : 'bg-white/10')}>
                    <div className={'font-extrabold text-sm ' + (isFirst ? 'text-yellow-300' : 'text-white')}>{s.xp}</div>
                    <div className={'text-[9px] ' + (isFirst ? 'text-yellow-300/60' : 'text-white/40')}>XP</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* TABS — Global + Events */}
      <LeaderboardTabs
        ranked={ranked}
        activeEvents={activeEvents}
        me={me}
        token={token}
        theme={theme}
      />
    </div>
  )
}
