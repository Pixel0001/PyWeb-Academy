'use client'

/** Categoriile cu culoare (CategoriesManager din StefanPWA) — comune pentru taskuri și programări. */

import { useState } from 'react'
import toast from 'react-hot-toast'
import { TrashIcon } from '@heroicons/react/24/outline'
import { CULORI_CATEGORII } from '@/lib/lucru/constante'
import { Dialog, dlgInput, lbl, cere } from './ui'

function Culori({ valoare, onSchimbare }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CULORI_CATEGORII.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onSchimbare(c)}
          className={`tap size-7 rounded-full ${valoare === c ? 'ring-2 ring-ink ring-offset-2' : ''}`}
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
      toast.success('Categorie adăugată')
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
    <Dialog titlu="Categorii" onInchide={onInchide}>
      <form onSubmit={adauga} className="mb-4 flex flex-col gap-3">
        <input className={dlgInput} value={nou.name} onChange={(e) => setNou({ ...nou, name: e.target.value })} placeholder="Nume categorie *" />
        <div>
          <label className={lbl}>Durată implicită programare (minute)</label>
          <input
            type="number"
            min={5}
            step={5}
            className={dlgInput}
            value={nou.defaultDurationMinutes}
            onChange={(e) => setNou({ ...nou, defaultDurationMinutes: Number(e.target.value) })}
          />
        </div>
        <Culori valoare={nou.color} onSchimbare={(color) => setNou({ ...nou, color })} />
        <button type="submit" disabled={lucrez || !nou.name.trim()} className="tap h-11 rounded-xl bg-brand font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
          Adaugă categorie
        </button>
      </form>

      {categorii.length === 0 ? (
        <p className="text-center text-sm text-ink-soft">Nicio categorie încă.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categorii.map((c) => (
            <li key={c.id} className="lcard flex flex-col gap-2 p-3">
              <div className="flex items-center gap-2">
                <span className="size-3 shrink-0 rounded-full" style={{ background: c.color }} />
                <input
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-ink hover:border-line focus:border-brand focus:outline-none"
                  defaultValue={c.name}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && modifica(c, { name: e.target.value.trim() })}
                />
                <input
                  type="number"
                  min={5}
                  step={5}
                  className="h-8 w-16 rounded-lg border border-line bg-surface-2 px-1.5 text-xs"
                  defaultValue={c.defaultDurationMinutes}
                  onBlur={(e) => Number(e.target.value) !== c.defaultDurationMinutes && modifica(c, { defaultDurationMinutes: Number(e.target.value) })}
                  title="Minute"
                />
                <span className="text-[11px] text-ink-soft">min</span>
                <button type="button" onClick={() => sterge(c)} className="tap grid size-8 place-items-center rounded-lg text-st-cancelled hover:bg-surface-2">
                  <TrashIcon className="size-4" />
                </button>
              </div>
              <Culori valoare={c.color} onSchimbare={(color) => modifica(c, { color })} />
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  )
}
