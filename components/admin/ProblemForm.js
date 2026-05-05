'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// ── Markdown preview helpers (aceleași ca în TheoryEditor) ───────────────────
function inlineFmt(s) {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="my-2 rounded-lg max-w-full h-auto shadow" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-indigo-600 underline">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-indigo-50 rounded text-sm font-mono text-indigo-700 font-medium">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

function renderMd(text) {
  if (!text || !text.trim()) return null
  const lines = text.split('\n')
  const elements = []
  let i = 0
  while (i < lines.length) {
    const ln = lines[i]
    // code block
    if (ln.startsWith('```')) {
      const lang = ln.slice(3).trim()
      const buf = []; i++
      while (i < lines.length && !lines[i].startsWith('```')) { buf.push(lines[i]); i++ }
      elements.push(
        <div key={i} className="my-2">
          {lang && <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">{lang}</div>}
          <pre className="bg-slate-900 text-slate-100 rounded-xl p-3 overflow-x-auto text-xs font-mono whitespace-pre-wrap">{buf.join('\n')}</pre>
        </div>
      )
      i++; continue
    }
    // callout
    if (ln.startsWith('> ')) {
      const buf = [ln.slice(2)]
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) { buf.push(lines[++i].slice(2)) }
      elements.push(
        <div key={i} className="my-2 border-l-4 border-amber-400 bg-amber-50 px-3 py-2 rounded-r-lg">
          {buf.map((l, k) => <p key={k} className="text-amber-900 text-sm" dangerouslySetInnerHTML={{ __html: inlineFmt(l) }} />)}
        </div>
      )
      i++; continue
    }
    // heading
    if (ln.startsWith('### ')) { elements.push(<h3 key={i} className="text-base font-semibold mt-3 mb-1 text-slate-800" dangerouslySetInnerHTML={{ __html: inlineFmt(ln.slice(4)) }} />); i++; continue }
    if (ln.startsWith('## '))  { elements.push(<h2 key={i} className="text-lg font-bold mt-3 mb-1 text-slate-900" dangerouslySetInnerHTML={{ __html: inlineFmt(ln.slice(3)) }} />); i++; continue }
    if (ln.startsWith('# '))   { elements.push(<h1 key={i} className="text-xl font-bold mt-3 mb-2 text-slate-900" dangerouslySetInnerHTML={{ __html: inlineFmt(ln.slice(2)) }} />); i++; continue }
    // list
    if (/^[-*]\s/.test(ln) || /^\d+\.\s/.test(ln)) {
      const ordered = /^\d+\.\s/.test(ln)
      const items = []
      while (i < lines.length && (ordered ? /^\d+\.\s/.test(lines[i]) : /^[-*]\s/.test(lines[i]))) {
        items.push(lines[i].replace(/^([-*]|\d+\.)\s+/, '')); i++
      }
      const Tag = ordered ? 'ol' : 'ul'
      elements.push(
        <Tag key={i} className={ordered ? 'list-decimal list-inside my-2 space-y-0.5 text-slate-700 text-sm' : 'list-disc list-inside my-2 space-y-0.5 text-slate-700 text-sm'}>
          {items.map((it, k) => <li key={k} dangerouslySetInnerHTML={{ __html: inlineFmt(it) }} />)}
        </Tag>
      )
      continue
    }
    // divider
    if (/^---+$/.test(ln.trim())) { elements.push(<hr key={i} className="my-3 border-slate-200" />); i++; continue }
    // empty
    if (!ln.trim()) { i++; continue }
    // paragraph
    elements.push(<p key={i} className="text-slate-700 text-sm leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: inlineFmt(ln) }} />)
    i++
  }
  return elements
}

function MarkdownPreview({ text, placeholder }) {
  const nodes = renderMd(text)
  if (!nodes || nodes.length === 0) return null
  return (
    <div className="mt-2 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-lg">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Preview</div>
      {nodes}
    </div>
  )
}

const TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Grilă (multiple choice)' },
  { value: 'SHORT_ANSWER', label: 'Răspuns scurt (text)' },
  { value: 'INPUT_OUTPUT', label: 'Input / Output' },
  { value: 'CODING', label: 'Cod (verifică output)' },
]

export default function ProblemForm({ problem, courses = [], apiUrl, backUrl }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEdit = !!problem?.id
  const resolvedApiUrl = apiUrl || (isEdit ? `/api/admin/problems/${problem.id}` : '/api/admin/problems')
  const resolvedBackUrl = backUrl || '/admin/problems'

  const [form, setForm] = useState({
    title: problem?.title || '',
    description: problem?.description || '',
    difficulty: problem?.difficulty || 'EASY',
    topic: problem?.topic || '',
    subtopic: problem?.subtopic || '',
    type: problem?.type || 'MULTIPLE_CHOICE',
    options: problem?.options?.length ? problem.options : ['', '', '', ''],
    correctAnswer: problem?.correctAnswer || '',
    starterCode: problem?.starterCode || '',
    explanation: problem?.explanation || '',
    hint: problem?.hint || '',
    tags: Array.isArray(problem?.tags) ? problem.tags.join(', ') : '',
    estimatedTime: problem?.estimatedTime || 5,
    points: problem?.points || 10,
    language: problem?.language || 'python',
    courseId: problem?.courseId || '',
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const updateOption = (i, v) => setForm(f => {
    const opts = [...f.options]; opts[i] = v
    return { ...f, options: opts }
  })
  const addOption = () => setForm(f => ({ ...f, options: [...f.options, ''] }))
  const removeOption = (i) => setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.topic || !form.explanation) {
      toast.error('Completează titlu, cerință, topic și explicație')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        options: form.type === 'MULTIPLE_CHOICE' ? form.options.filter(o => o.trim()) : [],
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        courseId: form.courseId || null,
      }
      const url = resolvedApiUrl
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Eroare')
      }
      toast.success(isEdit ? 'Salvat!' : 'Problemă creată!')
      router.push(resolvedBackUrl)
      router.refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-4xl">
      {/* Date generale */}
      <section className="bg-white rounded-2xl border border-gray-200 p-4 xs:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">📋 Date generale</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titlu *</label>
          <input
            value={form.title}
            onChange={e => update('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            placeholder="ex: Suma elementelor unui array"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cerință (descriere) *</label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            placeholder="Descrierea completă a problemei. Suportă markdown / cod."
          />
          <MarkdownPreview text={form.description} />
          <p className="text-[11px] text-slate-400 mt-1">Formatare: <code className="bg-slate-100 px-1 rounded">**bold**</code> · <code className="bg-slate-100 px-1 rounded">`cod`</code> · <code className="bg-slate-100 px-1 rounded">```python ... ```</code> · <code className="bg-slate-100 px-1 rounded">&gt; notă</code> · <code className="bg-slate-100 px-1 rounded">- listă</code></p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
            <input
              value={form.topic}
              onChange={e => update('topic', e.target.value.toLowerCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="loops, arrays, functions..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtopic</label>
            <input
              value={form.subtopic}
              onChange={e => update('subtopic', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="opțional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curs (opțional)</label>
            <select
              value={form.courseId}
              onChange={e => update('courseId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">— Niciunul —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dificultate</label>
            <select value={form.difficulty} onChange={e => update('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="EASY">🟢 Ușor</option>
              <option value="MEDIUM">🟡 Mediu</option>
              <option value="HARD">🔴 Greu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
            <select value={form.type} onChange={e => update('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timp (min)</label>
            <input type="number" min="1" value={form.estimatedTime}
              onChange={e => update('estimatedTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Punctaj</label>
            <input type="number" min="1" value={form.points}
              onChange={e => update('points', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separate cu virgulă)</label>
          <input
            value={form.tags}
            onChange={e => update('tags', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="recursivitate, sortare, stringuri"
          />
        </div>
      </section>

      {/* Răspuns */}
      <section className="bg-white rounded-2xl border border-gray-200 p-4 xs:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">✅ Răspuns corect</h2>

        {form.type === 'MULTIPLE_CHOICE' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Opțiuni (bifează corectul)</label>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={form.correctAnswer === opt && opt !== ''}
                  onChange={() => update('correctAnswer', opt)}
                  className="w-4 h-4 text-indigo-600"
                />
                <input
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder={`Opțiunea ${i + 1}`}
                />
                {form.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)}
                    className="text-red-600 hover:text-red-700 px-2">×</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addOption}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              + Adaugă opțiune
            </button>
          </div>
        )}

        {(form.type === 'SHORT_ANSWER' || form.type === 'INPUT_OUTPUT') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Răspuns corect (compararea ignoră majuscule/spații)
            </label>
            <input
              value={form.correctAnswer}
              onChange={e => update('correctAnswer', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
              placeholder={form.type === 'INPUT_OUTPUT' ? 'output exact așteptat' : 'răspunsul așteptat'}
            />
          </div>
        )}

        {form.type === 'CODING' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limbaj</label>
              <select value={form.language} onChange={e => update('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cod de start (opțional)</label>
              <textarea
                value={form.starterCode}
                onChange={e => update('starterCode', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="def solve():&#10;    pass"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output așteptat / cuvânt-cheie de verificat
              </label>
              <textarea
                value={form.correctAnswer}
                onChange={e => update('correctAnswer', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="ex: rezultatul printat de cod"
              />
              <p className="text-xs text-gray-500 mt-1">
                Verificarea automată compară output-ul / textul submisiei cu acest șir (case-insensitive).
              </p>
            </div>
          </>
        )}
      </section>

      {/* Explicație + hint */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 xs:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">💡 Explicație + hint</h2>
        <p className="text-xs text-amber-700">
          Scrie explicația <strong>pas cu pas</strong>, ca și cum ai fi profesor — clar, simplu, prietenos.
          Aceasta e ce vede elevul când apasă „Vezi explicația”.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Explicație completă *</label>
          <textarea
            value={form.explanation}
            onChange={e => update('explanation', e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-amber-300 bg-white rounded-lg font-mono text-sm"
            placeholder={`Pas 1: Înțelegem cerința...\nPas 2: Inițializăm o variabilă...\nPas 3: Iterăm prin array...\n\nCod soluție:\nfor i in arr:\n    total += i`}
          />
          <MarkdownPreview text={form.explanation} />
          <p className="text-[11px] text-slate-400 mt-1">Formatare: <code className="bg-slate-100 px-1 rounded">**bold**</code> · <code className="bg-slate-100 px-1 rounded">`cod`</code> · <code className="bg-slate-100 px-1 rounded">```python ... ```</code> · <code className="bg-slate-100 px-1 rounded">&gt; notă</code> · <code className="bg-slate-100 px-1 rounded">- listă</code></p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hint (opțional)</label>
          <input
            value={form.hint}
            onChange={e => update('hint', e.target.value)}
            className="w-full px-3 py-2 border border-amber-300 bg-white rounded-lg"
            placeholder="ex: Gândește-te la o variabilă acumulator inițializată cu 0"
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
          Anulează
        </button>
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Se salvează...' : (isEdit ? 'Salvează modificările' : 'Creează problema')}
        </button>
      </div>
    </form>
  )
}
