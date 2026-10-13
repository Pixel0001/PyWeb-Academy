'use client'

/** 🏷️ Categoriile cu culoare — comune pentru taskuri și programări. */

import { useState } from 'react'
import toast from 'react-hot-toast'
import { TrashIcon } from '@heroicons/react/24/outline'
import { CULORI_CATEGORII } from '@/lib/lucru/constante'
import { Modal, clsInput, clsBtn, cere } from './ui'

function Culori({ valoare, onSchimbare }) {
  return (
    <div className="flex flex-wrap gap-1">
      {CULORI_CATEGORII.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onSchimbare(c)}
          className={`h-6 w-6 rounded-full ${valoare === c ? 'ring-2 ring-gray-900 ring-offset-1' : ''}`}
          style={{ background: c }}
          aria-label={c}
        />
      ))}
    </div>
  )
}

export default function Categorii({ categorii, onSchimbare, onInchide }) {
  const [nou, setNou] = useState({ name: '', color: CULORI_CATEGORII[0], defaultDurationMinutes: 30 })
  const [lucrez, setLucrez] = useState(false)

  async function adauga(e) {
    e.preventDefault()
    if (!nou.name.trim()) return
    setLucrez(true)
    try {
      const { categorie } = await cere('/api/admin/categorii', { metoda: 'POST', corp: nou })
      onSchimbare([...categorii, categorie].sort((a, b) => a.name.localeCompare(b.name)))
      setNou((x) => ({ ...x, name: '' }))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLucrez(false)
    }
  }

  async function modifica(c, schimbari) {
    onSchimbare(categorii.map((x) => (x.id === c.id ? { ...x, ...schimbari } : x)))
    try {
      await cere(`/api/admin/categorii/${c.id}`, { metoda: 'PATCH', corp: schimbari })
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function sterge(c) {
    if (!confirm(`Ștergi categoria „${c.name}"? Taskurile și programările rămân, doar fără categorie.`)) return
    try {
      await cere(`/api/admin/categorii/${c.id}`, { metoda: 'DELETE' })
      onSchimbare(categorii.filter((x) => x.id !== c.id))
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Modal titlu="🏷️ Categorii" subtitlu="Pentru taskuri și programări (durata se folosește la programări)" onInchide={onInchide} latime="max-w-lg">
      <form onSubmit={adauga} className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex gap-2">
          <input className={clsInput} value={nou.name} onChange={(e) => setNou({ ...nou, name: e.target.value })} placeholder="Ex.: Site nou, Mentenanță, Întâlnire" />
          <input
            type="number"
            min={5}
            step={5}
            className={`${clsInput} w-24`}
            value={nou.defaultDurationMinutes}
            onChange={(e) => setNou({ ...nou, defaultDurationMinutes: Number(e.target.value) })}
            title="Durata implicită a unei programări (minute)"
          />
          <button type="submit" disabled={lucrez || !nou.name.trim()} className={clsBtn}>
            Adaugă
          </button>
        </div>
        <Culori valoare={nou.color} onSchimbare={(color) => setNou({ ...nou, color })} />
      </form>

      {categorii.length === 0 ? (
        <p className="text-center text-sm text-gray-500">Nicio categorie încă.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {categorii.map((c) => (
            <li key={c.id} className="space-y-1.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                <input
                  className="min-w-0 flex-1 rounded border border-transparent px-1 py-0.5 text-sm font-medium hover:border-gray-200 focus:border-indigo-400 focus:outline-none"
                  defaultValue={c.name}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && modifica(c, { name: e.target.value.trim() })}
                />
                <input
                  type="number"
                  min={5}
                  step={5}
                  className="w-16 rounded border border-gray-200 px-1 py-0.5 text-xs"
                  defaultValue={c.defaultDurationMinutes}
                  onBlur={(e) => Number(e.target.value) !== c.defaultDurationMinutes && modifica(c, { defaultDurationMinutes: Number(e.target.value) })}
                  title="Minute"
                />
                <span className="text-[11px] text-gray-400">min</span>
                <button type="button" onClick={() => sterge(c)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <Culori valoare={c.color} onSchimbare={(color) => modifica(c, { color })} />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
