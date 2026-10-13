'use client'

/**
 * Programare nouă / editare.
 *
 * Contactul e liber (orice antreprenor, client, partener). Opțional o legi de
 * un lead web și/sau de un proiect — atunci numele și telefonul se completează
 * singure, dar le poți schimba.
 */

import { useState } from 'react'
import toast from 'react-hot-toast'
import { PRESETURI_REMINDER, REMINDERE_IMPLICITE, STATUSURI_PROGRAMARE } from '@/lib/lucru/constante'
import { cheieZi, oraLocala, adaugaZile } from '@/lib/lucru/timp'
import { Modal, clsInput, clsEticheta, clsBtn, clsBtnAlb, cere } from './ui'
import CautaLegatura from './CautaLegatura'
import ButonVoce from './ButonVoce'
import { AlegeCategorie } from './FormularTask'

const TITLURI = ['Discuție site', 'Prezentare ofertă', 'Semnare contract', 'Predare site', 'Apel', 'Întâlnire online']
const DURATE = [15, 30, 45, 60, 90, 120]
const LOCURI = ['Online (Zoom / Meet)', 'La noi', 'La client', 'Telefonic']

function oraUrmatoare() {
  const d = new Date(Date.now() + 60 * 60000)
  const [h] = oraLocala(d).split(':').map(Number)
  return `${String(Math.min(h, 22)).padStart(2, '0')}:00`
}

function stareInitiala(p, implicit, eu) {
  implicit = implicit || {}
  if (p) {
    return {
      title: p.title,
      contactName: p.contactName,
      company: p.company || '',
      contactPhone: p.contactPhone || '',
      contactEmail: p.contactEmail || '',
      location: p.location || '',
      message: p.message || '',
      dateKey: p.dateKey,
      time: oraLocala(p.startAt),
      durationMinutes: Math.round((new Date(p.endAt) - new Date(p.startAt)) / 60000),
      categoryId: p.categoryId || '',
      responsabilId: p.responsabilId || '',
      reminderOffsets: p.reminderOffsets || [],
      status: p.status,
      lead: p.lead ? { tip: 'lead', id: p.leadId, nume: p.lead.denumire, detaliu: [p.lead.oras, p.lead.telefon].filter(Boolean).join(' · ') } : null,
      proiect: p.project ? { tip: 'proiect', id: p.project.id, nume: p.project.name } : null,
    }
  }
  const pr = implicit.proiect
  return {
    title: '',
    contactName: pr?.clientName || pr?.lead?.denumire || '',
    company: pr?.lead?.denumire || '',
    contactPhone: pr?.clientPhone || pr?.lead?.telefon || '',
    contactEmail: '',
    location: pr?.address || '',
    message: '',
    dateKey: implicit.dateKey || cheieZi(),
    time: implicit.time || oraUrmatoare(),
    durationMinutes: 60,
    categoryId: '',
    responsabilId: eu || '',
    reminderOffsets: REMINDERE_IMPLICITE,
    status: 'NEW',
    lead: implicit.lead || (pr?.lead ? { tip: 'lead', id: pr.leadId, nume: pr.lead.denumire } : null),
    proiect: pr ? { tip: 'proiect', id: pr.id, nume: pr.name } : null,
  }
}

