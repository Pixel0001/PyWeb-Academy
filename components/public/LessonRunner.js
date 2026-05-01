'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  BookOpenIcon, PuzzlePieceIcon, ClockIcon, LightBulbIcon,
  PaperAirplaneIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon,
  ChevronLeftIcon, ChevronRightIcon, TrophyIcon, RocketLaunchIcon,
  AcademicCapIcon, SparklesIcon, HomeIcon, Bars3Icon, XMarkIcon, LockClosedIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid, StarIcon } from '@heroicons/react/24/solid'

const DIFF_COLOR = {
  EASY: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-rose-100 text-rose-700',
}
const DIFF_LABEL = { EASY: 'Usor', MEDIUM: 'Mediu', HARD: 'Greu' }

function renderTheory(text) {
  if (!text) return null
  const lines = text.split('\n')
  const out = []
  let inCode = false; let codeBuf = []
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    if (ln.startsWith('```')) {
      if (inCode) {
        out.push(<pre key={`c${i}`} className="bg-slate-900 text-slate-100 rounded-xl p-4 my-4 overflow-x-auto text-sm font-mono shadow-inner">{codeBuf.join('\n')}</pre>)
        codeBuf = []; inCode = false
      } else { inCode = true }
      continue
    }
    if (inCode) { codeBuf.push(ln); continue }
    if (ln.startsWith('## ')) out.push(<h2 key={i} className="text-xl font-bold mt-5 mb-2 text-slate-900">{ln.slice(3)}</h2>)
    else if (ln.startsWith('# ')) out.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-slate-900">{ln.slice(2)}</h1>)
    else if (ln.startsWith('### ')) out.push(<h3 key={i} className="text-base font-semibold mt-4 mb-1 text-slate-800">{ln.slice(4)}</h3>)
    else if (ln.trim() === '') out.push(<div key={i} className="h-2" />)
    else {
      const html = ln
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-indigo-50 rounded-md text-sm font-mono text-indigo-700 font-medium">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      out.push(<p key={i} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />)
    }
  }
  return out
}

function Timer({ seconds }) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const dash = (seconds % 60) / 60 * 87.9
  return (
    <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full pl-1.5 pr-3 py-1 ring-1 ring-white/30">
      <div className="relative w-6 h-6">
        <svg viewBox="0 0 36 36" className="w-6 h-6 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
          <circle cx="18" cy="18" r="14" fill="none" stroke="white" strokeWidth="3"
            strokeDasharray={`${dash} 88`} strokeLinecap="round" />
        </svg>
        <ClockIcon className="absolute inset-0 m-auto w-3 h-3 text-white" />
      </div>
      <span className="font-mono text-xs font-bold tabular-nums">{mins}:{String(secs).padStart(2, '0')}</span>
    </div>
  )
}

