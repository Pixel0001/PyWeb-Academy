'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ChevronLeftIcon, FireIcon, AdjustmentsHorizontalIcon, ArrowPathIcon,
  PaperAirplaneIcon, CheckCircleIcon, ClockIcon, LightBulbIcon,
  PuzzlePieceIcon, SparklesIcon, BoltIcon, ChevronUpIcon, ChevronDownIcon,
  XMarkIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid, StarIcon } from '@heroicons/react/24/solid'

const DIFF_CONFIG = {
  EASY:   { label: 'Ușor',    bar: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700', active: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' },
  MEDIUM: { label: 'Mediu',   bar: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700',    active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' },
  HARD:   { label: 'Greu',    bar: 'bg-rose-400',    badge: 'bg-rose-100 text-rose-700',      active: 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' },
  RANDOM: { label: 'Aleator', bar: 'bg-violet-400',  badge: 'bg-violet-100 text-violet-700',  active: 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' },
}

const LANG_ICONS = {
  python: { emoji: '🐍', color: 'from-yellow-400 to-amber-500' },
  javascript: { emoji: '⚡', color: 'from-yellow-300 to-yellow-500' },
  html: { emoji: '🌐', color: 'from-orange-400 to-red-500' },
  css: { emoji: '🎨', color: 'from-blue-400 to-indigo-500' },
}

function CountPicker({ value, onChange }) {
  const min = 1, max = 15
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-white/40 font-bold">1</span>
        <span className="text-lg font-extrabold text-white tabular-nums">{value}</span>
        <span className="text-[10px] text-white/40 font-bold">15</span>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-white/15" />
        {/* Filled track */}
        <div
          className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 pointer-events-none"
          style={{ width: `${pct}%` }}
        />
        {/* Native input invisible but functional */}
        <input
          type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-x-0 w-full opacity-0 h-6 cursor-pointer z-10"
        />
        {/* Custom thumb */}
        <div
          className="absolute w-5 h-5 rounded-full bg-white shadow-lg shadow-orange-500/40 border-2 border-orange-400 pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - ${pct * 0.4}px - 2px)` }}
        />
      </div>
    </div>
  )
}

export default function RandomProblemsRunner({ token, student, modules = [] }) {
  const [difficulty, setDifficulty] = useState('RANDOM')
  const [moduleId, setModuleId]     = useState('')
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
      if (moduleId) p.set('moduleId', moduleId)
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
    if (!ans) return toast.error('Introdu un răspuns')
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
        toast.error('Greșit — încearcă altă problemă')
      }
    } catch (e) { toast.error(e.message) }
  }

  const doneCount = problems.filter(p => submissions[p.id]).length
  const selectedModule = modules.find(m => m.id === moduleId)
  const langCfg = selectedModule ? LANG_ICONS[selectedModule.language?.toLowerCase()] : null

  const FilterPanel = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <Link href={`/learn/${token}`}
          className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition shrink-0">
          <ChevronLeftIcon className="w-4 h-4" />
        </Link>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-wider mb-0.5">
            <FireIcon className="w-3 h-3 text-yellow-300" /> Antrenament
          </div>
          <h1 className="text-base font-extrabold text-white leading-none">Probleme aleatorii</h1>
        </div>
        <button className="ml-auto lg:hidden w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition"
          onClick={() => setMobileSidebarOpen(false)}>
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* AI suggestion */}
        {suggestion && suggestion.next !== suggestion.currentDifficulty && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-3">
            <div className="flex items-start gap-2">
              <SparklesIcon className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-300 mb-0.5">Sugestie AI</div>
                <div className="text-xs text-white/80">{suggestion.reason}</div>
              </div>
            </div>
          </div>
        )}

        {/* Module picker */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">
            Modul
          </label>
          {/* All modules pill */}
          <button onClick={() => setModuleId('')}
            className={`w-full mb-2 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              !moduleId ? 'bg-white text-slate-800 shadow-md' : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}>
            <span className="text-base">🎯</span>
            <span>Toate modulele</span>
          </button>
          <div className="grid grid-cols-2 gap-1.5">
            {modules.map(m => {
              const lang = m.language?.toLowerCase()
              const cfg = LANG_ICONS[lang] || { emoji: '📚', color: 'from-slate-400 to-slate-500' }
              const active = moduleId === m.id
              return (
                <button key={m.id} onClick={() => setModuleId(active ? '' : m.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    active
                      ? `bg-gradient-to-br ${cfg.color} text-white shadow-lg`
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}>
                  <span className="text-sm">{cfg.emoji}</span>
                  <span className="truncate">{m.title.replace(' Fundamentals', '').replace(' Basics', '')}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">
            Dificultate
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {['RANDOM', 'EASY', 'MEDIUM', 'HARD'].map(d => {
              const cfg = DIFF_CONFIG[d]
              const active = difficulty === d
              return (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    active ? cfg.active : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.bar}`} />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Count — modern buttons, no broken range */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">
            Număr probleme
          </label>
          <CountPicker value={count} onChange={setCount} />
        </div>

        {/* Generate */}
        <button onClick={fetchProblems} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-blue-900 rounded-2xl font-extrabold text-sm transition disabled:opacity-60 shadow-xl shadow-amber-500/30 active:scale-95">
          {loading
            ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Se încarcă...</>
            : <><BoltIcon className="w-4 h-4" /> Generează {count} probleme</>
          }
        </button>

        {/* Progress */}
        {problems.length > 0 && (
          <div className="bg-white/10 rounded-2xl p-3">
            <div className="flex justify-between text-[10px] text-white/50 mb-2 font-bold uppercase tracking-wider">
              <span>Progres sesiune</span>
              <span className="text-white font-extrabold">{doneCount}/{problems.length}</span>
            </div>
            <div className="h-2 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.round(doneCount / problems.length * 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-white/30 mt-1">
              <span>0%</span>
              <span>{Math.round(doneCount / problems.length * 100)}%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Problem nav */}
        {problems.length > 0 && (
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-2">Probleme</p>
            <div className="space-y-1">
              {problems.map((p, i) => {
                const sub = submissions[p.id]
                const isOk = sub?.status === 'GRADED' && (sub.grade ?? 0) >= 60
                const isPending = sub && !isOk
                const cfg = DIFF_CONFIG[p.difficulty] || DIFF_CONFIG.EASY
                return (
                  <a key={p.id} href={`#problem-${p.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 transition">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isOk ? 'bg-emerald-500 text-white'
                      : isPending ? 'bg-amber-500 text-white'
                      : 'bg-white/15 text-white/70'
                    }`}>
                      {isOk ? <CheckSolid className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/70 truncate">{p.title}</div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
        <FilterPanel />
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white flex flex-col overflow-y-auto">
            <FilterPanel />
          </div>
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="shrink-0 px-4 sm:px-6 py-3 flex items-center gap-3 bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-sm">
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-1.5 bg-white/15 hover:bg-white/25 rounded-xl transition">
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center hidden lg:flex shrink-0">
            {langCfg
              ? <span className="text-base">{langCfg.emoji}</span>
              : <FireIcon className="w-4 h-4 text-yellow-300" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm">
              {selectedModule
                ? selectedModule.title
                : 'Probleme aleatorii'
              }
            </div>
            {problems.length > 0 && (
              <div className="text-white/50 text-xs">{doneCount}/{problems.length} rezolvate · {DIFF_CONFIG[difficulty]?.label}</div>
            )}
          </div>
          {problems.length > 0 && (
            <button onClick={fetchProblems} disabled={loading}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition active:scale-95 border border-white/10">
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Regenerează</span>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10 shrink-0">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
            style={{ width: `${problems.length > 0 ? Math.round(doneCount / problems.length * 100) : 0}%` }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30">
                <FireIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Gata de antrenament?</h2>
              <p className="text-slate-500 text-base max-w-sm mb-8">
                Alege modulul și dificultatea, sau lasă-le aleatoriu și apasă Generate.
              </p>

              {/* Quick module chips on empty state */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <button onClick={() => setModuleId('')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${!moduleId ? 'bg-blue-800 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                  🎯 Toate
                </button>
                {modules.map(m => {
                  const cfg = LANG_ICONS[m.language?.toLowerCase()] || { emoji: '📚' }
                  const active = moduleId === m.id
                  return (
                    <button key={m.id} onClick={() => setModuleId(active ? '' : m.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition ${active ? 'bg-blue-800 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                      {cfg.emoji} {m.title.replace(' Fundamentals', '').replace(' Basics', '')}
                    </button>
                  )
                })}
              </div>

              <button onClick={fetchProblems} disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-800 to-blue-700 text-white rounded-2xl font-extrabold text-lg shadow-xl shadow-blue-900/30 hover:-translate-y-0.5 hover:shadow-2xl transition disabled:opacity-60 active:scale-95">
                <BoltIcon className="w-6 h-6" />
                {loading ? 'Se încarcă...' : `Generează ${count} probleme`}
              </button>
              <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition">
                <AdjustmentsHorizontalIcon className="w-4 h-4" /> Mai multe filtre
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
              {problems.map((p, i) => {
                const sub = submissions[p.id]
                const isOk = sub?.status === 'GRADED' && (sub.grade ?? 0) >= 60
                const isPending = sub && !isOk
                const cfg = DIFF_CONFIG[p.difficulty] || DIFF_CONFIG.EASY
                const isExpanded = expanded[p.id] !== false

                return (
                  <div key={p.id} id={`problem-${p.id}`}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden ring-1 ${isOk ? 'ring-emerald-200' : isPending ? 'ring-amber-200' : 'ring-slate-200'}`}>

                    <div className={`h-1.5 bg-gradient-to-r ${isOk ? 'from-emerald-400 to-teal-400' : 'from-blue-700 to-blue-500'}`} />
                    <div className="px-5 py-4 flex items-center gap-3 cursor-pointer select-none"
                      onClick={() => setExpanded(e => ({ ...e, [p.id]: !isExpanded }))}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                        isOk ? 'bg-emerald-500 text-white' : isPending ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isOk ? <CheckSolid className="w-5 h-5" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900">{p.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <StarIcon className="w-3 h-3 text-amber-400" /> {p.points} pct
                          {isOk && <span className="text-emerald-600 font-semibold">· Rezolvat ✓</span>}
                          {isPending && p.type === 'CODING' && <span className="text-amber-600 font-semibold">· La profesor</span>}                                  {!isOk && !isPending && sub?.autoCorrect === false && <span className="text-rose-600 font-semibold">· Greșit — 0 pct</span>}                        </div>
                      </div>
                      {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400 shrink-0" />}
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{p.description}</p>

                        {sub ? (
                          <div className={`rounded-2xl p-4 border-2 ${isOk ? 'bg-emerald-50 border-emerald-200' : sub.autoCorrect === false ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center gap-2 font-bold text-sm">
                              {isOk
                                ? <><CheckCircleIcon className="w-5 h-5 text-emerald-600" /><span className="text-emerald-800">Răspuns corect — bravo!</span></>
                                : sub.autoCorrect === false
                                  ? <><ExclamationTriangleIcon className="w-5 h-5 text-rose-600" /><span className="text-rose-800">Răspuns greșit — 0 puncte</span></>
                                  : <><ClockIcon className="w-5 h-5 text-amber-600" /><span className="text-amber-800">Trimis profesorului</span></>
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
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${answers[p.id] === opt ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}>
                                    <input type="radio" name={`opt-${p.id}`} checked={answers[p.id] === opt}
                                      onChange={() => setAnswers(a => ({ ...a, [p.id]: opt }))}
                                      className="w-4 h-4 accent-indigo-500" />
                                    <span className="text-sm text-slate-800">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {p.type === 'CODING' && (
                              <textarea value={answers[p.id] ?? p.starterCode ?? ''}
                                onChange={e => setAnswers(a => ({ ...a, [p.id]: e.target.value }))} rows={8}
                                className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl font-mono text-sm bg-slate-900 text-slate-100 outline-none focus:border-blue-500 resize-y" />
                            )}
                            {(p.type === 'SHORT_ANSWER' || p.type === 'INPUT_OUTPUT') && (
                              <input value={answers[p.id] || ''}
                                onChange={e => setAnswers(a => ({ ...a, [p.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && submit(p)}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                placeholder="Răspunsul tău..." />
                            )}
                            {p.hint && (
                              <details className="group">
                                <summary className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-semibold cursor-pointer hover:text-amber-700 select-none">
                                  <LightBulbIcon className="w-4 h-4" /> Indiciu
                                </summary>
                                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">{p.hint}</div>
                              </details>
                            )}
                            <button onClick={() => submit(p)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-xl font-bold text-sm shadow hover:shadow-md active:scale-95 transition">
                              <PaperAirplaneIcon className="w-4 h-4" /> Trimite răspunsul
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {doneCount === problems.length && problems.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 p-6 text-center">
                  <CheckSolid className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-xl font-extrabold text-emerald-900 mb-1">Sesiune completă!</h3>
                  <p className="text-emerald-700 text-sm mb-4">Ai rezolvat toate {problems.length} problemele. Mai vrei?</p>
                  <button onClick={fetchProblems}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition">
                    <ArrowPathIcon className="w-5 h-5" /> Generează altele
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
