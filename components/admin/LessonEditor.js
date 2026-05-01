'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const DIFF = { EASY: '🟢', MEDIUM: '🟡', HARD: '🔴' }

export default function LessonEditor({ moduleId, lesson, allProblems, canEdit }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: lesson.title, theory: lesson.theory, isFree: lesson.isFree,
    order: lesson.order, videoUrl: lesson.videoUrl || '', active: lesson.active,
  })
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState(false)
  const [picked, setPicked] = useState(new Set())
  const [search, setSearch] = useState('')

  const save = async () => {
    setSaving(true)
    try {
      const r = await fetch(`/api/admin/modules/${moduleId}/lessons/${lesson.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error()
      toast.success('Salvat')
      router.refresh()
    } catch { toast.error('Eroare') } finally { setSaving(false) }
  }

  const attachPicked = async () => {
    if (picked.size === 0) return
    try {
      const r = await fetch(`/api/admin/modules/${moduleId}/lessons/${lesson.id}/problems`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemIds: [...picked] }),
      })
      if (!r.ok) throw new Error()
      toast.success(`${picked.size} probleme atașate`)
      setPicked(new Set())
      setPicker(false)
      router.refresh()
    } catch { toast.error('Eroare') }
  }

  const detach = async (pid) => {
    if (!confirm('Detașează problema din lecție?')) return
    try {
      const r = await fetch(`/api/admin/modules/${moduleId}/lessons/${lesson.id}/problems?problemId=${pid}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      router.refresh()
    } catch { toast.error('Eroare') }
  }

  const available = allProblems.filter(p => p.lessonId !== lesson.id && (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.topic?.toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="space-y-4">
      {/* Lesson form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-xl font-bold">📖 Detalii lecție</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Titlu</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg" disabled={!canEdit} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teorie (markdown)</label>
          <textarea value={form.theory} onChange={e => setForm({ ...form, theory: e.target.value })} rows={12} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" disabled={!canEdit} />
          <p className="text-xs text-gray-500 mt-1">Acceptă markdown: ## Titlu, **bold**, `cod`, ```cod block```</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Video URL (opțional)</label>
          <input value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" disabled={!canEdit} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isFree} onChange={e => setForm({ ...form, isFree: e.target.checked })} disabled={!canEdit} />
            <span className="text-emerald-700 font-medium">🎁 Gratuită (trial)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            Ordine: <input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="w-20 px-2 py-1 border rounded" disabled={!canEdit} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} disabled={!canEdit} />
            Activă
          </label>
          {canEdit && (
            <button onClick={save} disabled={saving} className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">
              {saving ? '...' : 'Salvează'}
            </button>
          )}
        </div>
      </div>

      {/* Problems */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">📝 Probleme în lecție ({lesson.problems.length})</h3>
          {canEdit && (
            <div className="flex gap-2">
              <Link href="/admin/problems/new" className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50">+ Creează problemă nouă</Link>
              <button onClick={() => setPicker(!picker)} className="text-sm px-3 py-1.5 bg-emerald-600 text-white rounded-lg">
                {picker ? 'Închide' : '+ Atașează din bancă'}
              </button>
            </div>
          )}
        </div>

        {picker && (
          <div className="bg-gray-50 rounded-xl p-3 mb-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută..." className="w-full px-3 py-2 border rounded-lg text-sm mb-2" />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {available.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">Nicio problemă disponibilă.</p>
              ) : available.map(p => (
                <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-white rounded text-sm cursor-pointer">
                  <input type="checkbox" checked={picked.has(p.id)} onChange={(e) => {
                    const n = new Set(picked)
                    if (e.target.checked) n.add(p.id); else n.delete(p.id)
                    setPicked(n)
                  }} />
                  <span>{DIFF[p.difficulty]}</span>
                  <span className="font-medium">{p.title}</span>
                  <span className="text-xs text-gray-500">#{p.topic}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
              <span className="text-xs text-gray-600">{picked.size} selectate</span>
              <button onClick={attachPicked} disabled={picked.size === 0} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">Atașează</button>
            </div>
          </div>
        )}

        {lesson.problems.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-6">Nicio problemă atașată. Adaugă pentru ca elevii să rezolve după teorie.</p>
        ) : (
          <ol className="space-y-1">
            {lesson.problems.map((p, i) => (
              <li key={p.id} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg">
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded font-mono">{i + 1}</span>
                <span>{DIFF[p.difficulty]}</span>
                <span className="font-medium flex-1">{p.title}</span>
                <span className="text-xs text-gray-500">{p.topic}</span>
                <Link href={`/admin/problems/${p.id}/edit`} className="text-xs text-indigo-600 px-2">Editează</Link>
                {canEdit && <button onClick={() => detach(p.id)} className="text-xs text-red-600 px-2">Detașează</button>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
