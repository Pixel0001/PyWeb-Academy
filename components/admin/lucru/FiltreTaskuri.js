'use client'

/**
 * Bara de filtre pentru taskuri — aceeași în listă și în Kanban.
 * Filtrele se țin minte în browser (localStorage), ca la leaduri.
 */

import { useEffect, useMemo, useState } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { PRIORITATI, TERMENE } from '@/lib/lucru/constante'

export const FILTRE_GOALE = {
  scope: 'all',
  q: '',
  priority: '',
  project: '',
  category: '',
  assignee: '',
  due: '',
  inchise: false,
}

function citeste(cheie) {
  try {
    return JSON.parse(localStorage.getItem(cheie) || 'null')
  } catch {
    return null
  }
}

export function useFiltreTaskuri(cheie, dinUrl = {}) {
  const [filtre, setFiltre] = useState(FILTRE_GOALE)
  const [gata, setGata] = useState(false)

  // Prima încărcare: ce e salvat, peste care se pun parametrii din link (?project=…)
  useEffect(() => {
    const salvate = citeste(cheie) || {}
    const url = Object.fromEntries(Object.entries(dinUrl).filter(([k, v]) => v && k in FILTRE_GOALE))
    setFiltre({ ...FILTRE_GOALE, ...salvate, ...url })
    setGata(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cheie])

  useEffect(() => {
    if (!gata) return
    try {
      localStorage.setItem(cheie, JSON.stringify(filtre))
    } catch {
      /* stocare indisponibilă */
    }
  }, [cheie, filtre, gata])

  const query = useMemo(() => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(filtre)) {
      if (k === 'inchise') {
        if (v) p.set('inchise', '1')
      } else if (v) p.set(k, v)
    }
    return p.toString()
  }, [filtre])

  const set = (k, v) => setFiltre((f) => ({ ...f, [k]: v }))
  const reseteaza = () => setFiltre({ ...FILTRE_GOALE, scope: filtre.scope })
  const active = Object.entries(filtre).filter(([k, v]) => k !== 'scope' && v && v !== FILTRE_GOALE[k]).length

  return { filtre, set, reseteaza, query, gata, active }
}

const clsSelect =
  'rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none'

export default function FiltreTaskuri({ f, echipa, categorii, proiecte, eu, cuInchise = true }) {
  const { filtre, set, reseteaza, active } = f
  const [q, setQ] = useState(filtre.q)

  useEffect(() => setQ(filtre.q), [filtre.q])
  useEffect(() => {
    const t = setTimeout(() => q !== filtre.q && set('q', q), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {[
            ['mine', '👤 Ale mele'],
            ['all', '👥 Toate'],
            ['created', '✍️ Create de mine'],
          ].map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => set('scope', v)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${filtre.scope === v ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="relative min-w-[180px] flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Caută în titlu, descriere sau #număr…"
            className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <select className={clsSelect} value={filtre.due} onChange={(e) => set('due', e.target.value)}>
          <option value="">📅 Orice termen</option>
          {TERMENE.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select className={clsSelect} value={filtre.priority} onChange={(e) => set('priority', e.target.value)}>
          <option value="">⚑ Orice prioritate</option>
          {PRIORITATI.map((p) => (
            <option key={p.value} value={p.value}>
              {p.emoji} {p.label}
            </option>
          ))}
        </select>
        <select className={clsSelect} value={filtre.project} onChange={(e) => set('project', e.target.value)}>
          <option value="">📁 Orice proiect</option>
          <option value="none">— Fără proiect —</option>
          {proiecte.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {categorii.length > 0 && (
          <select className={clsSelect} value={filtre.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">🏷️ Orice categorie</option>
            {categorii.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {filtre.scope !== 'mine' && (
          <select className={clsSelect} value={filtre.assignee} onChange={(e) => set('assignee', e.target.value)}>
            <option value="">👤 Oricine</option>
            {echipa.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id === eu ? `${o.name} (eu)` : o.name}
              </option>
            ))}
          </select>
        )}
        {cuInchise && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700">
            <input type="checkbox" checked={filtre.inchise} onChange={(e) => set('inchise', e.target.checked)} className="h-3.5 w-3.5 accent-indigo-600" />
            Arată și cele vechi finalizate
          </label>
        )}
        {active > 0 && (
          <button type="button" onClick={reseteaza} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
            <XMarkIcon className="h-3.5 w-3.5" /> Șterge filtrele ({active})
          </button>
        )}
      </div>
    </div>
  )
}
