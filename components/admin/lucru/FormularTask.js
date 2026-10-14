'use client'

/**
 * Task nou / editare — dialogul din StefanPWA (CreateDialog / EditDialog).
 * În plus: 🎤 dictare și legătura opțională cu un lead.
 */

import { useState } from 'react'
import toast from 'react-hot-toast'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PRIORITATI, INTERVALE_REAMINTIRE, marimeFisier } from '@/lib/lucru/constante'
import { cheieZi, oraLocala, momentLocal } from '@/lib/lucru/timp'
import { Dialog, dlgInput, dlgTextarea, lbl, btnSalveaza, cere } from './ui'
import ButonVoce from './ButonVoce'
import CautaLegatura from './CautaLegatura'
import { urcaFisier } from './Atasamente'

/** Asignații: chips „👤 Nume ✕" + „Adaugă persoană" (MultiAssignPicker). */
export function AlegeOameni({ echipa, valoare, onSchimbare, eu, eticheta = 'Asignat' }) {
  const disponibili = echipa.filter((o) => !valoare.includes(o.id))
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-ink-soft">{eticheta}</label>
      {valoare.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {valoare.map((id) => {
            const o = echipa.find((x) => x.id === id)
            if (!o) return null
            return (
              <div key={id} className="flex items-center gap-1 rounded-full border border-line bg-surface-2 py-1 pl-2.5 pr-1">
                <span className="text-xs font-medium text-ink">
                  👤 {o.name}
                  {o.id === eu ? ' (eu)' : ''}
                </span>
                {o.telegram && (
                  <span className="text-[10px] text-sky-500" title="Primește pe Telegram">
                    ✈
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onSchimbare(valoare.filter((x) => x !== id))}
                  className="ml-0.5 grid size-5 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-line hover:text-ink"
                  aria-label={`Scoate ${o.name}`}
                >
                  <XMarkIcon className="size-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
      {disponibili.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && onSchimbare([...valoare, e.target.value])}
          className="h-10 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-brand"
        >
          <option value="">＋ Adaugă persoană</option>
          {disponibili.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {o.id === eu ? ' (eu)' : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

/** Categoriile ca pastile (CategoryChips din StefanPWA). */
export function AlegeCategorie({ categorii, valoare, onSchimbare, eticheta = 'Categorie' }) {
  if (!categorii.length) return null
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink-soft">{eticheta}</label>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onSchimbare('')}
          className={`h-7 rounded-full border px-3 text-xs font-medium transition-colors ${
            !valoare ? 'border-brand bg-brand text-white' : 'border-line text-ink-soft hover:border-brand'
          }`}
        >
          Fără categorie
        </button>
        {categorii.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSchimbare(c.id)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
              valoare === c.id ? 'border-brand bg-brand/10 text-brand' : 'border-line text-ink-soft hover:border-brand'
            }`}
          >
            <span className="size-2 rounded-full" style={{ background: c.color }} />
            {c.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function dinTask(t, eu, implicit) {
  implicit = implicit || {}
  const ora = t?.dueAt ? oraLocala(t.dueAt) : ''
  return {
    title: t?.title || implicit.title || '',
    description: t?.description || '',
    priority: t?.priority || 'MEDIUM',
    projectId: t?.projectId || implicit.projectId || '',
    newProjectName: '',
    categoryId: t?.categoryId || '',
    assigneeIds: t?.assigneeIds || implicit.assigneeIds || (eu ? [eu] : []),
    dueDate: t?.dueAt ? cheieZi(t.dueAt) : '',
    dueTime: ora && ora !== '00:00' ? ora : '',
    reminderIntervalMinutes: t?.reminderIntervalMinutes || 0,
    lead: t?.lead
      ? { tip: 'lead', id: t.lead.id, nume: t.lead.denumire, detaliu: [t.lead.oras, t.lead.telefon].filter(Boolean).join(' · ') }
      : implicit.lead || null,
  }
}

export default function FormularTask({ task, implicit, echipa, categorii, proiecte, eu, onSalvat, onInchide }) {
  const editare = Boolean(task)
  const [f, setF] = useState(() => dinTask(task, eu, implicit))
  const [fisiere, setFisiere] = useState([])
  const [transcriere, setTranscriere] = useState('')
  const [salvez, setSalvez] = useState(null)
  const [eroare, setEroare] = useState(null)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))

  function dinVoce({ transcriere: t, campuri: c }) {
    setTranscriere(t)
    setF((x) => ({
      ...x,
      title: c.title || x.title,
      description: c.description || x.description,
      priority: c.priority || x.priority,
      projectId: c.projectId || (c.newProjectName ? '' : x.projectId),
      newProjectName: c.newProjectName || '',
      categoryId: c.categoryId || x.categoryId,
      assigneeIds: c.assigneeIds?.length ? c.assigneeIds : x.assigneeIds,
      dueDate: c.dueDate || x.dueDate,
      dueTime: c.dueTime || x.dueTime,
      reminderIntervalMinutes: c.reminderIntervalMinutes || x.reminderIntervalMinutes,
    }))
  }

  function alegeProiect(v) {
    if (v === '__nou') {
      const nume = prompt('Numele proiectului nou:')
      if (nume?.trim()) setF((x) => ({ ...x, projectId: '', newProjectName: nume.trim() }))
      return
    }
    setF((x) => ({ ...x, projectId: v, newProjectName: '' }))
  }

  async function trimite(e) {
    e.preventDefault()
    setEroare(null)
    if (!f.title.trim()) {
      setEroare('Titlul e obligatoriu.')
      return
    }
    const dueAt = f.dueDate ? momentLocal(f.dueDate, f.dueTime || '00:00')?.toISOString() : null
    const corp = {
      title: f.title,
      description: f.description,
      priority: f.priority,
      projectId: f.projectId || null,
      categoryId: f.categoryId || null,
      assigneeIds: f.assigneeIds,
      dueAt,
      reminderIntervalMinutes: Number(f.reminderIntervalMinutes) || 0,
      leadId: f.lead?.id || null,
    }
    if (f.newProjectName && !f.projectId) corp.newProjectName = f.newProjectName
    if (!editare && transcriere) corp.sursa = 'VOICE'

    setSalvez('Se salvează…')
    try {
      const { task: salvat } = await cere(editare ? `/api/admin/tasks/${task.id}` : '/api/admin/tasks', {
        metoda: editare ? 'PATCH' : 'POST',
        corp,
      })
      for (const [i, fis] of fisiere.entries()) {
        setSalvez(`Fișier ${i + 1} / ${fisiere.length}…`)
        await urcaFisier(salvat.id, fis).catch((err) => toast.error(err.message))
      }
      toast.success(editare ? 'Salvat' : 'Task creat')
      onSalvat?.(salvat)
      onInchide()
    } catch (err) {
      setEroare(err.message)
    } finally {
      setSalvez(null)
    }
  }

  const titlu = editare ? `Editează task${task.seq != null ? ` #${task.seq}` : ''}` : 'Task nou'

  return (
    <Dialog titlu={titlu} onInchide={onInchide}>
      <form onSubmit={trimite} className="flex flex-col gap-3">
        {!editare && (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2">
            <ButonVoce tip="task" onRezultat={dinVoce} eticheta="Dictează" mic />
            <p className="min-w-0 flex-1 truncate text-[11px] text-ink-soft">
              {transcriere ? `„${transcriere}”` : 'Spune ce, cine și până când — completez eu'}
            </p>
          </div>
        )}

        <input
          value={f.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Titlu *"
          required
          autoFocus={!editare}
          className={dlgInput}
        />
        <textarea value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Descriere" rows={3} className={dlgTextarea} />

        <select value={f.priority} onChange={(e) => set('priority', e.target.value)} className={dlgInput}>
          {PRIORITATI.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <select value={f.newProjectName ? '__nou' : f.projectId} onChange={(e) => alegeProiect(e.target.value)} className={dlgInput}>
          <option value="">Fără proiect</option>
          {proiecte.map((p) => (
            <option key={p.id} value={p.id}>
              Proiect: {p.name}
            </option>
          ))}
          <option value="__nou">{f.newProjectName ? `＋ Proiect nou: ${f.newProjectName}` : '＋ Creează proiect nou…'}</option>
        </select>

        <div>
          <label className={lbl}>Lead (opțional)</label>
          <CautaLegatura tipuri={['lead']} valoare={f.lead} onAlege={(v) => set('lead', v)} />
        </div>

        <AlegeOameni echipa={echipa} valoare={f.assigneeIds} onSchimbare={(v) => set('assigneeIds', v)} eu={eu} />

        <div>
          <label className={lbl}>Termen</label>
          <div className="grid gap-2 sm:grid-cols-2">
            <input type="date" value={f.dueDate} onChange={(e) => set('dueDate', e.target.value)} className={dlgInput} />
            <input type="time" value={f.dueTime} onChange={(e) => set('dueTime', e.target.value)} className={dlgInput} />
          </div>
        </div>

        <AlegeCategorie categorii={categorii} valoare={f.categoryId} onSchimbare={(v) => set('categoryId', v)} />

        <div>
          <label className={lbl}>Reamintire periodică (Telegram)</label>
          <select
            value={f.reminderIntervalMinutes}
            onChange={(e) => set('reminderIntervalMinutes', Number(e.target.value))}
            className={dlgInput}
          >
            {INTERVALE_REAMINTIRE.map((r) => (
              <option key={r.value} value={r.value}>
                {r.value ? r.label : 'Niciodată'}
              </option>
            ))}
          </select>
        </div>

        {!editare && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-soft">Atașamente {fisiere.length > 0 && `(${fisiere.length})`}</span>
              <label className="tap cursor-pointer rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand-soft">
                ＋ Fișier
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  disabled={Boolean(salvez)}
                  onChange={(e) => {
                    setFisiere((l) => [...l, ...(e.target.files || [])])
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {fisiere.length > 0 && (
              <ul className="flex flex-col gap-1">
                {fisiere.map((fis, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-xs">{fis.name}</span>
                    <span className="shrink-0 text-[11px] text-ink-soft">{marimeFisier(fis.size)}</span>
                    <button
                      type="button"
                      onClick={() => setFisiere((l) => l.filter((_, j) => j !== i))}
                      className="tap shrink-0 text-xs text-st-cancelled"
                      disabled={Boolean(salvez)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {eroare && <p className="text-sm text-st-cancelled">{eroare}</p>}
        <button type="submit" disabled={Boolean(salvez)} className={btnSalveaza}>
          {salvez || (editare ? 'Salvează' : 'Creează task')}
        </button>
      </form>
    </Dialog>
  )
}