export default function LessonRunner({ token, lesson, problems, initialProgress, advanceGranted, moduleLessons = [], progressByLesson = {}, superStudent = false }) {
  const router = useRouter()
  const [progress, setProgress] = useState(initialProgress || { theoryCompleted: false, currentProblemIndex: 0 })
  const [step, setStep] = useState(progress.theoryCompleted ? 'problems' : 'theory')
  const [idx, setIdx] = useState(progress.currentProblemIndex || 0)
  const [submissions, setSubmissions] = useState(problems.map(p => p.submission))
  const [answer, setAnswer] = useState('')
  const [code, setCode] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [time, setTime] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (step !== 'problems') return
    const t = setInterval(() => setTime(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [step, idx])

  useEffect(() => {
    setAnswer(''); setCode(problems[idx]?.starterCode || ''); setShowHint(false)
    startRef.current = Date.now(); setTime(0)
  }, [idx, problems])

  const cur = problems[idx]
  const curSub = submissions[idx]
  const allDone = submissions.every(s => s != null)
  const doneCount = submissions.filter(s => s != null).length
  const lessonPct = problems.length > 0 ? Math.round((doneCount / problems.length) * 100) : 0

  const completeTheory = async () => {
    await fetch(`/api/public/learn/${token}/lesson/${lesson.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theoryCompleted: true }),
    })
    setProgress({ ...progress, theoryCompleted: true })
    setStep('problems')
  }

  const submit = async () => {
    if (cur.type === 'CODING' || cur.type === 'INPUT_OUTPUT') {
      if (!code.trim() && !answer.trim()) return toast.error('Introdu un raspuns')
    } else if (!answer.trim()) return toast.error('Introdu un raspuns')
    setSubmitting(true)
    try {
      const r = await fetch(`/api/public/learn/${token}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: cur.id, lessonId: lesson.id, source: 'lesson', answer: answer || null, code: code || null, timeSpent: time }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Eroare')
      const next = [...submissions]; next[idx] = d.submission; setSubmissions(next)
      if (d.autoCorrect === true) toast.success('Corect! Bravo!')
      else toast('Trimis — asteapta verificarea profesorului')
    } catch (e) { toast.error(e.message) } finally { setSubmitting(false) }
  }

  const nextProblem = async () => {
    const ni = idx + 1
    if (ni < problems.length) {
      setIdx(ni)
      await fetch(`/api/public/learn/${token}/lesson/${lesson.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentProblemIndex: ni }),
      })
    }
  }

  const finishLesson = async () => {
    setFinishing(true)
    try {
      await fetch(`/api/public/learn/${token}/lesson/${lesson.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
      toast.success('Lectie finalizata! Bravo!')
      setTimeout(() => router.push(`/learn/${token}`), 700)
    } catch (e) {
      toast.error('Eroare la finalizare')
      setFinishing(false)
    }
  }

  // ── SIDEBAR CONTENT (shared between desktop + mobile overlay) ──
  const SidebarContent = () => (
    <div className="flex flex-col min-h-full">
      {/* Back link */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <Link href={`/learn/${token}`}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition">
          <ChevronLeftIcon className="w-4 h-4" /> Inapoi la module
        </Link>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {/* Module badge */}
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">{lesson.module.title}</div>

        {/* Lesson title */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {progress.theoryCompleted
              ? <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0"><CheckSolid className="w-4 h-4 text-white" /></div>
              : <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0"><BookOpenIcon className="w-4 h-4 text-white" /></div>
            }
            <h2 className="text-base font-extrabold text-white leading-tight">{lesson.title}</h2>
          </div>
        </div>

        {/* Step tabs */}
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => { setStep('theory'); setMobileSidebarOpen(false) }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${step === 'theory' ? 'bg-white text-indigo-700 shadow' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
            <BookOpenIcon className="w-3.5 h-3.5" /> Teorie
            {progress.theoryCompleted && <CheckSolid className="w-3 h-3 text-emerald-500" />}
          </button>
          <button onClick={() => { if (progress.theoryCompleted) { setStep('problems'); setMobileSidebarOpen(false) } }}
            disabled={!progress.theoryCompleted}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${step === 'problems' ? 'bg-white text-purple-700 shadow' : progress.theoryCompleted ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
            <PuzzlePieceIcon className="w-3.5 h-3.5" /> Probleme
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-white/50 mb-1 font-semibold uppercase tracking-wider">
            <span>Progres</span><span>{doneCount}/{problems.length}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${lessonPct}%` }} />
          </div>
        </div>

        {/* Problems list — only when on problems tab */}
        {step === 'problems' && problems.length > 0 && (
          <div className="space-y-1 pt-1">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-2">Probleme</p>
            {problems.map((p, i) => {
              const s = submissions[i]
              const isOk = s?.status === 'GRADED' && (s.grade ?? 0) >= 60
              const isRev = s?.status === 'NEEDS_REVISION'
              const isPending = s && !isOk && !isRev
              const isActive = i === idx
              return (
                <button key={p.id} onClick={() => { setIdx(i); setMobileSidebarOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${isActive ? 'bg-white/20 ring-1 ring-white/40' : 'hover:bg-white/10'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isActive ? 'bg-white text-indigo-700'
                    : isOk ? 'bg-emerald-500 text-white'
                    : isRev ? 'bg-rose-500 text-white'
                    : isPending ? 'bg-amber-500 text-white'
                    : 'bg-white/15 text-white/70'
                  }`}>
                    {isOk ? <CheckSolid className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/80 truncate font-medium">{p.title}</div>
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block ${DIFF_COLOR[p.difficulty]}`}>{DIFF_LABEL[p.difficulty]}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Module lessons list */}
        {moduleLessons.length > 0 && (
          <div className="space-y-0.5 pt-1">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-2">Lectii in modul</p>
            {moduleLessons.map((l, i) => {
              const lp = progressByLesson[l.id]
              const done = !!lp?.completedAt
              const started = !!lp?.theoryCompleted && !done
              const isCurrent = l.id === lesson.id
              const prevLesson = moduleLessons[i - 1]
              const prevDone = i === 0 || !!progressByLesson[prevLesson?.id]?.completedAt
              const locked = !superStudent && !isCurrent && !done && !prevDone
              const inner = (
                <>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isCurrent ? 'bg-white text-indigo-700'
                    : done ? 'bg-emerald-500 text-white'
                    : locked ? 'bg-white/5 text-white/20'
                    : started ? 'bg-indigo-400 text-white'
                    : 'bg-white/15 text-white/60'
                  }`}>
                    {done && !isCurrent
                      ? <CheckSolid className="w-3.5 h-3.5" />
                      : locked
                        ? <LockClosedIcon className="w-3.5 h-3.5" />
                        : i + 1
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate font-medium ${
                      isCurrent ? 'text-white font-bold'
                      : done ? 'text-white/70'
                      : locked ? 'text-white/20'
                      : 'text-white/50'
                    }`}>{l.title}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">
                      {l._count.problems} {l._count.problems === 1 ? 'problema' : 'probleme'}
                    </div>
                  </div>
                  {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 shrink-0" />}
                  {locked && !isCurrent && <LockClosedIcon className="w-3.5 h-3.5 text-white/20 shrink-0" />}
                </>
              )
              return locked ? (
                <div key={l.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-not-allowed opacity-60">
                  {inner}
                </div>
              ) : (
                <Link
                  key={l.id}
                  href={`/learn/${token}/lesson/${l.id}`}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                    isCurrent ? 'bg-white/20 ring-1 ring-white/40' : 'hover:bg-white/10'
                  }`}>
                  {inner}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Finish button */}
      {step === 'problems' && allDone && (
        <div className="p-4 border-t border-white/10">
          <button onClick={finishLesson} disabled={finishing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition disabled:opacity-60">
            <TrophyIcon className="w-5 h-5" />
            {finishing ? 'Se salveaza...' : 'Finalizeaza lectia'}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 bg-gradient-to-b from-indigo-700 via-purple-700 to-indigo-800 text-white overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-gradient-to-b from-indigo-700 via-purple-700 to-indigo-800 text-white flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 pt-4 shrink-0">
              <span className="text-sm font-bold text-white/70">Navigare</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 bg-white/10 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className={`shrink-0 px-4 sm:px-6 py-3 flex items-center gap-3 text-white shadow-sm ${step === 'theory' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}>
          {/* Mobile menu btn */}
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-1.5 bg-white/15 rounded-lg">
            <Bars3Icon className="w-5 h-5 text-white" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-xs text-white/60 truncate">{lesson.module.title}</div>
            <div className="font-bold text-sm truncate">{lesson.title}</div>
          </div>

          {step === 'problems' && cur && (
            <div className="flex items-center gap-2 shrink-0">
              <Timer seconds={time} />
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${DIFF_COLOR[cur.difficulty]}`}>
                {DIFF_LABEL[cur.difficulty]}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded-full text-xs font-bold">
                <StarIcon className="w-3 h-3 text-yellow-300" /> {cur.points}
              </span>
            </div>
          )}
          {step === 'theory' && (
            <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 px-3 py-1.5 rounded-full">
              <BookOpenIcon className="w-3.5 h-3.5" /> Teorie
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-200 shrink-0">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500" style={{ width: `${lessonPct}%` }} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">

            {/* THEORY */}
            {step === 'theory' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow">
                    <AcademicCapIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold">Teorie</div>
                    <h1 className="text-lg font-extrabold text-slate-900">{lesson.title}</h1>
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  {lesson.videoUrl && (
                    <div className="aspect-video rounded-xl overflow-hidden mb-6 bg-black shadow">
                      <iframe src={lesson.videoUrl} className="w-full h-full" allowFullScreen />
                    </div>
                  )}
                  <article className="space-y-1.5 text-sm leading-relaxed">{renderTheory(lesson.theory)}</article>
                  <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
                    <button onClick={completeTheory}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition shadow">
                      <CheckCircleIcon className="w-5 h-5" />
                      Am inteles — treci la probleme
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NO PROBLEMS */}
            {step === 'problems' && problems.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-slate-400">
                Nicio problema in aceasta lectie.
              </div>
            )}

            {/* PROBLEM */}
            {step === 'problems' && cur && (
              <div className="space-y-3">
                {/* Problem nav pills (mobile-friendly horizontal scroll) */}
                <div className="bg-white rounded-xl shadow-sm p-2 flex gap-1.5 overflow-x-auto">
                  {problems.map((p, i) => {
                    const s = submissions[i]
                    const isOk = s?.status === 'GRADED' && (s.grade ?? 0) >= 60
                    const isRev = s?.status === 'NEEDS_REVISION'
                    const isPending = s && !isOk && !isRev
                    const cls = i === idx
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                      : isOk ? 'bg-emerald-100 text-emerald-700'
                      : isRev ? 'bg-rose-100 text-rose-700'
                      : isPending ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    return (
                      <button key={p.id} onClick={() => setIdx(i)}
                        className={`min-w-[38px] h-9 rounded-lg text-sm font-bold transition flex items-center justify-center ${cls}`}>
                        {isOk ? <CheckSolid className="w-4 h-4" /> : i + 1}
                      </button>
                    )
                  })}
                </div>

                {/* Problem card */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Problema {idx + 1} din {problems.length}</div>
                      <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">{cur.title}</h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${DIFF_COLOR[cur.difficulty]}`}>{DIFF_LABEL[cur.difficulty]}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">
                        <StarIcon className="w-3 h-3 text-amber-400" /> {cur.points} pct
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">{cur.description}</div>

                    {curSub ? (
                      <div className={`rounded-xl p-4 border-2 ${curSub.status === 'GRADED' && (curSub.grade ?? 0) >= 60 ? 'bg-emerald-50 border-emerald-200' : curSub.status === 'NEEDS_REVISION' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-2 font-bold flex-wrap">
                          {curSub.status === 'GRADED' && (curSub.grade ?? 0) >= 60 ? (
                            <><CheckCircleIcon className="w-5 h-5 text-emerald-600" /><span className="text-emerald-800">Notat — bravo!</span></>
                          ) : curSub.status === 'NEEDS_REVISION' ? (
                            <><ExclamationTriangleIcon className="w-5 h-5 text-rose-600" /><span className="text-rose-800">Necesita refacere</span></>
                          ) : (
                            <><ClockIcon className="w-5 h-5 text-amber-600" /><span className="text-amber-800">In asteptarea profesorului</span></>
                          )}
                          {typeof curSub.grade === 'number' && (
                            <span className="ml-auto text-sm">Nota: <strong className="text-lg">{curSub.grade}/100</strong></span>
                          )}
                        </div>
                        {curSub.feedback && (
                          <div className="mt-3 p-3 bg-white/60 rounded-lg text-sm text-slate-800">
                            <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Feedback profesor</div>
                            {curSub.feedback}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-slate-500">
                          Raspunsul tau: <code className="bg-white px-1.5 py-0.5 rounded font-mono">{curSub.answer || (curSub.code ? '(cod)' : '(gol)')}</code>
                        </div>
                        {curSub.status === 'NEEDS_REVISION' && (
                          <button onClick={() => { const next = [...submissions]; next[idx] = null; setSubmissions(next) }}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700">
                            <ArrowPathIcon className="w-4 h-4" /> Refa problema
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {cur.type === 'MULTIPLE_CHOICE' && (
                          <div className="space-y-2">
                            {cur.options?.map((opt, i) => (
                              <label key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${answer === opt ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}>
                                <input type="radio" name="opt" checked={answer === opt} onChange={() => setAnswer(opt)} className="w-4 h-4 accent-indigo-600" />
                                <span className="text-sm text-slate-800">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {cur.type === 'SHORT_ANSWER' && (
                          <input value={answer} onChange={e => setAnswer(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                            placeholder="Scrie raspunsul tau..." />
                        )}
                        {cur.type === 'INPUT_OUTPUT' && (
                          <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-mono text-sm focus:border-indigo-500 outline-none"
                            placeholder="Output asteptat..." />
                        )}
                        {cur.type === 'CODING' && (
                          <div>
                            <textarea value={code} onChange={e => setCode(e.target.value)} rows={12}
                              className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl font-mono text-sm bg-slate-900 text-slate-100 focus:border-indigo-400 outline-none"
                              placeholder={cur.starterCode || `# scrie codul tau (${cur.language || 'python'})`} />
                            <p className="text-xs text-slate-400 mt-1.5">Codul va fi trimis profesorului pentru verificare.</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-1">
                          {cur.hint && (
                            <button onClick={() => setShowHint(!showHint)}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-2 border-amber-300 text-amber-700 rounded-xl hover:bg-amber-50 font-semibold">
                              <LightBulbIcon className="w-4 h-4" /> {showHint ? 'Ascunde hint' : 'Hint'}
                            </button>
                          )}
                          <button onClick={submit} disabled={submitting}
                            className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg active:scale-95 transition disabled:opacity-50 shadow text-sm">
                            <PaperAirplaneIcon className="w-4 h-4" />
                            {submitting ? 'Se trimite...' : 'Trimite raspunsul'}
                          </button>
                        </div>
                        {showHint && cur.hint && (
                          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex gap-2">
                            <LightBulbIcon className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>{cur.hint}</div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 font-semibold">
                        <ChevronLeftIcon className="w-4 h-4" /> Anterior
                      </button>
                      {idx < problems.length - 1 ? (
                        <button onClick={nextProblem}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
                          Urmatoarea <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      ) : allDone ? (
                        <button onClick={finishLesson} disabled={finishing}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 shadow">
                          <TrophyIcon className="w-5 h-5" />
                          {finishing ? 'Se salveaza...' : 'Finalizeaza lectia'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Advance / finish panel */}
                {idx === problems.length - 1 && allDone && (
                  <div className={`p-4 rounded-2xl border-2 ${advanceGranted ? 'bg-purple-50 border-purple-200' : 'bg-amber-50 border-amber-200'}`}>
                    {advanceGranted ? (
                      <div className="flex gap-3">
                        <RocketLaunchIcon className="w-7 h-7 text-purple-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-purple-900">
                          <div className="font-bold mb-0.5">Profesorul ti-a acordat advance!</div>
                          <Link href={`/learn/${token}`} className="underline font-semibold">Inapoi la module</Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <SparklesIcon className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                          <div className="font-bold mb-0.5">Bravo ca ai terminat!</div>
                          Pentru modulul urmator ai nevoie de aprobarea profesorului. Pana atunci incearca{' '}
                          <Link href={`/learn/${token}/random`} className="underline font-semibold">probleme aleatorii</Link>.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
