'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import {
  AcademicCapIcon, LockClosedIcon, CheckCircleIcon, RocketLaunchIcon,
  EyeIcon, EyeSlashIcon,
} from '@heroicons/react/24/outline'

export default function StudentModuleAccessTable({ studentId, modules, accessIds, advanceIds, hiddenIds = [] }) {
  const router = useRouter()
  const [accessSet, setAccessSet] = useState(new Set(accessIds))
  const [pendingId, setPendingId] = useState(null)
  const [hiddenSet, setHiddenSet] = useState(new Set(hiddenIds))
  const [pendingHideId, setPendingHideId] = useState(null)

  const toggle = async (moduleId) => {
    const has = accessSet.has(moduleId)
    setPendingId(moduleId)
    const next = new Set(accessSet)
    has ? next.delete(moduleId) : next.add(moduleId)
    setAccessSet(next)
    try {
      let res
      if (has) {
        res = await fetch(`/api/admin/students/${studentId}/module-access?moduleId=${moduleId}`, { method: 'DELETE' })
      } else {
        res = await fetch(`/api/admin/students/${studentId}/module-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId, source: 'granted' }),
        })
      }
      if (!res.ok) throw new Error((await res.json()).error || 'Eroare')
      toast.success(has ? 'Acces revocat' : 'Acces acordat')
      router.refresh()
    } catch (e) {
      // revert
      const revert = new Set(accessSet)
      has ? revert.add(moduleId) : revert.delete(moduleId)
      setAccessSet(revert)
      toast.error(e.message)
    } finally {
      setPendingId(null)
    }
  }

  const advanceSet = new Set(advanceIds)

  const toggleHide = async (moduleId) => {
    const isHidden = hiddenSet.has(moduleId)
    setPendingHideId(moduleId)
    const next = new Set(hiddenSet)
    isHidden ? next.delete(moduleId) : next.add(moduleId)
    setHiddenSet(next)
    try {
      let res
      if (isHidden) {
        res = await fetch(`/api/admin/students/${studentId}/module-hidden?moduleId=${moduleId}`, { method: 'DELETE' })
      } else {
        res = await fetch(`/api/admin/students/${studentId}/module-hidden`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId }),
        })
      }
      if (!res.ok) throw new Error((await res.json()).error || 'Eroare')
      toast.success(isHidden ? 'Modul afișat' : 'Modul ascuns')
      router.refresh()
    } catch (e) {
      // revert
      const revert = new Set(hiddenSet)
      isHidden ? revert.add(moduleId) : revert.delete(moduleId)
      setHiddenSet(revert)
      toast.error(e.message)
    } finally {
      setPendingHideId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center gap-2">
        <AcademicCapIcon className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-gray-900">Acces module</h3>
        <span className="text-xs text-gray-500 ml-auto">{accessSet.size}/{modules.length} acordate{hiddenSet.size > 0 ? ` · ${hiddenSet.size} ascunse` : ''}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {modules.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">Niciun modul definit.</div>
        )}
        {modules.map((m, idx) => {
          const has = accessSet.has(m.id)
          const advanced = advanceSet.has(m.id)
          const pending = pendingId === m.id
          const hidden = hiddenSet.has(m.id)
          const pendingHide = pendingHideId === m.id
          return (
            <div key={m.id} className={`px-4 py-3 flex items-center gap-3 hover:bg-gray-50 ${hidden ? 'opacity-50' : ''}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                has ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{idx + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm truncate">{m.title}</span>
                  {m.language && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-900 text-white rounded">{m.language}</span>}
                  {advanced && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                    <RocketLaunchIcon className="w-3 h-3" /> Advance
                  </span>}
                  {hidden && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded">Ascuns</span>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{m._count?.lessons ?? 0} lecții</div>
              </div>
              {/* Eye toggle — hide/show for student */}
              <button
                onClick={() => toggleHide(m.id)}
                disabled={pendingHide}
                title={hidden ? 'Afișează modulul' : 'Ascunde modulul de la student'}
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                  hidden ? 'text-rose-500 bg-rose-50 hover:bg-rose-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                {hidden ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
              {/* Access toggle switch */}
              <button
                onClick={() => toggle(m.id)}
                disabled={pending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
                  has ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
                aria-label="Toggle acces modul"
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  has ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
