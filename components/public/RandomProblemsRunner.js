'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ChevronLeftIcon, FireIcon, AdjustmentsHorizontalIcon, ArrowPathIcon,
  PaperAirplaneIcon, CheckCircleIcon, ClockIcon, LightBulbIcon,
  PuzzlePieceIcon, SparklesIcon, BoltIcon, ChevronUpIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid, StarIcon } from '@heroicons/react/24/solid'

const DIFF_CONFIG = {
  EASY:   { label: 'Usor',    cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  MEDIUM: { label: 'Mediu',   cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400' },
  HARD:   { label: 'Greu',    cls: 'bg-rose-100 text-rose-700',       dot: 'bg-rose-400' },
  RANDOM: { label: 'Aleator', cls: 'bg-slate-100 text-slate-600',     dot: 'bg-slate-400' },
}

export default function RandomProblemsRunner({ token, student, topics }) {
  const [difficulty, setDifficulty] = useState('RANDOM')
  const [topic, setTopic]           = useState('')
  const [count, setCount]           = useState(5)
  const [problems, setProblems]     = useState([])
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [submissions, setSubmissions] = useState({})
  const [answers, setAnswers]       = useState({})
  const [expanded, setExpanded]     = useState({})
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const fetchProblems = async () => {
    setLoading(true)
    setMobileSidebarOpen(false)
    try {
      const p = new URLSearchParams({ difficulty, count: String(count) })
      if (topic) p.set('topic', topic)
      const r = await fetch(`/api/public/learn/${token}/random?${p}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Eroare')
      setProblems(d.problems || [])
      setSuggestion(d.suggestion || null)
      setSubmissions({})
      setAnswers({})
      setExpanded(Object.fromEntries((d.problems || []).map(p => [p.id, true])))
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  const submit = async (p) => {
    const ans = answers[p.id]?.trim()
    if (!ans) return toast.error('Introdu un raspuns')
    try {
      const r = await fetch(`/api/public/learn/${token}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: p.id, source: 'random',
          answer: p.type !== 'CODING' ? ans : null,
          code: p.type === 'CODING' ? ans : null,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Eroare')
      setSubmissions(s => ({ ...s, [p.id]: d.submission }))
      if (p.type === 'CODING') {
        toast('Trimis profesorului', { icon: '👨‍🏫' })
      } else if (d.autoCorrect === true) {
        toast.success('Corect! Bravo!')
      } else {
        toast.error('Gresit — incearca alta problema')
      }
    } catch (e) { toast.error(e.message) }
  }

  const doneCount = problems.filter(p => submissions[p.id]).length

  // ── FILTER PANEL ─────────────────────────────────────────────────
  const FilterPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <Link href={`/learn/${token}`}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition">
          <ChevronLeftIcon className="w-4 h-4" /> Inapoi la module
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            <FireIcon className="w-3 h-3 text-yellow-300" /> Antrenament
          </div>
          <h1 className="text-xl font-extrabold text-white leading-tight">Probleme<br/>aleatorii</h1>
          <p className="text-white/50 text-xs mt-1">{student.fullName}</p>
        </div>

        {/* AI suggestion */}
        {suggestion && suggestion.next !== suggestion.currentDifficulty && (
          <div className="bg-white/10 rounded-xl p-3 ring-1 ring-white/20">
            <div className="flex items-start gap-2">
              <SparklesIcon className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-300 mb-0.5">Sugestie AI</div>
                <div className="text-xs text-white/80">{suggestion.reason}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Dificultate</label>
            <div className="grid grid-cols-2 gap-1.5">
              {['RANDOM', 'EASY', 'MEDIUM', 'HARD'].map(d => {
                const cfg = DIFF_CONFIG[d]
                const active = difficulty === d
                return (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      active ? 'bg-white text-slate-800 shadow' : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Topic</label>
            <select value={topic} onChange={e => setTopic(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 text-white text-xs rounded-xl outline-none focus:border-white/40">
              <option value="" className="text-slate-900">— Toate topicele —</option>
              {topics.map(t => <option key={t} value={t} className="text-slate-900">{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
              Numar probleme: <span className="text-white font-extrabold">{count}</span>
            </label>
            <input type="range" min={1} max={10} value={count} onChange={e => setCount(parseInt(e.target.value))}
              className="w-full accent-yellow-400" />
            <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
              <span>1</span><span>10</span>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button onClick={fetchProblems} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-amber-900 rounded-xl font-extrabold text-sm transition disabled:opacity-60 shadow-lg">
          {loading
            ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Se incarca...</>
            : <><BoltIcon className="w-4 h-4" /> Genereaza probleme</>
          }
        </button>

        {/* Progress */}
        {problems.length > 0 && (
          <div>
            <div className="flex justify-between text-[10px] text-white/40 mb-1.5 font-bold uppercase tracking-wider">
              <span>Progres sesiune</span>
              <span>{doneCount}/{problems.length}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${problems.length > 0 ? Math.round(doneCount / problems.length * 100) : 0}%` }} />
            </div>
          </div>
        )}

        {/* Problem nav */}
        {problems.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-2">Probleme</p>
            {problems.map((p, i) => {
              const sub = submissions[p.id]
              const isOk = sub?.status === 'GRADED' && (sub.grade ?? 0) >= 60
              const isPending = sub && !isOk
              const cfg = DIFF_CONFIG[p.difficulty]
              return (
                <a key={p.id} href={`#problem-${p.id}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 transition group">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isOk ? 'bg-emerald-500 text-white'
                    : isPending ? 'bg-amber-500 text-white'
                    : 'bg-white/15 text-white/70'
                  }`}>
                    {isOk ? <CheckSolid className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/70 truncate">{p.title}</div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 bg-gradient-to-b from-amber-600 via-orange-600 to-rose-700 text-white overflow-hidden">
        <FilterPanel />
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-gradient-to-b from-amber-600 via-orange-600 to-rose-700 text-white flex flex-col overflow-y-auto">
            <FilterPanel />
          </div>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="shrink-0 px-4 sm:px-6 py-3 flex items-center gap-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm">
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-1.5 bg-white/15 rounded-lg">
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-white" />
          </button>
          <FireIcon className="w-5 h-5 text-yellow-300 hidden lg:block" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">Probleme aleatorii</div>
            {problems.length > 0 && (
              <div className="text-white/60 text-xs">{doneCount}/{problems.length} rezolvate</div>
            )}
          </div>
          {problems.length > 0 && (
            <button onClick={fetchProblems} disabled={loading}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition">
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Regenereaza
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-200 shrink-0">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
            style={{ width: `${problems.length > 0 ? Math.round(doneCount / problems.length * 100) : 0}%` }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {problems.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-5 shadow-xl">
                <FireIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Gata de antrenament?</h2>
              <p className="text-slate-500 text-base max-w-sm mb-6">
                Alege dificultatea si topicul din panoul lateral, apoi genereaza problemele tale.
              </p>
              <button onClick={fetchProblems} disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-extrabold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition disabled:opacity-60">
                <BoltIcon className="w-6 h-6" />
                {loading ? 'Se incarca...' : 'Genereaza probleme'}
              </button>
              {/* Mobile filter shortcut */}
              <button onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
                <AdjustmentsHorizontalIcon className="w-4 h-4" /> Filtreaza
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
              {problems.map((p, i) => {
                const sub = submissions[p.id]
                const isOk = sub?.status === 'GRADED' && (sub.grade ?? 0) >= 60
                const isPending = sub && !isOk
                const cfg = DIFF_CONFIG[p.difficulty]
                const isExpanded = expanded[p.id] !== false

                return (
                  <div key={p.id} id={`problem-${p.id}`}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ${isOk ? 'ring-emerald-200' : isPending ? 'ring-amber-200' : 'ring-slate-200'}`}>

                    {/* Card header */}
                    <div className={`h-1 bg-gradient-to-r ${isOk ? 'from-emerald-400 to-teal-400' : isPending ? 'from-amber-400 to-orange-400' : 'from-amber-400 to-orange-500'}`} />
                    <div className="px-5 py-4 flex items-center gap-3 cursor-pointer select-none"
                      onClick={() => setExpanded(e => ({ ...e, [p.id]: !isExpanded }))}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                        isOk ? 'bg-emerald-500 text-white' : isPending ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isOk ? <CheckSolid className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-base">{p.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                          {p.topic && <span className="text-[10px] text-slate-400 font-medium">{p.topic}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <StarIcon className="w-3 h-3 text-amber-400" /> {p.points} pct
                          </span>
                          {isOk && <span className="text-xs text-emerald-600 font-semibold">Rezolvat</span>}
                          {isPending && <span className="text-xs text-amber-600 font-semibold">In asteptare</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-slate-400">
                        {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{p.description}</p>

                        {sub ? (
                          <div className={`rounded-xl p-4 border-2 ${isOk ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center gap-2 font-bold text-sm">
                              {isOk
                                ? <><CheckCircleIcon className="w-5 h-5 text-emerald-600" /><span className="text-emerald-800">Raspuns corect — bravo!</span></>
                                : <><ClockIcon className="w-5 h-5 text-amber-600" /><span className="text-amber-800">Trimis — in asteptare</span></>
                              }
                              {typeof sub.grade === 'number' && (
                                <span className="ml-auto text-slate-700">Nota: <strong>{sub.grade}/100</strong></span>
                              )}
                            </div>
                            {sub.feedback && (
                              <div className="mt-2 text-xs text-slate-700 bg-white/60 rounded-lg p-2">{sub.feedback}</div>
                            )}
                          </div>
                        ) : (
                          <>
                            {p.type === 'MULTIPLE_CHOICE' && (
                              <div className="space-y-2">
                                {p.options?.map((opt, oi) => (
                                  <label key={oi}
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${answers[p.id] === opt ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 hover:border-amber-200 hover:bg-slate-50'}`}>
                                    <input type="radio" name={`opt-${p.id}`} checked={answers[p.id] === opt}
                                      onChange={() => setAnswers(a => ({ ...a, [p.id]: opt }))}
                                      className="w-4 h-4 accent-amber-500" />
                                    <span className="text-sm text-slate-800">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {p.type === 'CODING' && (
                              <textarea value={answers[p.id] ?? p.starterCode ?? ''}
                                onChange={e => setAnswers(a => ({ ...a, [p.id]: e.target.value }))} rows={8}
                                className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl font-mono text-sm bg-slate-900 text-slate-100 outline-none focus:border-amber-500" />
                            )}
                            {(p.type === 'SHORT_ANSWER' || p.type === 'INPUT_OUTPUT') && (
                              <input value={answers[p.id] || ''}
                                onChange={e => setAnswers(a => ({ ...a, [p.id]: e.target.value }))}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition"
                                placeholder="Raspunsul tau..." />
                            )}
                            <button onClick={() => submit(p)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm shadow hover:shadow-md active:scale-95 transition">
                              <PaperAirplaneIcon className="w-4 h-4" /> Trimite raspunsul
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Finished all */}
              {doneCount === problems.length && problems.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 p-6 text-center">
                  <CheckSolid className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-xl font-extrabold text-emerald-900 mb-1">Sesiune completa!</h3>
                  <p className="text-emerald-700 text-sm mb-4">Ai rezolvat toate {problems.length} problemele. Mai vrei?</p>
                  <button onClick={fetchProblems}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition">
                    <ArrowPathIcon className="w-5 h-5" /> Genereaza altele
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
