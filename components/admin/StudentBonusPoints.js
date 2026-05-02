'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  StarIcon, PlusIcon, TrashIcon, TrophyIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

const LEVEL_THRESHOLDS = [
  { min: 0,    name: 'Novice',     color: 'text-slate-500',  bar: 'bg-slate-400',  bg: 'bg-slate-50 border-slate-200' },
  { min: 100,  name: 'Explorator', color: 'text-blue-600',   bar: 'bg-blue-400',   bg: 'bg-blue-50 border-blue-200' },
  { min: 300,  name: 'Practicant', color: 'text-emerald-600',bar: 'bg-emerald-400',bg: 'bg-emerald-50 border-emerald-200' },
  { min: 700,  name: 'Expert',     color: 'text-amber-600',  bar: 'bg-amber-400',  bg: 'bg-amber-50 border-amber-200' },
  { min: 1500, name: 'Master',     color: 'text-purple-600', bar: 'bg-purple-400', bg: 'bg-purple-50 border-purple-200' },
  { min: 3000, name: 'Legend',     color: 'text-rose-600',   bar: 'bg-rose-400',   bg: 'bg-rose-50 border-rose-200' },
]

function getLevel(xp) {
  return [...LEVEL_THRESHOLDS].reverse().find(l => xp >= l.min) ?? LEVEL_THRESHOLDS[0]
}

export default function StudentBonusPoints({ studentId, initialBonusPoints = [], submissionXP = 0 }) {
  const [bonusPoints, setBonusPoints] = useState(initialBonusPoints)
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const bonusXP = bonusPoints.reduce((s, b) => s + b.points, 0)
  const totalXP = submissionXP + bonusXP

  const levels = LEVEL_THRESHOLDS
  const currentLevel = getLevel(totalXP)
  const nextLevel = levels[currentLevel.min === 0 ? 1 : levels.findIndex(l => l.min === currentLevel.min) + 1]
  const xpIntoLevel = totalXP - currentLevel.min
  const xpNeeded = nextLevel ? nextLevel.min - currentLevel.min : 1
  const levelPct = nextLevel ? Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)) : 100

  const handleAdd = async () => {
    if (!points || !reason.trim()) return toast.error('Completează toate câmpurile')
    setSaving(true)
    try {
      const r = await fetch(`/api/admin/students/${studentId}/bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: Number(points), reason }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setBonusPoints(prev => [d.bonusPoint, ...prev])
      setPoints('')
      setReason('')
      toast.success('Puncte bonus adăugate!')
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
  }

  const handleDelete = async (bpId) => {
    if (!confirm('Șterge aceste puncte bonus?')) return
    try {
      const r = await fetch(`/api/admin/students/${studentId}/bonus?bpId=${bpId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      setBonusPoints(prev => prev.filter(b => b.id !== bpId))
      toast.success('Șters')
    } catch { toast.error('Eroare') }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <TrophyIcon className="w-5 h-5 text-amber-500" />
        <h2 className="text-base font-semibold text-gray-900">XP & Scor elev</h2>
      </div>

      {/* XP Summary */}
      <div className="p-5 space-y-4">
        <div className={`rounded-xl p-4 border ${currentLevel.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Nivel curent</div>
              <div className={`text-xl font-extrabold ${currentLevel.color}`}>
                Nivel {levels.findIndex(l => l.min === currentLevel.min) + 1} — {currentLevel.name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-gray-900">{totalXP}</div>
              <div className="text-xs text-gray-500">XP total</div>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${currentLevel.bar} rounded-full transition-all duration-700`} style={{ width: `${levelPct}%` }} />
          </div>
          {nextLevel && (
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>{currentLevel.name}</span>
              <span>{nextLevel.min - totalXP} XP până la {nextLevel.name}</span>
            </div>
          )}
        </div>

        {/* XP breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Din probleme</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{submissionXP} XP</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Puncte bonus</div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1">{bonusXP > 0 ? '+' : ''}{bonusXP} XP</div>
          </div>
        </div>

        {/* Add bonus points */}
        <div className="border-t border-gray-100 pt-4">
          <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
            <StarIcon className="w-4 h-4 text-amber-500" /> Adaugă puncte bonus
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              value={points}
              onChange={e => setPoints(e.target.value)}
              placeholder="Pct (ex: 50)"
              className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Motiv (ex: Tema de acasă, Concurs...)"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition"
            >
              <PlusIcon className="w-4 h-4" />
              {saving ? '...' : 'Adaugă'}
            </button>
          </div>
          <p className="text-xs text-gray-400">Poți adăuga puncte negative (ex: -10) pentru penalizări.</p>
        </div>

        {/* Bonus points history */}
        {bonusPoints.length > 0 && (
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Istoric puncte bonus</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {bonusPoints.map(bp => (
                <div key={bp.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm">
                  <StarSolid className={`w-4 h-4 shrink-0 ${bp.points >= 0 ? 'text-amber-400' : 'text-rose-400'}`} />
                  <span className={`font-bold w-12 shrink-0 ${bp.points >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {bp.points >= 0 ? '+' : ''}{bp.points}
                  </span>
                  <span className="flex-1 text-gray-700 truncate">{bp.reason}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {bp.addedBy?.name} · {new Date(bp.createdAt).toLocaleDateString('ro-RO')}
                  </span>
                  <button onClick={() => handleDelete(bp.id)} className="p-1 hover:bg-rose-100 rounded text-rose-400 hover:text-rose-600 shrink-0">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
