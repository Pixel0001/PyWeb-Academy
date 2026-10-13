'use client'

/**
 * Task nou / editare. La un task nou poți dicta (🎤) și poți atașa fișiere
 * care urcă imediat după salvare.
 */

import { useState } from 'react'
import toast from 'react-hot-toast'
import { PRIORITATI, INTERVALE_REAMINTIRE, marimeFisier } from '@/lib/lucru/constante'
import { cheieZi, oraLocala, momentLocal } from '@/lib/lucru/timp'
import { Modal, clsInput, clsEticheta, clsBtn, clsBtnAlb, cere } from './ui'
import ButonVoce from './ButonVoce'
import CautaLegatura from './CautaLegatura'
import { urcaFisier } from './Atasamente'

export function AlegeOameni({ echipa, valoare, onSchimbare, eu }) {
  const comuta = (id) => onSchimbare(valoare.includes(id) ? valoare.filter((x) => x !== id) : [...valoare, id])
  return (
    <div className="flex flex-wrap gap-1.5">
      {echipa.map((o) => {
        const ales = valoare.includes(o.id)
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => comuta(o.id)}
            title={o.telegram ? 'Primește notificări pe Telegram' : 'Nu are Telegram legat — vede taskul doar în panou'}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              ales ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {ales ? '✓' : '+'} {o.id === eu ? `${o.name} (eu)` : o.name}
            {o.telegram && <span className={ales ? 'text-indigo-200' : 'text-sky-500'}>✈</span>}
          </button>
        )
      })}
    </div>
  )
}

export function AlegeCategorie({ categorii, valoare, onSchimbare }) {
  if (!categorii.length) return <p className="text-xs text-gray-400">Nicio categorie încă (le creezi din „🏷️ Categorii”).</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onSchimbare('')}
        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${!valoare ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
      >
        Fără
      </button>
      {categorii.map((c) => {
        const ales = valoare === c.id
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSchimbare(ales ? '' : c.id)}
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={ales ? { background: c.color, borderColor: c.color, color: '#fff' } : { borderColor: `${c.color}66`, color: c.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: ales ? '#fff' : c.color }} />
            {c.name}
          </button>
        )
      })}
    </div>
  )
}

