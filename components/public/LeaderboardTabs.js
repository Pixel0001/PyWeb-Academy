'use client'

import { useState } from 'react'
import Link from 'next/link'
import CosmeticArt from '@/components/public/CosmeticArt'
import TitleBadge from '@/components/public/TitleBadge'
import { getBannerStyle } from '@/lib/banner-presets'
import {
  TrophyIcon, Bars3BottomLeftIcon, ChevronRightIcon,
  SparklesIcon, MagnifyingGlassIcon, WrenchScrewdriverIcon,
  BoltIcon, RocketLaunchIcon, FireIcon, StarIcon, CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import { TrophyIcon as TrophySolid, FireIcon as FireSolid } from '@heroicons/react/24/solid'

const LEVELS = [
  { min: 0,    max: 99,       num: 1, name: 'Novice',     Icon: SparklesIcon,          color: 'text-slate-500',   bg: 'bg-slate-100',  bar: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border-slate-200',       iconColor: 'text-slate-400'   },
  { min: 100,  max: 299,      num: 2, name: 'Explorator', Icon: MagnifyingGlassIcon,   color: 'text-blue-600',    bg: 'bg-blue-50',    bar: 'bg-blue-400',    badge: 'bg-blue-100 text-blue-700 border-blue-200',          iconColor: 'text-blue-400'    },
  { min: 300,  max: 699,      num: 3, name: 'Practicant', Icon: WrenchScrewdriverIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', iconColor: 'text-emerald-400' },
  { min: 700,  max: 1499,     num: 4, name: 'Expert',     Icon: BoltIcon,              color: 'text-amber-600',   bg: 'bg-amber-50',   bar: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700 border-amber-200',       iconColor: 'text-amber-400'   },
  { min: 1500, max: 2999,     num: 5, name: 'Master',     Icon: RocketLaunchIcon,      color: 'text-purple-600',  bg: 'bg-purple-50',  bar: 'bg-purple-400',  badge: 'bg-purple-100 text-purple-700 border-purple-200',    iconColor: 'text-purple-400'  },
  { min: 3000, max: Infinity, num: 6, name: 'Legend',     Icon: FireIcon,              color: 'text-rose-600',    bg: 'bg-rose-50',    bar: 'bg-rose-400',    badge: 'bg-rose-100 text-rose-700 border-rose-200',          iconColor: 'text-rose-400'    },
]

function getLevel(xp) {
  return [...LEVELS].reverse().find(l => xp >= l.min) ?? LEVELS[0]
}

const RANK_BG    = ['bg-yellow-400', 'bg-slate-300',   'bg-amber-600'  ]
const RANK_RING  = ['ring-yellow-300','ring-slate-200', 'ring-amber-400']
const RANK_TEXT  = ['text-amber-900', 'text-slate-700', 'text-amber-100']
const RANK_COLOR = ['text-yellow-500','text-slate-400', 'text-amber-700']

function timeLeft(endsAt) {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return 'Încheiat'
  const days  = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const mins  = Math.floor((ms % 3600000) / 60000)
  if (days > 0) return `${days}z ${hours}h rămase`
  if (hours > 0) return `${hours}h ${mins}m rămase`
  return `${mins}m rămase`
}

// ── Global ranked list ────────────────────────────────────────────────────────
function GlobalList({ ranked, me, token, theme }) {
  const tp = theme?.primary || null
  const ts = theme?.secondary || null
  const themeGrad = tp && ts
    ? `linear-gradient(135deg, ${tp} 0%, ${ts} 60%, ${tp} 100%)`
    : null

  const myTitle = (me.equipped || [])
    .find(e => e.type === 'TITLE')?.cosmetic?.name
    ?.replace(/^Titlu\s+[„"']?/, '').replace(/["„'"]$/, '') || null

  const myRank     = ranked.findIndex(s => s.id === me.id) + 1
  const myXP       = ranked.find(s => s.id === me.id)?.xp ?? 0
  const myLevel    = getLevel(myXP)
  const myNextLvl  = LEVELS[myLevel.num] ?? null
  const myXpInto   = myXP - myLevel.min
  const myXpNeeded = myNextLvl ? myNextLvl.min - myLevel.min : 1
  const myPct      = myNextLvl ? Math.min(100, Math.round((myXpInto / myXpNeeded) * 100)) : 100
  const xpToNext   = myNextLvl ? myNextLvl.min - myXP : 0
  const playerAhead  = ranked[myRank - 2]
  const xpToOvertake = playerAhead ? Math.max(0, playerAhead.xp - myXP + 1) : 0

  return (
    <div className="space-y-3">
      {/* MY POSITION CARD */}
      <div
        className={'rounded-2xl p-4 border shadow-sm ' + (themeGrad ? 'border-0 text-white' : myLevel.bg)}
        style={themeGrad ? { background: themeGrad, boxShadow: `0 4px 24px ${tp}55` } : {}}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="pyweb-me-avatar w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md ring-2 ring-white/30"
            style={tp && ts ? { background: `linear-gradient(135deg, ${ts}, ${tp})` } : { background: 'linear-gradient(135deg, #1e3a8a, #1e40af)' }}
          >
            {'#' + myRank}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`pyweb-me-name font-extrabold text-sm ${themeGrad ? 'text-white' : 'text-gray-900'}`}>{'Tu · ' + me.fullName}</div>
            {myTitle && (
              <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${themeGrad ? 'text-white/80' : 'text-amber-600'}`}>
                ✨ {myTitle}
              </div>
            )}
            <Link href={'/learn/' + token + '/levels'} className={'inline-flex items-center gap-1 text-xs font-bold hover:underline mt-0.5 ' + (themeGrad ? 'text-white/90' : myLevel.color)}>
              <myLevel.Icon className={'w-3 h-3 ' + (themeGrad ? 'text-white/80' : myLevel.iconColor)} />
              {'Nivel ' + myLevel.num + ' — ' + myLevel.name}
            </Link>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-2xl font-extrabold ${themeGrad ? 'text-white' : 'text-gray-900'}`}>{myXP}</div>
            <div className={`text-[10px] ${themeGrad ? 'text-white/60' : 'text-gray-500'}`}>XP total</div>
          </div>
        </div>

        {myNextLvl ? (
          <Link href={'/learn/' + token + '/levels'} className="block group">
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className={themeGrad ? 'text-white/80' : myLevel.color}>{'Nv.' + myLevel.num + ' ' + myLevel.name}</span>
              <span className={themeGrad ? 'text-white/70' : 'text-gray-500'}>
                <strong className={themeGrad ? 'text-white' : 'text-gray-900'}>{xpToNext + ' XP'}</strong>
                {' pana la '}
                <span className={themeGrad ? 'text-white/90' : myNextLvl.color}>{myNextLvl.name}</span>
              </span>
            </div>
            <div className="h-2.5 bg-white/30 rounded-full overflow-hidden">
              <div className={'h-full rounded-full transition-all duration-700 ' + myLevel.bar} style={{ width: myPct + '%' }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className={'text-[10px] group-hover:opacity-80 transition flex items-center gap-1 ' + (themeGrad ? 'text-white/60' : 'text-gray-400')}>
                <ChevronRightIcon className="w-3 h-3" />
                {' Vezi toate nivelurile'}
              </span>
              <span className={'text-[10px] ' + (themeGrad ? 'text-white/60' : 'text-gray-500')}>{myXpInto + ' / ' + myXpNeeded + ' XP'}</span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1">
            <FireSolid className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-bold text-rose-600">Nivel maxim atins — Legend!</span>
            <FireSolid className="w-4 h-4 text-rose-500" />
          </div>
        )}

        {playerAhead && xpToOvertake > 0 && (
          <div className="mt-3 px-3 py-2 bg-white/20 rounded-xl flex items-center gap-2 text-xs">
            <Bars3BottomLeftIcon className={`w-4 h-4 shrink-0 ${themeGrad ? 'text-white/80' : 'text-blue-600'}`} />
            <span className={themeGrad ? 'text-white/90' : 'text-gray-700'}>
              <strong className={themeGrad ? 'text-white font-extrabold' : 'text-blue-900'}>{'+' + xpToOvertake + ' XP'}</strong>
              {' ca sa-l depasesti pe '}
              <strong>{playerAhead.fullName}</strong>
              {' (locul #' + (myRank - 1) + ')'}
            </span>
          </div>
        )}
      </div>

      {/* LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/80">
          <StarIcon className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-gray-700">Toți elevii</span>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{ranked.length + ' elevi'}</span>
        </div>
        <div className="divide-y divide-gray-50">
          {ranked.map((student, idx) => {
            const rank  = idx + 1
            const level = getLevel(student.xp)
            const isMe  = student.id === me.id
            const isTop = rank <= 3
            return (
              <div key={student.id}
                className={'pyweb-leaderboard-row px-4 py-3 flex items-center gap-3 transition-colors ' + (isMe ? 'pyweb-me-row' : 'hover:bg-gray-50/80')}
                style={isMe && tp && ts
                  ? { background: `linear-gradient(135deg, ${tp}22 0%, ${ts}33 50%, ${tp}22 100%)`, borderLeft: `4px solid ${tp}` }
                  : isMe
                    ? { background: '#eff6ff', borderLeft: '4px solid #2563eb' }
                    : {}}
              >
                <div className="w-7 shrink-0 flex items-center justify-center">
                  {isTop
                    ? <TrophySolid className={'w-5 h-5 ' + RANK_COLOR[idx]} />
                    : <span className="text-sm font-bold text-gray-400 tabular-nums">{rank}</span>}
                </div>
                <div className={'relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 shadow-sm ring-2 ' + (isMe ? 'pyweb-me-avatar ' : '') +
                    (isTop
                      ? RANK_BG[idx] + ' ' + RANK_RING[idx] + ' ' + RANK_TEXT[idx]
                      : isMe
                        ? 'bg-gradient-to-br from-blue-900 to-blue-700 text-white ring-blue-200'
                        : 'bg-slate-100 text-slate-600 ring-slate-100')}
                >
                  {student.titleIcon
                    ? <img src={student.titleIcon} alt="" className="w-full h-full rounded-full object-cover" />
                    : student.titleRarity
                      ? <CosmeticArt type="TITLE" rarity={student.titleRarity} className="w-full h-full" />
                      : student.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={'text-sm font-semibold truncate ' + (isMe ? 'pyweb-me-name text-blue-900' : 'text-gray-900')}>
                    {isMe ? student.fullName + ' (tu)' : student.fullName}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={'/learn/' + token + '/levels'} className={'inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5 hover:opacity-75 transition ' + level.badge}>
                      <level.Icon className="w-2.5 h-2.5" />
                      {'Nv.' + level.num + ' ' + level.name}
                    </Link>
                    {student.titleName && (
                      <TitleBadge
                        name={student.titleName}
                        effect={student.titleEffect || 'none'}
                        rarity={student.titleRarity || 'COMMON'}
                        className="mt-0.5"
                      />
                    )}
                    {student.bannerName && (() => {
                      const bs = getBannerStyle(student.bannerName)
                      return bs ? (
                        <div className="h-2.5 w-12 rounded-full mt-0.5 shrink-0" style={bs} title={student.bannerName} />
                      ) : null
                    })()}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={'text-base font-extrabold tabular-nums ' + (isMe ? 'text-blue-900' : isTop ? RANK_COLOR[idx] : 'text-gray-800')}>{student.xp}</div>
                  <div className="text-[10px] text-gray-400">XP</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Event ranked list ─────────────────────────────────────────────────────────
function EventList({ event, me, theme }) {
  const tp = theme?.primary || null
  const ts = theme?.secondary || null
  const color = event.themeColor || '#f59e0b'

  const entries = event.entries // already sorted by score desc
  const myEntry = entries.find(e => e.studentId === me.id)
  const myRank  = myEntry ? entries.findIndex(e => e.studentId === me.id) + 1 : null
  const playerAhead = myRank && myRank > 1 ? entries[myRank - 2] : null
  const scoreToOvertake = playerAhead ? Math.max(0, playerAhead.score - (myEntry?.score ?? 0) + 1) : 0

  const typeLabel = { XP: 'XP acumulat', CODING: 'probleme rezolvate', GEMS: 'Gems', COINS: 'Coins' }[event.type] ?? event.type

  return (
    <div className="space-y-3">
      {/* Event banner */}
      <div
        className="rounded-2xl p-4 text-white shadow-md"
        style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}
      >
        <div className="flex items-center gap-3 mb-1">
          <CalendarDaysIcon className="w-5 h-5 text-white/80 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm">{event.name}</div>
            {event.description && <div className="text-xs text-white/70 mt-0.5">{event.description}</div>}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-white/60">{typeLabel}</div>
            <div className="text-[10px] font-bold text-white/80">⏱ {timeLeft(event.endsAt)}</div>
          </div>
        </div>
      </div>

      {/* My position in this event */}
      {myEntry ? (
        <div
          className="rounded-2xl p-4 border-0 text-white shadow-sm"
          style={{ background: tp && ts ? `linear-gradient(135deg, ${tp} 0%, ${ts} 60%, ${tp} 100%)` : `linear-gradient(135deg, ${color}99, ${color}cc)`, boxShadow: `0 4px 24px ${color}44` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md ring-2 ring-white/30"
              style={{ background: `linear-gradient(135deg, ${color}88, ${color})` }}
            >
              {'#' + myRank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm text-white">{'Tu · ' + me.fullName}</div>
              <div className="text-[10px] text-white/70 mt-0.5">Poziția ta în acest event</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-extrabold text-white">{myEntry.score}</div>
              <div className="text-[10px] text-white/60">{typeLabel}</div>
            </div>
          </div>
          {playerAhead && scoreToOvertake > 0 && (
            <div className="mt-3 px-3 py-2 bg-white/20 rounded-xl flex items-center gap-2 text-xs">
              <Bars3BottomLeftIcon className="w-4 h-4 shrink-0 text-white/80" />
              <span className="text-white/90">
                <strong className="text-white font-extrabold">{'+' + scoreToOvertake}</strong>
                {' ca să-l depășești pe '}
                <strong>{playerAhead.student.fullName}</strong>
                {' (locul #' + (myRank - 1) + ')'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200 text-center">
          <div className="text-2xl mb-1">🏁</div>
          <div className="text-sm font-bold text-amber-800">Nu ai intrare în acest event</div>
          <div className="text-xs text-amber-600 mt-1">Rezolvă probleme în perioada evenimentului pentru a apărea în clasament.</div>
        </div>
      )}

      {/* Event list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/80">
          <TrophyIcon className="w-4 h-4" style={{ color }} />
          <span className="text-sm font-bold text-gray-700">Clasament event</span>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{entries.length + ' participanți'}</span>
        </div>
        {entries.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Nimeni nu a acumulat puncte încă.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {entries.map((entry, idx) => {
              const rank  = idx + 1
              const isMe  = entry.studentId === me.id
              const isTop = rank <= 3
              return (
                <div
                  key={entry.id}
                  className={'px-4 py-3 flex items-center gap-3 transition-colors ' + (isMe ? '' : 'hover:bg-gray-50/80')}
                  style={isMe
                    ? { background: tp && ts ? `linear-gradient(135deg, ${tp}22 0%, ${ts}33 50%, ${tp}22 100%)` : `${color}18`, borderLeft: `4px solid ${color}` }
                    : {}}
                >
                  <div className="w-7 shrink-0 flex items-center justify-center">
                    {isTop
                      ? <TrophySolid className={'w-5 h-5 ' + RANK_COLOR[idx]} />
                      : <span className="text-sm font-bold text-gray-400 tabular-nums">{rank}</span>}
                  </div>
                  <div className={'w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 shadow-sm ring-2 ' +
                      (isTop
                        ? RANK_BG[idx] + ' ' + RANK_RING[idx] + ' ' + RANK_TEXT[idx]
                        : isMe
                          ? 'text-white ring-white/40'
                          : 'bg-slate-100 text-slate-600 ring-slate-100')}
                    style={isMe && !isTop ? { background: color, ringColor: color } : {}}
                  >
                    {entry.student.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={'text-sm font-semibold truncate ' + (isMe ? 'text-blue-900' : 'text-gray-900')}>
                      {isMe ? entry.student.fullName + ' (tu)' : entry.student.fullName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={'text-base font-extrabold tabular-nums ' + (isTop ? RANK_COLOR[idx] : isMe ? 'text-blue-900' : 'text-gray-800')}>{entry.score}</div>
                    <div className="text-[10px] text-gray-400">{typeLabel}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main tabs component ───────────────────────────────────────────────────────
export default function LeaderboardTabs({ ranked, activeEvents, me, token, theme }) {
  const [tab, setTab] = useState('global')

  const tabs = [
    { id: 'global', label: '🌍 Global' },
    ...activeEvents.map(ev => ({ id: ev.id, label: '🏆 ' + ev.name })),
  ]

  const activeEvent = activeEvents.find(ev => ev.id === tab)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
      {/* TAB SWITCHER — only show if there are active events */}
      {activeEvents.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                'flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ' +
                (tab === t.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600')
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* CONTENT */}
      {tab === 'global' || !activeEvent ? (
        <GlobalList ranked={ranked} me={me} token={token} theme={theme} />
      ) : (
        <EventList event={activeEvent} me={me} theme={theme} />
      )}
    </div>
  )
}
