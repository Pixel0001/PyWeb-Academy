'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function SubmissionGrader({ submission, lessonStats, existingAdvance }) {
  const router = useRouter()
  const [grade, setGrade] = useState(submission.grade ?? '')
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [saving, setSaving] = useState(false)
  const [advanceGranted, setAdvanceGranted] = useState(!!existingAdvance)

  const submit = async (newStatus) => {
    setSaving(true)
    try {
      const r = await fetch(`/api/teacher/submissions/${submission.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: grade === '' ? null : Number(grade),
          feedback,
          status: newStatus,
        }),
      })
      if (!r.ok) throw new Error()
      toast.success('Salvat')
      router.refresh()
    } catch { toast.error('Eroare la salvare') } finally { setSaving(false) }
  }

  const grantAdvance = async () => {
    if (!submission.lesson) return
    try {
      const r = await fetch('/api/teacher/advance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: submission.studentId,
          moduleId: submission.lesson.module.id,
          notes: `Acordat după ${submission.problem.title}`,
        }),
      })
      if (!r.ok) throw new Error()
      toast.success('🚀 Advance acordat — elevul poate trece la modulul următor')
      setAdvanceGranted(true)
      router.refresh()
    } catch { toast.error('Eroare') }
  }

  const revokeAdvance = async () => {
    if (!confirm('Revocă advance?')) return
    try {
      const r = await fetch(`/api/teacher/advance?studentId=${submission.studentId}&moduleId=${submission.lesson.module.id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      setAdvanceGranted(false)
      router.refresh()
    } catch { toast.error('Eroare') }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold mb-3">🎓 Notează & feedback</h3>
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notă (0-100)</label>
            <input type="number" min={0} max={100} value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-lg font-bold" />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <div className="flex gap-2 w-full">
              <button onClick={() => setGrade(100)} className="flex-1 px-3 py-2 text-sm bg-emerald-100 text-emerald-700 rounded-lg">💯</button>
              <button onClick={() => setGrade(80)} className="flex-1 px-3 py-2 text-sm bg-emerald-50 text-emerald-700 rounded-lg">80</button>
              <button onClick={() => setGrade(60)} className="flex-1 px-3 py-2 text-sm bg-amber-50 text-amber-700 rounded-lg">60</button>
              <button onClick={() => setGrade(40)} className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg">40</button>
              <button onClick={() => setGrade(0)} className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg">0</button>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Feedback pentru elev</label>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} placeholder="Ex: Bună rezolvare! Atenție la cazul când lista e goală..." className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => submit('GRADED')} disabled={saving} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50">
            ✅ Notează (corect)
          </button>
          <button onClick={() => submit('NEEDS_REVISION')} disabled={saving} className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg font-medium disabled:opacity-50">
            ⚠️ Cere refacere
          </button>
        </div>
      </div>

      {/* Advance section */}
      {submission.lesson && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-5">
          <h3 className="font-semibold mb-2">🚀 Advance la modulul următor</h3>
          <p className="text-sm text-gray-700 mb-3">
            Modul curent: <strong>{submission.lesson.module.title}</strong>
            {lessonStats && (
              <span className="ml-2 text-xs">
                ({lessonStats.done}/{lessonStats.total} probleme — {lessonStats.allGraded ? '✅ toate notate corect' : '⏳ încă în lucru'})
              </span>
            )}
          </p>
          {advanceGranted ? (
            <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg">
              <span className="text-sm text-purple-800">✅ Advance acordat — elevul poate trece la modulul următor</span>
              <button onClick={revokeAdvance} className="text-xs text-red-600 px-2 py-1 hover:bg-white rounded">Revocă</button>
            </div>
          ) : (
            <button onClick={grantAdvance} className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
              🚀 Acordă advance la modulul următor
            </button>
          )}
        </div>
      )}
    </div>
  )
}
