export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import {
  PuzzlePieceIcon, ClockIcon, LockClosedIcon, BookOpenIcon,
  RocketLaunchIcon, ChevronRightIcon, SparklesIcon,
  CodeBracketIcon, FireIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'

const MODULE_THEMES = [
  { from: 'from-amber-400', to: 'to-orange-500', soft: 'from-amber-50 to-orange-50', ring: 'ring-amber-200' },
  { from: 'from-yellow-400', to: 'to-amber-500', soft: 'from-yellow-50 to-amber-50', ring: 'ring-yellow-200' },
  { from: 'from-rose-400', to: 'to-pink-500', soft: 'from-rose-50 to-pink-50', ring: 'ring-rose-200' },
  { from: 'from-sky-400', to: 'to-blue-500', soft: 'from-sky-50 to-blue-50', ring: 'ring-sky-200' },
  { from: 'from-emerald-400', to: 'to-teal-500', soft: 'from-emerald-50 to-teal-50', ring: 'ring-emerald-200' },
  { from: 'from-violet-400', to: 'to-purple-500', soft: 'from-violet-50 to-purple-50', ring: 'ring-violet-200' },
]

export default async function StudentLearnDashboard({ params }) {
  const { token } = await params
  const student = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, fullName: true, superStudent: true },
  })
  if (!student) notFound()

  const [modules, accesses, advances, progresses, pendingSubs] = await Promise.all([
    prisma.learningModule.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true, title: true, description: true, language: true, order: true,
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
      select: { lessonId: true, completedAt: true, theoryCompleted: true },
    }),
    prisma.problemSubmission.count({ where: { studentId: student.id, status: 'PENDING' } }),
  ])

  const accessSet = new Set(accesses.map(a => a.moduleId))
  const advanceSet = new Set(advances.map(a => a.moduleId))
  const progressMap = new Map(progresses.map(p => [p.lessonId, p]))

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)
  const completedLessons = progresses.filter(p => p.completedAt).length
  const globalPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 bg-gradient-to-b from-indigo-700 via-purple-700 to-indigo-800 text-white overflow-y-auto">
        <div className="p-5 space-y-4 flex-1">

          {/* Profile */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
              <SparklesIcon className="w-3 h-3 text-yellow-300" /> Spatiul tau
            </div>
            <h1 className="text-xl font-extrabold leading-tight">
              Salut, <span className="text-yellow-300">{student.fullName.split(' ')[0]}</span>!
            </h1>
            <p className="text-white/50 text-xs mt-0.5">{student.fullName}</p>
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 100 100" className="w-16 h-16 -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#fde047" strokeWidth="10"
                  strokeDasharray={`${globalPct * 2.513} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-extrabold">{globalPct}%</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Progres global</div>
              <div className="text-2xl font-extrabold">{completedLessons}<span className="text-white/40 text-base font-normal">/{totalLessons}</span></div>
              <div className="text-[10px] text-white/40">lectii completate</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 rounded-xl p-3">
              <BookOpenIcon className="w-4 h-4 text-indigo-300 mb-1" />
              <div className="text-lg font-bold">{modules.length}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Module</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <ClockIcon className="w-4 h-4 text-amber-300 mb-1" />
              <div className="text-lg font-bold">{pendingSubs}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">In asteptare</div>
            </div>
          </div>

          {/* Random CTA */}
          <Link href={`/learn/${token}/random`}
            className="flex items-center gap-2 px-4 py-3 bg-yellow-400 hover:bg-yellow-300 text-amber-900 rounded-xl font-bold text-sm transition">
            <FireIcon className="w-4 h-4" />
            Probleme aleatorii
            <ChevronRightIcon className="w-4 h-4 ml-auto" />
          </Link>

          {/* Module nav links */}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold px-1 mb-2">Module</p>
            <div className="space-y-0.5">
              {modules.map((m, idx) => {
                const prev = modules[idx - 1]
                const unlocked = idx === 0 || (prev && advanceSet.has(prev.id))
                const doneL = m.lessons.filter(l => progressMap.get(l.id)?.completedAt).length
                const pct2 = m.lessons.length > 0 ? Math.round((doneL / m.lessons.length) * 100) : 0
                return (
                  <a key={m.id} href={`#module-${m.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 transition group">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      unlocked ? 'bg-white/20 text-white' : 'bg-white/10 text-white/30'
                    }`}>{idx + 1}</div>
                    <span className={`text-sm truncate flex-1 ${unlocked ? 'text-white' : 'text-white/30'}`}>{m.title}</span>
                    {unlocked
                      ? <span className="text-[10px] font-bold text-white/40 shrink-0">{pct2}%</span>
                      : <LockClosedIcon className="w-3.5 h-3.5 text-white/20 shrink-0" />
                    }
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-5 lg:p-6 space-y-4">

          {/* Mobile top bar */}
          <div className="lg:hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold">
                  Salut, <span className="text-yellow-300">{student.fullName.split(' ')[0]}</span>!
                </h1>
                <p className="text-white/60 text-xs">{completedLessons}/{totalLessons} lectii &middot; {globalPct}%</p>
              </div>
              <Link href={`/learn/${token}/random`}
                className="flex items-center gap-1.5 px-3 py-2 bg-yellow-400 text-amber-900 rounded-xl font-bold text-xs shrink-0">
                <FireIcon className="w-4 h-4" /> Antrenament
              </Link>
            </div>
          </div>

          {pendingSubs > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 flex items-center gap-3">
              <ClockIcon className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-900">
                Ai <strong>{pendingSubs}</strong> {pendingSubs === 1 ? 'problema in asteptare' : 'probleme in asteptare'} la profesor.
              </p>
            </div>
          )}

          {/* Module cards */}
          {modules.map((m, idx) => {
            const prev = modules[idx - 1]
            const unlocked = idx === 0 || (prev && advanceSet.has(prev.id))
            const hasFullAccess = accessSet.has(m.id)
            const advanceGranted = advanceSet.has(m.id)
            const totalL = m.lessons.length
            const doneL = m.lessons.filter(l => progressMap.get(l.id)?.completedAt).length
            const pct = totalL > 0 ? Math.round((doneL / totalL) * 100) : 0
            const theme = MODULE_THEMES[idx % MODULE_THEMES.length]

            return (
              <div id={`module-${m.id}`} key={m.id}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ${unlocked ? theme.ring : 'ring-slate-200 opacity-70'}`}>

                {/* Module header */}
                <div className={`h-1.5 bg-gradient-to-r ${theme.from} ${theme.to}`} />
                <div className={`px-5 py-4 bg-gradient-to-br ${theme.soft} flex items-center gap-4`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.from} ${theme.to} flex items-center justify-center shadow shrink-0`}>
                    {unlocked
                      ? <CodeBracketIcon className="w-6 h-6 text-white" />
                      : <LockClosedIcon className="w-6 h-6 text-white" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/80 text-slate-600 rounded-full">Modul {idx + 1}</span>
                      {m.language && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-900 text-white rounded-full">{m.language}</span>}
                      {!unlocked && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-600 text-white rounded-full"><LockClosedIcon className="w-3 h-3" /> Blocat</span>}
                      {hasFullAccess && unlocked && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-600 text-white rounded-full"><CheckSolid className="w-3 h-3" /> Acces complet</span>}
                      {advanceGranted && <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-600 text-white rounded-full"><RocketLaunchIcon className="w-3 h-3" /> Advance</span>}
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900">{m.title}</h2>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className={`text-2xl font-extrabold bg-gradient-to-r ${theme.from} ${theme.to} bg-clip-text text-transparent`}>{pct}%</div>
                    <div className="text-xs text-slate-500">{doneL}/{totalL} lectii</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-slate-100">
                  <div className={`h-full bg-gradient-to-r ${theme.from} ${theme.to} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>

                {/* Locked message */}
                {!unlocked && (
                  <div className="px-5 py-3 bg-slate-50 flex items-center gap-2 text-sm text-slate-600">
                    <LockClosedIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    Termina modulul anterior pentru a debloca.
                    <Link href={`/learn/${token}/random`} className="underline text-indigo-600 font-medium ml-1">Antrenament alternativ</Link>
                  </div>
                )}

                {/* Lessons grid */}
                <div className="p-4">
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {m.lessons.map((l, li) => {
                      const prevDone = li === 0 || !!progressMap.get(m.lessons[li - 1].id)?.completedAt
                      const accessible = student.superStudent
                        ? true
                        : unlocked && (hasFullAccess || l.isFree) && prevDone
                      const prog = progressMap.get(l.id)
                      const done = !!prog?.completedAt
                      const started = !!prog?.theoryCompleted && !done

                      const numCls = done
                        ? 'bg-emerald-500 text-white'
                        : started ? 'bg-indigo-500 text-white'
                        : accessible ? 'bg-slate-100 text-slate-600'
                        : 'bg-slate-100 text-slate-300'

                      const cardCls = !accessible
                        ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                        : done
                          ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:shadow-sm'
                          : started
                            ? 'border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:shadow-sm'
                            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-sm'

                      const inner = (
                        <>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${numCls}`}>
                            {done ? <CheckSolid className="w-4 h-4" /> : li + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-sm text-slate-900 truncate">{l.title}</span>
                              {l.isFree && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase tracking-wider">Gratis</span>}
                              {started && !done && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded uppercase tracking-wider">In curs</span>}
                              {!accessible && <LockClosedIcon className="w-3 h-3 text-slate-300" />}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                              <PuzzlePieceIcon className="w-3 h-3" />
                              {l._count.problems} {l._count.problems === 1 ? 'problema' : 'probleme'}
                            </div>
                          </div>
                          {accessible && <ChevronRightIcon className="w-4 h-4 text-slate-300 shrink-0" />}
                        </>
                      )

                      return accessible ? (
                        <Link key={l.id} href={`/learn/${token}/lesson/${l.id}`}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${cardCls}`}>
                          {inner}
                        </Link>
                      ) : (
                        <div key={l.id} aria-disabled="true"
                          className={`flex items-center gap-3 p-3 rounded-xl border select-none ${cardCls}`}>
                          {inner}
                        </div>
                      )
                    })}
                    {m.lessons.length === 0 && (
                      <p className="sm:col-span-2 xl:col-span-3 text-sm text-slate-400 text-center py-4">
                        Nicio lectie inca.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