export default function FormularProgramare({ programare, implicit, echipa, categorii, eu, onSalvat, onInchide }) {
  const editare = Boolean(programare)
  const [f, setF] = useState(() => stareInitiala(programare, implicit, eu))
  const [salvez, setSalvez] = useState(false)
  const [transcriere, setTranscriere] = useState('')
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const azi = cheieZi()

  function alegeLead(l) {
    setF((x) => ({
      ...x,
      lead: l,
      contactName: x.contactName || l?.nume || '',
      company: x.company || l?.nume || '',
      contactPhone: x.contactPhone || l?.telefon || '',
      location: x.location || [l?.adresa, l?.oras].filter(Boolean).join(', '),
    }))
  }

  function alegeProiect(p) {
    setF((x) => ({
      ...x,
      proiect: p,
      contactName: x.contactName || p?.clientName || '',
      contactPhone: x.contactPhone || p?.telefon || '',
      location: x.location || p?.adresa || '',
    }))
  }

  function dinVoce({ transcriere: t, campuri: c }) {
    setTranscriere(t)
    setF((x) => ({
      ...x,
      title: c.title || x.title,
      contactName: c.contactName || x.contactName,
      company: c.company || x.company,
      contactPhone: c.contactPhone || x.contactPhone,
      location: c.location || x.location,
      dateKey: c.dateKey || c.dueDate || x.dateKey,
      time: c.time || c.dueTime || x.time,
      durationMinutes: c.durationMinutes || x.durationMinutes,
      responsabilId: c.responsabilId || x.responsabilId,
      reminderOffsets: c.reminderOffsets?.length ? c.reminderOffsets : x.reminderOffsets,
      message: c.message || c.description || x.message,
      categoryId: c.categoryId || x.categoryId,
    }))
  }

  async function salveaza(ignoraSuprapunere = false) {
    if (!f.contactName.trim() && !f.lead) {
      toast.error('Scrie cu cine e întâlnirea (sau leag-o de un lead).')
      return
    }
    setSalvez(true)
    try {
      const corp = {
        title: f.title.trim() || 'Întâlnire',
        contactName: f.contactName,
        company: f.company,
        contactPhone: f.contactPhone,
        contactEmail: f.contactEmail,
        location: f.location,
        message: f.message,
        dateKey: f.dateKey,
        time: f.time,
        durationMinutes: Number(f.durationMinutes) || 60,
        categoryId: f.categoryId || null,
        responsabilId: f.responsabilId || null,
        reminderOffsets: f.reminderOffsets,
        leadId: f.lead?.id || null,
        projectId: f.proiect?.id || null,
        ignoraSuprapunere,
        ...(editare ? { status: f.status } : {}),
      }
      const { programare: salvata } = await cere(editare ? `/api/admin/programari/${programare.id}` : '/api/admin/programari', {
        metoda: editare ? 'PATCH' : 'POST',
        corp,
      })
      toast.success(editare ? 'Programare salvată' : 'Programare adăugată')
      onSalvat?.(salvata)
      onInchide()
    } catch (e) {
      if (e.status === 409 && !ignoraSuprapunere) {
        if (confirm(`${e.message}\n\nO salvez oricum?`)) {
          setSalvez(false)
          return await salveaza(true)
        }
      } else toast.error(e.message)
    } finally {
      setSalvez(false)
    }
  }

  const comutaReminder = (k) =>
    set('reminderOffsets', f.reminderOffsets.includes(k) ? f.reminderOffsets.filter((x) => x !== k) : [...f.reminderOffsets, k])

  return (
    <Modal
      titlu={editare ? 'Editează programarea' : 'Programare nouă'}
      subtitlu={editare ? `${programare.title} · ${programare.contactName}` : 'Cu oricine — antreprenor, client, partener'}
      onInchide={onInchide}
      subsol={
        <>
          <button type="button" onClick={onInchide} className={clsBtnAlb}>
            Renunță
          </button>
          <button type="submit" form="formular-programare" disabled={salvez} className={clsBtn}>
            {salvez ? 'Salvez…' : editare ? 'Salvează' : 'Adaugă programarea'}
          </button>
        </>
      }
    >
      <form
        id="formular-programare"
        onSubmit={(e) => {
          e.preventDefault()
          salveaza()
        }}
        className="space-y-4"
      >
        {!editare && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-200 bg-violet-50/60 p-2.5">
            <ButonVoce tip="programare" onRezultat={dinVoce} eticheta="🎤 Dictează" />
            <p className="min-w-0 flex-1 text-xs text-violet-900">
              {transcriere ? <>„<i>{transcriere}</i>”</> : 'Ex.: „Joi la 3, întâlnire cu Ion de la Dulcinella pentru site, la ei în oficiu"'}
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={clsEticheta}>🎯 Legată de un lead (opțional)</label>
            <CautaLegatura tipuri={['lead']} valoare={f.lead} onAlege={alegeLead} />
          </div>
          <div>
            <label className={clsEticheta}>📁 Legată de un proiect (opțional)</label>
            <CautaLegatura tipuri={['proiect']} valoare={f.proiect} onAlege={alegeProiect} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={clsEticheta}>Cu cine *</label>
            <input className={clsInput} value={f.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Numele persoanei" />
          </div>
          <div>
            <label className={clsEticheta}>Firma</label>
            <input className={clsInput} value={f.company} onChange={(e) => set('company', e.target.value)} placeholder="Opțional" />
          </div>
          <div>
            <label className={clsEticheta}>Telefon</label>
            <input className={clsInput} value={f.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="+373…" />
          </div>
          <div>
            <label className={clsEticheta}>Email</label>
            <input className={clsInput} type="email" value={f.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="Opțional" />
          </div>
        </div>

        <div>
          <label className={clsEticheta}>Despre ce</label>
          <input className={clsInput} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Întâlnire" />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {TITLURI.map((t) => (
              <button key={t} type="button" onClick={() => set('title', t)} className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50">
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={clsEticheta}>Ziua</label>
            <input type="date" className={clsInput} value={f.dateKey} onChange={(e) => set('dateKey', e.target.value)} />
            <div className="mt-1 flex gap-1">
              {[
                [azi, 'Azi'],
                [adaugaZile(azi, 1), 'Mâine'],
                [adaugaZile(azi, 2), 'Poimâine'],
              ].map(([k, l]) => (
                <button key={k} type="button" onClick={() => set('dateKey', k)} className={`rounded px-1.5 py-0.5 text-[10px] ${f.dateKey === k ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={clsEticheta}>Ora</label>
            <input type="time" className={clsInput} value={f.time} onChange={(e) => set('time', e.target.value)} step={300} />
          </div>
          <div>
            <label className={clsEticheta}>Durata (minute)</label>
            <input type="number" min={5} step={5} className={clsInput} value={f.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} />
            <div className="mt-1 flex flex-wrap gap-1">
              {DURATE.map((d) => (
                <button key={d} type="button" onClick={() => set('durationMinutes', d)} className={`rounded px-1.5 py-0.5 text-[10px] ${Number(f.durationMinutes) === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {d < 60 ? `${d}m` : `${d / 60}h`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className={clsEticheta}>Unde</label>
          <input className={clsInput} value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Adresă, oraș sau link de Zoom" />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {LOCURI.map((l) => (
              <button key={l} type="button" onClick={() => set('location', l)} className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50">
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={clsEticheta}>Cine merge</label>
            <select className={clsInput} value={f.responsabilId} onChange={(e) => set('responsabilId', e.target.value)}>
              <option value="">— nimeni anume —</option>
              {echipa.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id === eu ? `${o.name} (eu)` : o.name}
                  {o.telegram ? ' ✈' : ''}
                </option>
              ))}
            </select>
          </div>
          {editare && (
            <div>
              <label className={clsEticheta}>Status</label>
              <select className={clsInput} value={f.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSURI_PROGRAMARE.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.emoji} {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className={clsEticheta}>🔔 Reminder pe Telegram (pentru cine merge)</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETURI_REMINDER.map((r) => {
              const ales = f.reminderOffsets.includes(r.key)
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => comutaReminder(r.key)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${ales ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  {ales ? '✓ ' : ''}
                  {r.label}
                </button>
              )
            })}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Reminderele merg doar la echipă — contactului nu i se trimite nimic automat.</p>
        </div>

        <div>
          <label className={clsEticheta}>Categorie</label>
          <AlegeCategorie
            categorii={categorii}
            valoare={f.categoryId}
            onSchimbare={(v) => {
              set('categoryId', v)
              const c = categorii.find((x) => x.id === v)
              if (c && !editare) set('durationMinutes', c.defaultDurationMinutes)
            }}
          />
        </div>

        <div>
          <label className={clsEticheta}>Notițe</label>
          <textarea className={clsInput} rows={3} value={f.message} onChange={(e) => set('message', e.target.value)} placeholder="Ce trebuie să iei cu tine, ce s-a discutat la telefon…" />
        </div>
      </form>
    </Modal>
  )
}