function dinTask(t, eu, implicit) {
  implicit = implicit || {}
  return {
    title: t?.title || implicit.title || '',
    description: t?.description || '',
    priority: t?.priority || 'MEDIUM',
    projectId: t?.projectId || implicit.projectId || '',
    newProjectName: '',
    categoryId: t?.categoryId || '',
    assigneeIds: t?.assigneeIds || implicit.assigneeIds || (eu ? [eu] : []),
    dueDate: t?.dueAt ? cheieZi(t.dueAt) : '',
    dueTime: t?.dueAt ? oraLocala(t.dueAt) : '',
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

  async function trimite(e) {
    e.preventDefault()
    if (!f.title.trim()) {
      toast.error('Scrie titlul.')
      return
    }
    const dueAt = f.dueDate ? momentLocal(f.dueDate, f.dueTime || '18:00')?.toISOString() : null
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
    if (!editare && f.newProjectName && !f.projectId) corp.newProjectName = f.newProjectName
    if (!editare && transcriere) corp.sursa = 'VOICE'

    setSalvez('Salvez…')
    try {
      const { task: salvat } = await cere(editare ? `/api/admin/tasks/${task.id}` : '/api/admin/tasks', {
        metoda: editare ? 'PATCH' : 'POST',
        corp,
      })
      for (const [i, fis] of fisiere.entries()) {
        setSalvez(`Urc fișierul ${i + 1}/${fisiere.length}…`)
        await urcaFisier(salvat.id, fis).catch((err) => toast.error(err.message))
      }
      toast.success(editare ? 'Salvat' : `Task creat ${salvat.seq ? `#${String(salvat.seq).padStart(3, '0')}` : ''}`)
      onSalvat?.(salvat)
      onInchide()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalvez(null)
    }
  }

  return (
    <Modal
      titlu={editare ? `Editează taskul` : 'Task nou'}
      subtitlu={editare ? task.title : 'Scrie sau dictează: ce, cine, până când'}
      onInchide={onInchide}
      subsol={
        <>
          <button type="button" onClick={onInchide} className={clsBtnAlb}>
            Renunță
          </button>
          <button type="submit" form="formular-task" disabled={Boolean(salvez)} className={clsBtn}>
            {salvez || (editare ? 'Salvează' : 'Creează taskul')}
          </button>
        </>
      }
    >
      <form id="formular-task" onSubmit={trimite} className="space-y-4">
        {!editare && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-200 bg-violet-50/60 p-2.5">
            <ButonVoce tip="task" onRezultat={dinVoce} eticheta="🎤 Dictează taskul" />
            <p className="min-w-0 flex-1 text-xs text-violet-900">
              {transcriere ? (
                <>
                  „<i>{transcriere}</i>”
                </>
              ) : (
                'Ex.: „Pentru Mihaela, urgent, sună la Dulcinella până joi la 3 despre ofertă"'
              )}
            </p>
          </div>
        )}

        <div>
          <label className={clsEticheta}>Titlu *</label>
          <input className={clsInput} value={f.title} onChange={(e) => set('title', e.target.value)} autoFocus={!editare} placeholder="Ce trebuie făcut" />
        </div>
        <div>
          <label className={clsEticheta}>Descriere</label>
          <textarea className={clsInput} rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Detalii, linkuri, pași…" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={clsEticheta}>Prioritate</label>
            <div className="flex flex-wrap gap-1">
              {PRIORITATI.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set('priority', p.value)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${f.priority === p.value ? `${p.culoare} ring-2 ring-indigo-400` : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={clsEticheta}>Proiect</label>
            <select className={clsInput} value={f.projectId} onChange={(e) => setF((x) => ({ ...x, projectId: e.target.value, newProjectName: '' }))}>
              <option value="">— Fără proiect —</option>
              {proiecte.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {f.newProjectName && !f.projectId && (
              <p className="mt-1 text-[11px] text-violet-700">
                ✨ Se creează proiectul nou „{f.newProjectName}”{' '}
                <button type="button" className="underline" onClick={() => set('newProjectName', '')}>
                  nu
                </button>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={clsEticheta}>Cine se ocupă</label>
          <AlegeOameni echipa={echipa} valoare={f.assigneeIds} onSchimbare={(v) => set('assigneeIds', v)} eu={eu} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={clsEticheta}>Termen — ziua</label>
            <input type="date" className={clsInput} value={f.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
          <div>
            <label className={clsEticheta}>Ora</label>
            <input type="time" className={clsInput} value={f.dueTime} onChange={(e) => set('dueTime', e.target.value)} disabled={!f.dueDate} placeholder="18:00" />
          </div>
          <div>
            <label className={clsEticheta}>Reamintire pe Telegram</label>
            <select className={clsInput} value={f.reminderIntervalMinutes} onChange={(e) => set('reminderIntervalMinutes', Number(e.target.value))}>
              {INTERVALE_REAMINTIRE.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {f.dueDate && (
          <div className="-mt-2 flex flex-wrap gap-1">
            <button type="button" className="text-[11px] text-gray-500 hover:text-red-600" onClick={() => setF((x) => ({ ...x, dueDate: '', dueTime: '' }))}>
              ✕ fără termen
            </button>
            {!f.dueTime && <span className="text-[11px] text-gray-400">· fără oră = până la 18:00</span>}
          </div>
        )}

        <div>
          <label className={clsEticheta}>Categorie</label>
          <AlegeCategorie categorii={categorii} valoare={f.categoryId} onSchimbare={(v) => set('categoryId', v)} />
        </div>

        <div>
          <label className={clsEticheta}>Legat de un lead (opțional)</label>
          <CautaLegatura tipuri={['lead']} valoare={f.lead} onAlege={(v) => set('lead', v)} />
        </div>

        {!editare && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className={clsEticheta}>Fișiere {fisiere.length > 0 && `(${fisiere.length})`}</label>
              <label className="cursor-pointer rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50">
                📎 Adaugă
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    setFisiere((l) => [...l, ...(e.target.files || [])])
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {fisiere.length > 0 && (
              <ul className="space-y-1">
                {fisiere.map((fis, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs">
                    <span className="min-w-0 flex-1 truncate">{fis.name}</span>
                    <span className="text-gray-500">{marimeFisier(fis.size)}</span>
                    <button type="button" onClick={() => setFisiere((l) => l.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </Modal>
  )
}
