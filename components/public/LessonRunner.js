'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  BookOpenIcon, PuzzlePieceIcon, ClockIcon, LightBulbIcon,
  PaperAirplaneIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon,
  ChevronLeftIcon, ChevronRightIcon, TrophyIcon, RocketLaunchIcon,
  AcademicCapIcon, SparklesIcon, HomeIcon, Bars3Icon, XMarkIcon, LockClosedIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid, StarIcon } from '@heroicons/react/24/solid'
import dynamic from 'next/dynamic'
import { getMaxAttempts, gradeForAttempt, applyHintPenalty } from '@/lib/problem-scoring'
import Markdown, { inlineFmt, reformatCode } from '@/lib/markdown'
// Heavy sub-components: lazy-loaded so they don't block initial JS parse
const CodeRunner = dynamic(() => import('@/components/learn/CodeRunner'), { ssr: false })
const AiFeedback = dynamic(() => import('@/components/learn/AiFeedback'), { ssr: false })
const AiChat = dynamic(() => import('@/components/learn/AiChat'), { ssr: false })
const AiGradingLoader = dynamic(() => import('@/components/learn/AiGradingLoader'), { ssr: false })

const DIFF_COLOR = {
  EASY: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-rose-100 text-rose-700',
}
const DIFF_LABEL = { EASY: 'Usor', MEDIUM: 'Mediu', HARD: 'Greu' }

function CooldownBanner({ until, onExpire }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, until.getTime() - Date.now()))
  useEffect(() => {
    const iv = setInterval(() => {
      const ms = Math.max(0, until.getTime() - Date.now())
      setRemaining(ms)
      if (ms === 0) { clearInterval(iv); onExpire() }
    }, 1000)
    return () => clearInterval(iv)
  }, [until, onExpire])
  const totalSec = Math.ceil(remaining / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const fmt = h > 0
    ? `${h}h ${m.toString().padStart(2, '0')}min ${s.toString().padStart(2, '0')}s`
    : m > 0
    ? `${m}min ${s.toString().padStart(2, '0')}s`
    : `${s}s`
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-800 text-sm font-semibold">
      <ClockIcon className="w-5 h-5 shrink-0 text-amber-500" />
      <span>Cooldown activ — poți trimite din nou peste <span className="font-mono text-amber-900">{fmt}</span></span>
    </div>
  )
}

function renderTheory(text) {
  if (!text) return null
  // Normalizează blocurile de cod
  const normalized = text
    // 1. Mută ``` mid-linie pe un rând nou
    .replace(/([^\n`])([ \t]*```)/g, '$1\n$2')
    // 2. Mută textul de după ``` de închidere pe un rând nou
    .replace(/^([ \t]*```)([^`\w\n][^\n]*)/gm, '$1\n$2')
    // 3. Elimină spații la începutul liniilor cu ```
    .replace(/^[ \t]+(```)/gm, '$1')
  const lines = normalized.split('\n')
  const out = []
  let inCode = false; let codeBuf = []; let codeLang = ''
  let listBuf = []; let listOrdered = false

  const flushList = (key) => {
    if (listBuf.length === 0) return
    const Tag = listOrdered ? 'ol' : 'ul'
    const cls = listOrdered
      ? 'list-decimal list-inside space-y-1 my-3 text-slate-700'
      : 'list-disc list-inside space-y-1 my-3 text-slate-700'
    out.push(
      <Tag key={`l${key}`} className={cls}>
        {listBuf.map((item, j) => (
          <li key={j} dangerouslySetInnerHTML={{ __html: inlineFmt(item) }} />
        ))}
      </Tag>
    )
    listBuf = []
  }

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    if (ln.startsWith('```')) {
      flushList(i)
      if (inCode) {
        const codeText = reformatCode(codeBuf.join('\n'), codeLang)
        out.push(
          <div key={`c${i}`} className="my-4 rounded-xl bg-slate-900 shadow-inner overflow-hidden">
            {codeLang && (
              <div className="px-4 py-1.5 border-b border-slate-700 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{codeLang}</span>
              </div>
            )}
            <pre className="text-slate-100 p-4 overflow-x-auto text-sm font-mono whitespace-pre">{codeText}</pre>
          </div>
        )
        codeBuf = []; codeLang = ''; inCode = false
      } else {
        inCode = true
        const rest = ln.slice(3)
        // Detectează cod inline pe linia de deschidere: ```python cod_aici
        const inlineMatch = rest.match(/^(\w*)\s+(.+)$/)
        codeLang = inlineMatch ? inlineMatch[1] : rest.trim()
        if (inlineMatch) {
          codeBuf.push(inlineMatch[2].trim())
        }
      }
      continue
    }
    if (inCode) { codeBuf.push(ln); continue }

    // YouTube embed: @[youtube](URL_or_ID)
    const yt = ln.match(/^@\[youtube\]\(([^)]+)\)\s*$/i)
    if (yt) {
      flushList(i)
      const raw = yt[1].trim()
      let id = raw
      const m1 = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
      if (m1) id = m1[1]
      out.push(
        <div key={i} className="aspect-video my-4 rounded-xl overflow-hidden bg-black shadow">
          <iframe src={`https://www.youtube.com/embed/${id}`} className="w-full h-full" allowFullScreen />
        </div>
      )
      continue
    }

    // Image as standalone line: ![alt](url)
    const imgMatch = ln.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
    if (imgMatch) {
      flushList(i)
      out.push(<img key={i} src={imgMatch[2]} alt={imgMatch[1]} className="my-4 rounded-xl max-w-full h-auto shadow" />)
      continue
    }

    // Callout / blockquote: > text  (multi-linie)
    if (ln.startsWith('> ')) {
      flushList(i)
      const buf = [ln.slice(2)]
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) {
        buf.push(lines[++i].slice(2))
      }
      out.push(
        <div key={i} className="my-3 border-l-4 border-amber-400 bg-amber-50 px-4 py-3 rounded-r-xl">
          {buf.map((b, k) => (
            <p key={k} className="text-amber-900 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFmt(b) }} />
          ))}
        </div>
      )
      continue
    }

    // <details>/<summary> block — spoiler / răspuns ascuns
    if (ln.match(/^<details/i)) {
      flushList(i)
      const buf = [ln]
      while (i + 1 < lines.length && !lines[i].match(/<\/details>/i)) {
        buf.push(lines[++i])
      }
      const block = buf.join('\n')
      const summaryMatch = block.match(/<summary>([\s\S]*?)<\/summary>/i)
      const summaryText = summaryMatch ? summaryMatch[1].trim() : 'Răspuns'
      const inner = block
        .replace(/<details[^>]*>/i, '')
        .replace(/<\/details>/i, '')
        .replace(/<summary>[\s\S]*?<\/summary>/i, '')
        .trim()
      const innerNodes = renderTheory(inner)
      out.push(
        <details key={i} className="my-3 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden group">
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer font-semibold text-sm text-slate-700 hover:bg-slate-100 transition list-none select-none">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black group-open:rotate-90 transition-transform">▶</span>
            <span dangerouslySetInnerHTML={{ __html: inlineFmt(summaryText) }} />
          </summary>
          <div className="px-4 pb-4 pt-2 border-t border-slate-200 space-y-2">
            {innerNodes}
          </div>
        </details>
      )
      continue
    }

    // List items
    const ulMatch = ln.match(/^[-*]\s+(.+)$/)
    const olMatch = ln.match(/^\d+\.\s+(.+)$/)
    if (ulMatch || olMatch) {
      const isOrdered = !!olMatch
      if (listBuf.length > 0 && isOrdered !== listOrdered) flushList(i)
      listOrdered = isOrdered
      listBuf.push((ulMatch || olMatch)[1])
      continue
    } else if (listBuf.length > 0) {
      flushList(i)
    }

    if (ln.startsWith('### ')) out.push(<h3 key={i} className="text-base font-semibold mt-4 mb-1 text-slate-800" dangerouslySetInnerHTML={{ __html: inlineFmt(ln.slice(4)) }} />)
    else if (ln.startsWith('## ')) out.push(<h2 key={i} className="text-xl font-bold mt-5 mb-2 text-slate-900" dangerouslySetInnerHTML={{ __html: inlineFmt(ln.slice(3)) }} />)
    else if (ln.startsWith('# ')) out.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-slate-900" dangerouslySetInnerHTML={{ __html: inlineFmt(ln.slice(2)) }} />)
    else if (ln.trim() === '') out.push(<div key={i} className="h-2" />)
    else {
      out.push(<p key={i} className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFmt(ln) }} />)
    }
  }
  flushList('end')
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

export default function LessonRunner({ token, lesson, problems, initialProgress, advanceGranted, moduleLessons = [], progressByLesson = {}, superStudent = false, grantedLessonIds = [], canUseAi = false, isGuest = false }) {
  // În mod GUEST: zero fetch-uri către server. Toate acțiunile sunt locale.
  // canUseAi forțat fals + token-urile pentru linkurile fraților sunt înlocuite cu prefixul guest.
  if (isGuest) canUseAi = false
  const dashboardHref = isGuest ? '/learn/guest' : `/learn/${token}`
  const lessonHrefBase = isGuest ? '/learn/guest/lesson' : `/learn/${token}/lesson`
  const router = useRouter()
  const searchParams = useSearchParams()
  const grantedLessonSet = new Set(grantedLessonIds)
  const [progress, setProgress] = useState(initialProgress || { theoryCompleted: false, currentProblemIndex: 0 })
  const [step, setStep] = useState(progress.theoryCompleted ? 'problems' : 'theory')
  // Dacă vine ?problemId=... din notificare, pornim direct la problema respectivă
  const initialIdx = (() => {
    const targetPid = searchParams?.get('problemId')
    if (targetPid) {
      const i = problems.findIndex(p => p.id === targetPid)
      if (i >= 0) return i
    }
    return progress.currentProblemIndex || 0
  })()
  const [idx, setIdx] = useState(initialIdx)
  const [submissions, setSubmissions] = useState(problems.map(p => p.submission))
  // Per-problem state, indexed by problem position
  const [attemptsCount, setAttemptsCount] = useState(problems.map(p => p.attemptsCount || 0))
  const [hintsUsed, setHintsUsed] = useState(problems.map(p => !!p.hintUsed))
  const [locks, setLocks] = useState(problems.map(p => !!p.locked))
  const [solutionViewed, setSolutionViewed] = useState(problems.map(p => !!p.solutionViewed))
  const [solutionData, setSolutionData] = useState({}) // { problemId: { correctAnswer, explanation } }
  const [answer, setAnswer] = useState('')
  const [code, setCode] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [hintLoading, setHintLoading] = useState(false)
  const [solutionLoading, setSolutionLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState(null) // Date when cooldown expires
  const [aiFeedback, setAiFeedback] = useState({}) // { problemId: { aiGrade, aiDetect, aiPenaltyApplied, usage } }
  const [savedCodes, setSavedCodes] = useState({}) // { problemId: code } — păstrează codul la schimbarea problemei
  const [lastOutput, setLastOutput] = useState('')
  const [chatOpen, setChatOpen] = useState({}) // { problemId: bool }
  const [time, setTime] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const startRef = useRef(Date.now())

  // Dacă a venit ?problemId=... și teoria e gata, sărim direct la lista de probleme
  useEffect(() => {
    const targetPid = searchParams?.get('problemId')
    if (targetPid && progress.theoryCompleted) {
      setStep('problems')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (step !== 'problems') return
    const t = setInterval(() => setTime(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [step, idx])

  useEffect(() => {
    setAnswer('')
    // Restaurează codul salvat pentru problema nouă (sau starterCode dacă nu există)
    const pid = problems[idx]?.id
    setCode(pid && savedCodes[pid] != null ? savedCodes[pid] : (problems[idx]?.starterCode || ''))
    setShowHint(false)
    startRef.current = Date.now(); setTime(0)
    setTransitioning(true)
    const t = setTimeout(() => setTransitioning(false), 120)
    return () => clearTimeout(t)
  }, [idx, problems])

  const cur = problems[idx]
  // Salvează codul curent în savedCodes la fiecare modificare
  useEffect(() => {
    if (cur?.id && cur.type === 'CODING') {
      setSavedCodes(prev => ({ ...prev, [cur.id]: code }))
    }
  }, [code, cur?.id])

  const curSub = submissions[idx]
  const curAttempts = attemptsCount[idx] || 0
  const curHintUsed = hintsUsed[idx]
  const curLocked = locks[idx]
  const curSolutionViewed = solutionViewed[idx]
  const curMaxAttempts = cur ? getMaxAttempts(cur) : 3
  // Probleme blocate cu notă mică — derivat din submissions+locks, persistent la reload
  const toRevisit = problems.map((_, i) => i).filter(i => locks[i] && (submissions[i]?.grade ?? 0) < 60)

  // O problemă e „terminată" dacă e rezolvată corect sau blocată cu notă ≥60
  const isProblemDone = (i) => {
    const s = submissions[i]
    if (!s) return false
    if (locks[i] && (s.grade ?? 0) < 60) return false // blocat+eșuat → trebuie reluat
    if (locks[i]) return true
    if (s.status === 'GRADED' && (s.grade ?? 0) >= 60) return true
    return false
  }
  // O problemă „are greșeli nereparate" — submisie există, e GRADED dar incorectă, neblocată
  const needsRetry = (i) => {
    const s = submissions[i]
    if (!s) return false
    if (locks[i]) return false
    if (s.status === 'GRADED' && (s.grade ?? 0) < 60) return true
    return false
  }
  const allDone = problems.every((_, i) => isProblemDone(i))
  const doneCount = problems.filter((_, i) => isProblemDone(i)).length
  const wrongCount = problems.filter((_, i) => needsRetry(i)).length
  const revisionCount = problems.filter((_, i) => submissions[i]?.status === 'NEEDS_REVISION').length
  const lessonPct = problems.length > 0 ? Math.round((doneCount / problems.length) * 100) : 0

  const completeTheory = async () => {
    if (isGuest) {
      setProgress({ ...progress, theoryCompleted: true })
      setStep('problems')
      return
    }
    await fetch(`/api/public/learn/${token}/lesson/${lesson.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theoryCompleted: true }),
    })
    setProgress({ ...progress, theoryCompleted: true })
    setStep('problems')
  }

  const useHint = async () => {
    if (!cur?.hint || curHintUsed || curLocked) return
    if (isGuest) {
      const nh = [...hintsUsed]; nh[idx] = true; setHintsUsed(nh)
      setShowHint(true)
      toast('Hint afișat (mod demo)', { icon: '💡' })
      return
    }
    setHintLoading(true)
    try {
      const r = await fetch(`/api/public/learn/${token}/hint`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: cur.id, lessonId: lesson.id }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Eroare')
      const nh = [...hintsUsed]; nh[idx] = true; setHintsUsed(nh)
      setShowHint(true)
      toast(`Hint folosit — −${Math.round((cur.points ?? 10) * 10 / 100)} XP din scorul final`, { icon: '💡' })
    } catch (e) { toast.error(e.message) } finally { setHintLoading(false) }
  }

  const viewSolution = async () => {
    if (curLocked) {
      // arată soluția fără call API dacă e deja în solutionData
      if (solutionData[cur.id]) return
    }
    if (!confirm('Apăsând „Vezi rezolvarea" pierzi toate punctele pentru această problemă (0p) și nu o mai poți reîncerca decât resetând lecția. Continui?')) return
    if (isGuest) {
      // În mod demo soluția e luată direct din props
      setSolutionData(prev => ({ ...prev, [cur.id]: { correctAnswer: cur.correctAnswer, explanation: cur.explanation } }))
      const nl = [...locks]; nl[idx] = true; setLocks(nl)
      const nv = [...solutionViewed]; nv[idx] = true; setSolutionViewed(nv)
      const next = [...submissions]
      next[idx] = { ...(next[idx] || {}), status: 'GRADED', grade: 0, autoCorrect: false, locked: true, solutionViewed: true }
      setSubmissions(next)
      toast('Rezolvarea e afișată', { icon: '📖' })
      return
    }
    setSolutionLoading(true)
    try {
      const r = await fetch(`/api/public/learn/${token}/solution`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: cur.id, lessonId: lesson.id }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Eroare')
      setSolutionData(prev => ({ ...prev, [cur.id]: { correctAnswer: d.correctAnswer, explanation: d.explanation } }))
      const nl = [...locks]; nl[idx] = true; setLocks(nl)
      const nv = [...solutionViewed]; nv[idx] = true; setSolutionViewed(nv)
      // marchează submission cu status GRADED 0p
      const next = [...submissions]
      next[idx] = { ...(next[idx] || {}), status: 'GRADED', grade: 0, autoCorrect: false, locked: true, solutionViewed: true }
      setSubmissions(next)
      toast('Rezolvarea e afișată', { icon: '📖' })
    } catch (e) { toast.error(e.message) } finally { setSolutionLoading(false) }
  }

  const resetLesson = async () => {
    if (!confirm('Resetezi lecția? Toate răspunsurile, hint-urile și progresul problemelor vor fi șterse. Vei putea reîncepe de la zero pentru punctaj maxim.')) return
    if (isGuest) {
      setSubmissions(problems.map(() => null))
      setAttemptsCount(problems.map(() => 0))
      setHintsUsed(problems.map(() => false))
      setLocks(problems.map(() => false))
      setSolutionViewed(problems.map(() => false))
      setSolutionData({})
      setAnswer(''); setCode(problems[0]?.starterCode || '')
      setIdx(0); setStep('theory')
      setProgress({ theoryCompleted: false, currentProblemIndex: 0 })
      toast.success('Lecția a fost resetată (mod demo)')
      return
    }
    setResetting(true)
    try {
      const r = await fetch(`/api/public/learn/${token}/lesson/${lesson.id}/reset`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Eroare')
      toast.success('Lecția a fost resetată')
      router.refresh()
    } catch (e) { toast.error(e.message); setResetting(false) }
  }

  const [resettingProblem, setResettingProblem] = useState(false)
  const resetProblem = async (problemId) => {
    if (isGuest) {
      const next = [...submissions]; next[idx] = null; setSubmissions(next)
      const na = [...attemptsCount]; na[idx] = 0; setAttemptsCount(na)
      const nl = [...locks]; nl[idx] = false; setLocks(nl)
      const nv = [...solutionViewed]; nv[idx] = false; setSolutionViewed(nv)
      setAnswer(''); setCode(cur?.starterCode || '')
      setSolutionData(prev => { const c = { ...prev }; delete c[problemId]; return c })
      toast.success('Problema a fost resetată (mod demo)')
      return
    }
    setResettingProblem(true)
    try {
      const r = await fetch(`/api/public/learn/${token}/lesson/${lesson.id}/reset-problem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Eroare')
      // Reset local state pentru problema curentă
      const next = [...submissions]; next[idx] = null; setSubmissions(next)
      const na = [...attemptsCount]; na[idx] = 0; setAttemptsCount(na)
      const nl = [...locks]; nl[idx] = false; setLocks(nl)
      const nv = [...solutionViewed]; nv[idx] = false; setSolutionViewed(nv)
      setAnswer(''); setCode(cur?.starterCode || '')
      setAiFeedback(prev => { const c = { ...prev }; delete c[problemId]; return c })
      setSolutionData(prev => { const c = { ...prev }; delete c[problemId]; return c })
      toast.success('Problema a fost resetată — poți reîncerca!')
    } catch (e) { toast.error(e.message) } finally { setResettingProblem(false) }
  }

  const submit = async () => {
    if (curLocked) return toast.error('Problemă blocată — apasă „Reîncearcă problema” pentru a încerca din nou')
    if (cur.type === 'CODING' || cur.type === 'INPUT_OUTPUT') {
      if (!code.trim() && !answer.trim()) return toast.error('Introdu un raspuns')
    } else if (!answer.trim()) return toast.error('Introdu un raspuns')

    // ===== MOD GUEST: notare 100% client-side, ZERO request către server =====
    if (isGuest) {
      setSubmitting(true)
      const norm = (s) => String(s ?? '').trim().toLowerCase()
      let correct = false
      if (cur.type === 'MULTIPLE_CHOICE' || cur.type === 'SHORT_ANSWER') {
        correct = norm(answer) === norm(cur.correctAnswer)
      } else if (cur.type === 'INPUT_OUTPUT') {
        const target = cur.correctAnswer || ''
        correct = norm(answer || lastOutput) === norm(target)
      } else if (cur.type === 'CODING') {
        // Fără AI în mod guest — compară outputul cu correctAnswer dacă există
        if (cur.correctAnswer) {
          correct = norm(lastOutput) === norm(cur.correctAnswer)
        } else {
          // Nu avem cu ce să comparăm — acceptăm dacă codul a rulat fără erori
          correct = !!lastOutput && !/error|traceback|exception/i.test(lastOutput)
        }
      }
      const grade = correct ? 100 : 0
      const newAttempts = (attemptsCount[idx] || 0) + 1
      const exhausted = !correct && newAttempts >= curMaxAttempts
      const fakeSub = {
        problemId: cur.id,
        status: 'GRADED',
        grade,
        autoCorrect: correct,
        locked: correct || exhausted,
        answer: answer || null,
        code: code || null,
      }
      const next = [...submissions]; next[idx] = fakeSub; setSubmissions(next)
      const na = [...attemptsCount]; na[idx] = newAttempts; setAttemptsCount(na)
      if (correct || exhausted) {
        const nl = [...locks]; nl[idx] = true; setLocks(nl)
      }
      if (correct) {
        toast.success(`Corect! +${cur.points ?? 10} XP (mod demo)`)
      } else if (exhausted) {
        toast.error('Greșit — încercări epuizate. Resetează problema pentru a reîncerca.')
      } else {
        toast.error(`Răspuns greșit. Mai ai ${curMaxAttempts - newAttempts} încercări.`)
      }
      setSubmitting(false)
      return
    }
    // ===== END MOD GUEST =====

    // Pentru CODING — trimite la AI grader (Mr. PyWeb) doar dacă elevul are acces AI
    if (cur.type === 'CODING' && canUseAi) {
      if (!code.trim()) return toast.error('Scrie cod înainte de trimitere')
      setSubmitting(true)
      try {
        const r = await fetch(`/api/public/learn/${token}/ai-grade`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId: cur.id, lessonId: lesson.id, source: 'lesson', code, output: lastOutput }),
        })
        const d = await r.json()
        if (!r.ok) {
          if (r.status === 429 && d.cooldown) {
            const h = Math.floor(d.remainingMin / 60); const m = d.remainingMin % 60
            toast(`Așteaptă ${h ? h + 'h ' : ''}${m}min până la următoarea problemă`, { duration: 5000, icon: <ClockIcon className="w-5 h-5 text-amber-500" /> })
            setCooldownUntil(new Date(Date.now() + d.remainingMs))
          } else if (r.status === 429) toast.error(d.error || 'Limită AI atinsă')
          else throw new Error(d.error || 'Eroare AI')
          return
        }
        const next = [...submissions]; next[idx] = d.submission; setSubmissions(next)
        const na = [...attemptsCount]; na[idx] = (na[idx] || 0) + 1; setAttemptsCount(na)
        const nl = [...locks]; nl[idx] = !!d.submission.locked; setLocks(nl)
        setAiFeedback(prev => ({ ...prev, [cur.id]: d }))
        const finalGrade = (d.aiGrade?.finalGrade ?? d.aiGrade?.grade ?? 0)
        const passed = finalGrade >= 60
        const earnedXP = Math.round((cur.points ?? 10) * finalGrade / 100)
        if (passed) toast.success(`Mr. PyWeb spune: bravo! +${earnedXP} XP 🌟`)
        // detectare AI dezactivată — nu mai afișăm toast de plagiat
        else if (earnedXP > 0) toast(`Parțial corect: +${earnedXP} XP. Vezi feedback-ul AI.`, { icon: '✨' })
        else toast('Mr. PyWeb ți-a lăsat feedback', { icon: '✨' })
        // Dacă problema e acum blocată cu notă mică → adaugă la toRevisit și avansează automat
        if (d.submission.locked && finalGrade < 60) {
          const capturedIdx = idx
          toast('Încercări epuizate — continuăm și revenim la această problemă la final', { icon: '🔁', duration: 4000 })
          const nextUnlocked = problems.findIndex((_, i) => i > capturedIdx && !nl[i])
          if (nextUnlocked !== -1) {
            setTimeout(() => setIdx(nextUnlocked), 3500)
          }
        }
      } catch (e) { toast.error(e.message) } finally { setSubmitting(false) }
      return
    }

    setSubmitting(true)
    try {
      const r = await fetch(`/api/public/learn/${token}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: cur.id, lessonId: lesson.id, source: 'lesson', answer: answer || null, code: code || null, timeSpent: time }),
      })
      const d = await r.json()
      if (!r.ok) {
        if (r.status === 429 && d.cooldown) {
          const h = Math.floor(d.remainingMin / 60); const m = d.remainingMin % 60
          toast(`Așteaptă ${h ? h + 'h ' : ''}${m}min până la următoarea problemă`, { duration: 5000, icon: <ClockIcon className="w-5 h-5 text-amber-500" /> })
          setCooldownUntil(new Date(Date.now() + d.remainingMs))
          setSubmitting(false)
          return
        }
        throw new Error(d.error || 'Eroare')
      }
      const next = [...submissions]; next[idx] = d.submission; setSubmissions(next)
      const na = [...attemptsCount]; na[idx] = (na[idx] || 0) + 1; setAttemptsCount(na)
      if (d.locked) {
        const nl = [...locks]; nl[idx] = true; setLocks(nl)
      }
      if (d.autoCorrect === true) {
        const earnedXP = Math.round((cur.points ?? 10) * (d.submission.grade / 100))
        toast.success(`Corect! +${earnedXP} XP`)
      } else if (d.locked) {
        toast.error(`Greșit — încercări epuizate. 0 XP.`)
        const capturedIdx = idx
        toast('Încercări epuizate — continuăm și revenim la această problemă la final', { icon: '🔁', duration: 4000 })
        const currentLocks = [...locks]; currentLocks[capturedIdx] = true
        const nextUnlocked = problems.findIndex((_, i) => i > capturedIdx && !currentLocks[i])
        if (nextUnlocked !== -1) {
          setTimeout(() => setIdx(nextUnlocked), 3500)
        }
      } else {
        const nextGrade = applyHintPenalty(gradeForAttempt(cur, d.attemptNumber + 1), curHintUsed || d.hintUsed)
        const nextXP = Math.round((cur.points ?? 10) * (nextGrade / 100))
        toast.error(`Greșit. Următoarea încercare valorează maxim ${nextXP} XP.`)
      }
    } catch (e) { toast.error(e.message) } finally { setSubmitting(false) }
  }

  // Deblochează și navighează la o problemă din toRevisit — apelabilă de oriunde
  const goToNextRevisit = async () => {
    const nextRevisit = toRevisit[0]
    if (nextRevisit === undefined) return
    const nl = [...locks]; nl[nextRevisit] = false; setLocks(nl)
    const ns = [...submissions]; ns[nextRevisit] = null; setSubmissions(ns)
    const na = [...attemptsCount]; na[nextRevisit] = 0; setAttemptsCount(na)
    setAiFeedback(prev => { const c = { ...prev }; delete c[problems[nextRevisit]?.id]; return c })
    setIdx(nextRevisit)
    const remaining = toRevisit.length - 1
    toast(`Revenim la problema ${nextRevisit + 1}${remaining > 0 ? ` — mai ai ${remaining} de revizuit după` : ' — ultima de revizuit!'}`, { icon: '🔁', duration: 4000 })
    if (!isGuest) {
      try {
        const res = await fetch(`/api/public/learn/${token}/lesson/${lesson.id}/reset-problem`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId: problems[nextRevisit]?.id }),
        })
        if (!res.ok) {
          // Reset-problem refused (e.g. student viewed solution) — re-lock local state
          // so the submit guard works correctly and shows a clear message
          const rl = [...locks]; rl[nextRevisit] = true; setLocks(rl)
          const rs = [...submissions]; rs[nextRevisit] = ns[nextRevisit] ?? submissions[nextRevisit]; setSubmissions(rs)
          const data = await res.json().catch(() => ({}))
          toast.error(data.error || 'Problema nu poate fi resetată')
          return
        }
      } catch {
        // Network error — re-lock to stay consistent with server state
        const rl = [...locks]; rl[nextRevisit] = true; setLocks(rl)
        toast.error('Eroare la resetarea problemei. Încearcă din nou.')
        return
      }
      fetch(`/api/public/learn/${token}/lesson/${lesson.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentProblemIndex: nextRevisit }),
      }).catch(() => {})
    }
  }

  const nextProblem = () => {
    const ni = idx + 1
    if (ni < problems.length) {
      setIdx(ni)
      if (isGuest) return
      fetch(`/api/public/learn/${token}/lesson/${lesson.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentProblemIndex: ni }),
      }).catch(() => {})
      return
    }
    // Suntem la ultima — întâi verifică toRevisit
    if (toRevisit.length > 0) {
      goToNextRevisit()
      return
    }
    // Apoi verifică needsRetry (greșite neblocate)
    const firstWrong = problems.findIndex((_, i) => needsRetry(i))
    if (firstWrong !== -1) {
      setIdx(firstWrong)
      toast(`Reia problemele greșite (${wrongCount} ${wrongCount === 1 ? 'rămasă' : 'rămase'})`, { icon: '🔁' })
      if (isGuest) return
      fetch(`/api/public/learn/${token}/lesson/${lesson.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentProblemIndex: firstWrong }),
      }).catch(() => {})
    }
  }

  const finishLesson = async () => {
    setFinishing(true)
    if (isGuest) {
      toast.success('Bravo! Ai terminat lecția (mod demo). Înscrie-te ca să salvezi progresul!')
      setTimeout(() => router.push('/learn/guest'), 900)
      return
    }
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
        <Link href={dashboardHref}
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
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${step === 'theory' ? 'bg-white text-blue-800 shadow' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
            <BookOpenIcon className="w-3.5 h-3.5" /> Teorie
            {progress.theoryCompleted && <CheckSolid className="w-3 h-3 text-emerald-500" />}
          </button>
          <button onClick={() => { if (progress.theoryCompleted) { setStep('problems'); setMobileSidebarOpen(false) } }}
            disabled={!progress.theoryCompleted}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${step === 'problems' ? 'bg-white text-blue-800 shadow' : progress.theoryCompleted ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
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
              const isLocked = locks[i] && !isOk
              const isInRevisit = toRevisit.includes(i)
              const isWrong = !isOk && !isLocked && needsRetry(i)
              const isRev = s?.status === 'NEEDS_REVISION'
              const isPending = s && !isOk && !isRev && !isLocked && !isWrong && s.status === 'PENDING'
              const isActive = i === idx
              return (
                <button key={p.id} onClick={() => { setIdx(i); setMobileSidebarOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition ${isActive ? 'bg-white/20 ring-1 ring-white/40' : 'hover:bg-white/10'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isActive ? 'bg-white text-blue-800'
                    : isOk ? 'bg-emerald-500 text-white'
                    : isLocked ? 'bg-rose-600 text-white'
                    : isWrong ? 'bg-rose-500 text-white'
                    : isRev ? 'bg-rose-500 text-white'
                    : isPending ? 'bg-amber-500 text-white'
                    : 'bg-white/15 text-white/70'
                  }`}>
                    {isOk ? <CheckSolid className="w-3.5 h-3.5" /> : isLocked ? <LockClosedIcon className="w-3.5 h-3.5" /> : isWrong ? <ExclamationTriangleIcon className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/80 truncate font-medium">{p.title}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${DIFF_COLOR[p.difficulty]}`}>{DIFF_LABEL[p.difficulty]}</div>
                      {isInRevisit && <span className="text-[9px] text-amber-300 font-bold">🔁 revizuit</span>}
                    </div>
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
              const locked = !superStudent && !isCurrent && !done && !prevDone && !grantedLessonSet.has(l.id) && !l.isFree
              const inner = (
                <>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isCurrent ? 'bg-white text-blue-800'
                    : done ? 'bg-emerald-500 text-white'
                    : locked ? 'bg-white/5 text-white/20'
                    : started ? 'bg-blue-500 text-white'
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
                  href={`${lessonHrefBase}/${l.id}`}
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
        <div className="p-4 border-t border-white/10 space-y-2">
          {revisionCount > 0 && (
            <button onClick={() => { const i = problems.findIndex((_, i) => submissions[i]?.status === 'NEEDS_REVISION'); if (i !== -1) setIdx(i) }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-xl font-bold text-sm shadow transition">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Refă problema ({revisionCount} de refăcut)
            </button>
          )}
          <button onClick={finishLesson} disabled={finishing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-blue-900 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition disabled:opacity-60">
            <TrophyIcon className="w-5 h-5" />
            {finishing ? 'Se salveaza...' : revisionCount > 0 ? 'Finalizează oricum' : 'Finalizeaza lectia'}
          </button>
        </div>
      )}
      {/* Reset lecție — mereu vizibil jos în sidebar */}
      {step === 'problems' && !isGuest && (
        <div className="p-3 border-t border-white/10">
          <button onClick={resetLesson} disabled={resetting}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-white/40 hover:text-rose-300 hover:bg-white/5 rounded-lg transition">
            <ArrowPathIcon className="w-3.5 h-3.5" />
            {resetting ? 'Se resetează...' : 'Resetează lecția (0 de la capăt)'}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex bg-slate-100 overflow-hidden" style={{ height: '100vh', marginTop: 'calc(-1 * env(safe-area-inset-top))' }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white flex flex-col overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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
        <div className={`shrink-0 px-4 sm:px-6 pb-3 flex items-center gap-3 text-white shadow-sm bg-gradient-to-r from-blue-900 to-blue-700`} style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
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

        {/* Guest banner */}
        {isGuest && (
          <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 flex-wrap text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-amber-900">
              <SparklesIcon className="w-4 h-4 shrink-0" />
              <span><strong>Mod demo</strong> — progresul nu se salvează, AI și submisiile sunt dezactivate.</span>
            </div>
            <Link href="/inscriere" className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shrink-0">
              Înscrie-te gratuit <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">

            {/* THEORY */}
            {step === 'theory' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow">
                    <AcademicCapIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-blue-700 font-bold">Teorie</div>
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
            {step === 'problems' && cur && transitioning && (
              <div className="space-y-3 animate-pulse">
                <div className="bg-white rounded-xl shadow-sm h-12" />
                <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                  <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
                  <div className="h-4 bg-slate-100 rounded-lg w-full" />
                  <div className="h-4 bg-slate-100 rounded-lg w-5/6" />
                  <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
                  <div className="mt-4 h-28 bg-slate-100 rounded-xl" />
                  <div className="h-10 bg-slate-200 rounded-xl w-1/3 ml-auto" />
                </div>
              </div>
            )}

            {step === 'problems' && cur && !transitioning && (
              <div className="space-y-3">
                {/* Problem nav pills (mobile-friendly horizontal scroll) */}
                <div className="bg-white rounded-xl shadow-sm p-2 flex gap-1.5 overflow-x-auto">
                  {problems.map((p, i) => {
                    const s = submissions[i]
                    const isOk = s?.status === 'GRADED' && (s.grade ?? 0) >= 60
                    const isLocked = locks[i] && (s?.grade ?? 0) === 0
                    const isWrong = !isOk && !isLocked && needsRetry(i)
                    const isRev = s?.status === 'NEEDS_REVISION'
                    const isPending = s && !isOk && !isRev && !isLocked && !isWrong && s.status === 'PENDING'
                    const isRevisit = toRevisit.includes(i)
                    const cls = i === idx
                      ? 'bg-blue-800 text-white ring-2 ring-blue-300'
                      : isOk ? 'bg-emerald-100 text-emerald-700'
                      : isLocked ? 'bg-rose-200 text-rose-800'
                      : isRevisit ? 'bg-rose-200 text-rose-800'
                      : isWrong ? 'bg-rose-100 text-rose-700'
                      : isRev ? 'bg-rose-100 text-rose-700'
                      : isPending ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    return (
                      <button key={p.id} onClick={() => setIdx(i)}
                        className={`min-w-[38px] h-9 rounded-lg text-sm font-bold transition flex items-center justify-center ${cls}`}>
                        {isOk ? <CheckSolid className="w-4 h-4" /> : isLocked ? <LockClosedIcon className="w-3.5 h-3.5" /> : isRevisit ? <ArrowPathIcon className="w-3.5 h-3.5" /> : isWrong ? <ExclamationTriangleIcon className="w-3.5 h-3.5" /> : i + 1}
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
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${DIFF_COLOR[cur.difficulty]}`}>{DIFF_LABEL[cur.difficulty]}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">
                        <StarIcon className="w-3 h-3 text-amber-400" /> {cur.points} pct
                      </span>
                      {!curLocked && curAttempts > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                          Încercare {curAttempts + 1}/{curMaxAttempts}
                        </span>
                      )}
                      {curHintUsed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                          <LightBulbIcon className="w-3 h-3" /> Hint −{Math.round((cur.points ?? 10) * 10 / 100)} XP
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-4">
                    <Markdown text={cur.description} className="text-base text-slate-700 leading-relaxed" />

                    {/* Soluția — afișată dacă elevul a apăsat „Vezi rezolvarea" */}
                    {curSolutionViewed && solutionData[cur.id] && (
                      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-900 font-bold">
                          <EyeIcon className="w-5 h-5" /> Rezolvare
                        </div>
                        {solutionData[cur.id].correctAnswer && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-700 mb-1">Răspuns corect</div>
                            <code className="block bg-white px-3 py-2 rounded-lg text-sm font-mono text-slate-800 border border-indigo-100">{solutionData[cur.id].correctAnswer}</code>
                          </div>
                        )}
                        {solutionData[cur.id].explanation && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-700 mb-1">Explicație</div>
                            <Markdown text={solutionData[cur.id].explanation} compact className="text-sm text-slate-700" />
                          </div>
                        )}
                      </div>
                    )}

                    {curSub && curLocked ? (
                      <div className="space-y-3">
                        {/* Dacă avem feedback AI proaspăt → card Mr. PyWeb, altfel cardul clasic */}
                        {canUseAi && aiFeedback[cur.id] ? (
                          <AiFeedback
                            key={`${cur.id}-${curAttempts}`}
                            data={aiFeedback[cur.id]}
                            token={token}
                            onClose={() => setAiFeedback(prev => { const c = { ...prev }; delete c[cur.id]; return c })}
                          />
                        ) : (
                          <div className={`rounded-xl p-4 border-2 ${curSub.status === 'GRADED' && (curSub.grade ?? 0) >= 60 ? 'bg-emerald-50 border-emerald-200' : (curSub.grade ?? 0) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
                            <div className="flex items-center gap-2 font-bold flex-wrap">
                              {curSub.status === 'GRADED' && (curSub.grade ?? 0) >= 60 ? (
                                <><CheckCircleIcon className="w-5 h-5 text-emerald-600" /><span className="text-emerald-800">Rezolvat — bravo!</span></>
                              ) : curSolutionViewed ? (
                                <><EyeIcon className="w-5 h-5 text-rose-600" /><span className="text-rose-800">Rezolvare văzută — 0p</span></>
                              ) : (curSub.grade ?? 0) > 0 ? (
                                <><ExclamationTriangleIcon className="w-5 h-5 text-amber-600" /><span className="text-amber-800">Parțial corect — {Math.round((cur.points ?? 10) * (curSub.grade ?? 0) / 100)}p</span></>
                              ) : (
                                <><LockClosedIcon className="w-5 h-5 text-rose-600" /><span className="text-rose-800">Încercări epuizate — 0p</span></>
                              )}
                              {typeof curSub.grade === 'number' && (
                                <span className="ml-auto text-sm">Nota: <strong className="text-lg">{Math.round((cur.points ?? 10) * (curSub.grade ?? 0) / 100)}/{cur.points ?? 10}</strong> <span className="text-slate-400 text-xs">({curSub.grade}%)</span></span>
                              )}
                            </div>
                            {curSub.feedback && (
                              <div className="mt-3 p-3 bg-white/60 rounded-lg text-sm text-slate-800">
                                <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Feedback profesor</div>
                                <Markdown text={curSub.feedback} compact />
                              </div>
                            )}
                            {curSub.answer && (
                              <div className="mt-2 text-xs text-slate-500">
                                Răspunsul tău: <code className="bg-white px-1.5 py-0.5 rounded font-mono">{curSub.answer || (curSub.code ? '(cod)' : '(gol)')}</code>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Butoane acțiuni — în afara cardului AI/feedback */}
                        {(curSub.grade ?? 0) < 100 && (() => {
                          const nextUnlockedIdx = problems.findIndex((_, i) => i > idx && !locks[i] && !isProblemDone(i))
                          const nextRevisitIdx = toRevisit.find(i => i !== idx)
                          const nextToGo = nextUnlockedIdx !== -1 ? nextUnlockedIdx : -1
                          return (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {/* Finalizează lecția dacă totul e gata */}
                                {allDone && (
                                  <button onClick={finishLesson} disabled={finishing}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-blue-900 rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 shadow transition active:scale-95">
                                    <TrophyIcon className="w-4 h-4" /> {finishing ? 'Se salveaza...' : 'Finalizează lecția'}
                                  </button>
                                )}
                                {/* Mergi la urm problemă deblocată sau la urm din revisit */}
                                {!allDone && nextToGo !== -1 && (
                                  <button onClick={() => setIdx(nextToGo)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition active:scale-95">
                                    Continuă <ChevronRightIcon className="w-4 h-4" />
                                  </button>
                                )}
                                {/* Dacă nu mai sunt probleme deblocate dar sunt revisit-uri */}
                                {!allDone && nextToGo === -1 && nextRevisitIdx !== undefined && (
                                  <button onClick={goToNextRevisit}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition active:scale-95">
                                    <ArrowPathIcon className="w-4 h-4" /> Reia blocată ({toRevisit.length})
                                  </button>
                                )}
                                {/* Revin la final — badge informativ */}
                                {toRevisit.includes(idx) && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold">
                                    <ArrowPathIcon className="w-3.5 h-3.5 shrink-0" /> Programată pentru revizuit
                                  </span>
                                )}
                                {/* Vezi rezolvarea */}
                                {!curSolutionViewed && (curSub.grade ?? 0) < 60 && (
                                  <button onClick={viewSolution} disabled={solutionLoading}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-700 rounded-xl text-sm font-semibold disabled:opacity-60 transition">
                                    <EyeIcon className="w-4 h-4" /> {solutionLoading ? 'Se încarcă...' : 'Vezi rezolvarea (0p)'}
                                  </button>
                                )}
                              </div>
                              <div className="pt-1 flex items-center gap-3 flex-wrap">
                                <button onClick={resetLesson} disabled={resetting}
                                  className="text-xs text-slate-400 hover:text-rose-600 underline underline-offset-2 transition">
                                  {resetting ? 'Se resetează...' : 'Resetează lecția de la 0'}
                                </button>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    ) : curSub && curSub.status === 'PENDING' ? (
                      <div className="rounded-xl p-4 border-2 bg-amber-50 border-amber-200">
                        <div className="flex items-center gap-2 font-bold text-amber-800">
                          <ClockIcon className="w-5 h-5" /> În așteptarea profesorului
                        </div>
                        {curSub.code && (
                          <div className="mt-2 text-xs text-slate-600">
                            Cod trimis. Profesorul va nota lucrarea.
                          </div>
                        )}
                      </div>
                    ) : curSub && curSub.status === 'NEEDS_REVISION' ? (
                      <div className="rounded-xl p-4 border-2 bg-rose-50 border-rose-200">
                        <div className="flex items-center gap-2 font-bold text-rose-800 mb-2">
                          <ExclamationTriangleIcon className="w-5 h-5" /> Profesorul cere refacere
                        </div>
                        {curSub.feedback && (
                          <div className="mt-2 p-3 bg-white/60 rounded-lg text-sm text-slate-800">
                            <div className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Feedback profesor</div>
                            <Markdown text={curSub.feedback} compact />
                          </div>
                        )}
                        <button onClick={() => { const next = [...submissions]; next[idx] = null; setSubmissions(next) }}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700">
                          <ArrowPathIcon className="w-4 h-4" /> Refă problema
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Feedback de la încercarea anterioară greșită */}
                        {curAttempts > 0 && curSub && curSub.status === 'GRADED' && curSub.autoCorrect === false && !curLocked && (
                          <div className="rounded-xl p-3 bg-rose-50 border-2 border-rose-200 text-sm">
                            <div className="font-bold text-rose-800 flex items-center gap-2">
                              <ExclamationTriangleIcon className="w-4 h-4" /> Răspuns greșit la încercarea {curAttempts}
                            </div>
                            <div className="text-xs text-rose-700 mt-1">
                              Mai ai {curMaxAttempts - curAttempts} {curMaxAttempts - curAttempts === 1 ? 'încercare' : 'încercări'}. Următoarea valorează maxim {Math.round((cur.points ?? 10) * applyHintPenalty(gradeForAttempt(cur, curAttempts + 1), curHintUsed) / 100)} XP.
                            </div>
                          </div>
                        )}

                        {cur.type === 'MULTIPLE_CHOICE' && (
                          <div className="space-y-2">
                            {cur.options?.map((opt, i) => (
                              <label key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${answer === opt ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}>
                                <input type="radio" name="opt" checked={answer === opt} onChange={() => setAnswer(opt)} className="w-4 h-4 accent-blue-700" />
                                <span className="text-sm text-slate-800">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {cur.type === 'SHORT_ANSWER' && (
                          <input value={answer} onChange={e => setAnswer(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                            placeholder="Scrie raspunsul tau..." />
                        )}
                        {cur.type === 'INPUT_OUTPUT' && (
                          <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-mono text-sm focus:border-blue-600 outline-none"
                            placeholder="Output asteptat..." />
                        )}
                        {cur.type === 'CODING' && (
                          <div className="space-y-3">
                            <CodeRunner
                              code={code}
                              setCode={setCode}
                              language={cur.language || 'python'}
                              starter={cur.starterCode || ''}
                              rows={12}
                              onOutput={setLastOutput}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs text-slate-400 flex-1 min-w-[180px]">💡 Apasă „Rulează" ca să testezi codul. Apoi apasă „Trimite"{canUseAi ? ' — Mr. PyWeb te va nota cu AI.' : '.'}</p>
                              {canUseAi && !chatOpen[cur.id] && (
                                <button
                                  type="button"
                                  onClick={() => setChatOpen(s => ({ ...s, [cur.id]: true }))}
                                  className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition active:scale-95"
                                >
                                  <SparklesIcon className="w-5 h-5" />
                                  <span>Cere ajutor de la AI</span>
                                  <span className="px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-black rounded shadow-sm">AI</span>
                                  <span className="absolute inset-0 rounded-xl ring-2 ring-purple-400 ring-opacity-0 group-hover:ring-opacity-50 transition" />
                                </button>
                              )}
                            </div>
                            {!canUseAi && (
                              <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5 text-xs sm:text-sm">
                                <SparklesIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  {isGuest ? (
                                    <>
                                      <div className="font-bold text-amber-900">Mr. PyWeb (AI) — disponibil doar pentru elevi înscriși</div>
                                      <div className="text-amber-800 mt-0.5">
                                        În modul demo nu ai acces la corectarea AI. Codul tău se rulează local în browser și se compară cu rezultatul așteptat. <Link href="/inscriere" className="underline font-bold">Înscrie-te aici</Link> pentru notare instant cu AI.
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="font-bold text-amber-900">Mr. PyWeb (AI) e disponibil cu abonament</div>
                                      <div className="text-amber-800 mt-0.5">Cere profesorului să-ți activeze abonamentul pentru notare instant cu AI și ajutor cu indicii. Codul tău va fi trimis profesorului spre evaluare.</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                            {canUseAi && chatOpen[cur.id] && (
                              <AiChat
                                token={token}
                                problemId={cur.id}
                                lessonId={lesson.id}
                                getCode={() => code}
                                onClose={() => setChatOpen(s => ({ ...s, [cur.id]: false }))}
                              />
                            )}
                            {canUseAi && submitting && cur.type === 'CODING' && !aiFeedback[cur.id] && (
                              <AiGradingLoader />
                            )}
                            {canUseAi && aiFeedback[cur.id] && (
                              <>
                                <AiFeedback
                                  key={`${cur.id}-${curAttempts}`}
                                  data={aiFeedback[cur.id]}
                                  token={token}
                                  onClose={() => setAiFeedback(prev => { const c = { ...prev }; delete c[cur.id]; return c })}
                                />
                                <button
                                  onClick={() => setAiFeedback(prev => { const c = { ...prev }; delete c[cur.id]; return c })}
                                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-200 hover:border-blue-400 text-blue-700 hover:text-blue-900 rounded-xl font-semibold text-sm transition active:scale-95"
                                >
                                  <ArrowPathIcon className="w-4 h-4" /> Întoarce-te la cod
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Cooldown timer banner */}
                        {cooldownUntil && Date.now() < cooldownUntil.getTime() && (
                          <CooldownBanner until={cooldownUntil} onExpire={() => setCooldownUntil(null)} />
                        )}

                        <div className="flex flex-wrap gap-2 pt-1">
                          {cur.hint && curAttempts >= 1 && !curHintUsed && (
                            <button onClick={useHint} disabled={hintLoading}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-2 border-amber-400 text-amber-800 bg-amber-50 rounded-xl hover:bg-amber-100 font-semibold disabled:opacity-60 animate-pulse">
                              <LightBulbIcon className="w-4 h-4" /> {hintLoading ? '...' : `💡 Vezi indiciu (−${Math.round((cur.points ?? 10) * 10 / 100)} XP)`}
                            </button>
                          )}
                          {cur.hint && curHintUsed && (
                            <button onClick={() => setShowHint(!showHint)}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-2 border-amber-300 text-amber-700 rounded-xl hover:bg-amber-50 font-semibold">
                              <LightBulbIcon className="w-4 h-4" /> {showHint ? 'Ascunde hint' : 'Afișează hint'}
                            </button>
                          )}
                          {curAttempts >= 2 && cur.type !== 'CODING' && (
                            <button onClick={viewSolution} disabled={solutionLoading}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm border-2 border-indigo-300 text-indigo-700 rounded-xl hover:bg-indigo-50 font-semibold disabled:opacity-60">
                              <EyeIcon className="w-4 h-4" /> {solutionLoading ? '...' : 'Vezi rezolvarea (0p)'}
                            </button>
                          )}
                          <button onClick={submit} disabled={submitting}
                            className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-800 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg active:scale-95 transition disabled:opacity-50 shadow text-sm">
                            <PaperAirplaneIcon className="w-4 h-4" />
                            {submitting ? 'Se trimite...' : 'Trimite raspunsul'}
                          </button>
                        </div>
                        {showHint && cur.hint && curHintUsed && (
                          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex gap-2">
                            <LightBulbIcon className="w-5 h-5 shrink-0 mt-0.5" />
                            <Markdown text={cur.hint} compact className="flex-1" />
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
                      {allDone ? (
                        <div className="flex flex-wrap gap-2 justify-end">
                          {revisionCount > 0 && (
                            <button onClick={() => { const i = problems.findIndex((_, i) => submissions[i]?.status === 'NEEDS_REVISION'); if (i !== -1) setIdx(i) }}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-xl text-sm font-bold shadow transition active:scale-95">
                              <ExclamationTriangleIcon className="w-4 h-4" /> Refă problema ({revisionCount})
                            </button>
                          )}
                          <button onClick={finishLesson} disabled={finishing}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-blue-900 rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 shadow">
                            <TrophyIcon className="w-5 h-5" />
                            {finishing ? 'Se salveaza...' : revisionCount > 0 ? 'Finalizează oricum' : 'Finalizeaza lectia'}
                          </button>
                        </div>
                      ) : idx < problems.length - 1 ? (
                        <button onClick={nextProblem}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
                          Urmatoarea <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      ) : wrongCount > 0 ? (
                        <button onClick={nextProblem}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700">
                          Reia greșite ({wrongCount}) <ArrowPathIcon className="w-4 h-4" />
                        </button>
                      ) : toRevisit.length > 0 ? (
                        <button onClick={goToNextRevisit}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700">
                          <ArrowPathIcon className="w-4 h-4" /> Reia blocate ({toRevisit.length})
                        </button>
                      ) : revisionCount > 0 ? (
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button onClick={() => { const i = problems.findIndex((_, i) => submissions[i]?.status === 'NEEDS_REVISION'); if (i !== -1) setIdx(i) }}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-xl text-sm font-bold shadow transition active:scale-95">
                            <ExclamationTriangleIcon className="w-4 h-4" /> Refă problema ({revisionCount})
                          </button>
                          <button onClick={finishLesson} disabled={finishing}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-blue-900 rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 shadow">
                            <TrophyIcon className="w-5 h-5" />
                            {finishing ? 'Se salveaza...' : 'Finalizează oricum'}
                          </button>
                        </div>
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
                          <Link href={dashboardHref} className="underline font-semibold">Inapoi la module</Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <SparklesIcon className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                          <div className="font-bold mb-0.5">Bravo ca ai terminat!</div>
                          Pentru modulul urmator ai nevoie de aprobarea profesorului. Pana atunci incearca{' '}
                          {isGuest ? (
                            <Link href="/inscriere" className="underline font-semibold">înscrie-te ca să salvezi progresul</Link>
                          ) : (
                            <Link href={`/learn/${token}/random`} className="underline font-semibold">probleme aleatorii</Link>
                          )}.
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
