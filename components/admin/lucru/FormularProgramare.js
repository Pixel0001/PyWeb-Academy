'use client'

/**
 * Programare nouă / editare — QuickAddDialog din StefanPWA.
 *
 * Contactul e liber (orice antreprenor, client, partener); opțional o legi de
 * un lead web și/sau de un proiect, iar numele și telefonul se completează
 * singure. Reminderele pe Telegram merg doar la echipă.
 */

import { useState } from 'react'
import toast from 'react-hot-toast'
import { CheckIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { PRESETURI_REMINDER, REMINDERE_IMPLICITE, STATUSURI_PROGRAMARE } from '@/lib/lucru/constante'
import { cheieZi, oraLocala, adaugaZile } from '@/lib/lucru/timp'
import { Dialog, dlgInput, lbl, cere } from './ui'
import CautaLegatura from './CautaLegatura'
import ButonVoce from './ButonVoce'

const chip = 'tap rounded-full px-3.5 py-2 text-sm font-medium border border-line'

function oraUrmatoare() {
  const [h] = oraLocala(new Date(Date.now() + 60 * 60000)).split(':').map(Number)
  return `${String(Math.min(h, 22)).padStart(2, '0')}:00`
}

function stareInitiala(p, implicit, eu) {
  implicit = implicit || {}
  if (p) {
    return {
      title: p.title || '',
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
      lead: p.lead
        ? { tip: 'lead', id: p.leadId, nume: p.lead.denumire, detaliu: [p.lead.oras, p.lead.telefon].filter(Boolean).join(' · ') }
        : null,
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
  const [eroare, setEroare] = useState(null)
  const [transcriere, setTranscriere] = useState('')
  const [maiMult, setMaiMult] = useState(() => Boolean(programare?.company || programare?.contactEmail || programare?.location))
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const azi = cheieZi()
  const maine = adaugaZile(azi, 1)

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
    if (c.company || c.location) setMaiMult(true)
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
    setEroare(null)
    if (!f.contactName.trim() && !f.lead) {
      setEroare('Scrie cu cine e programarea (sau leag-o de un lead).')
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
        status: f.status,
        ignoraSuprapunere,
      }
      const { programare: salvata } = await cere(editare ? `/api/admin/programari/${programare.id}` : '/api/admin/programari', {
        metoda: editare ? 'PATCH' : 'POST',
        corp,
      })
      toast.success(editare ? 'Programare salvată' : 'Programare creată')
      onSalvat?.(salvata)
      onInchide()
    } catch (e) {
      if (e.status === 409 && !ignoraSuprapunere && confirm(`${e.message}\n\nO salvez oricum?`)) {
        setSalvez(false)
        return await salveaza(true)
      }
      setEroare(e.message)
    } finally {
      setSalvez(false)
    }
  }

  const comutaReminder = (k) =>
    set('reminderOffsets', f.reminderOffsets.includes(k) ? f.reminderOffsets.filter((x) => x !== k) : [...f.reminderOffsets, k])
  const telegramActiv = f.reminderOffsets.length > 0

  return (
    <Dialog titlu={editare ? 'Editează programarea' : 'Programare nouă'} onInchide={onInchide}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          salveaza()
        }}
        className="flex flex-col gap-4"
      >
        {!editare && (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2">
            <ButonVoce tip="programare" onRezultat={dinVoce} eticheta="Dictează" mic />
            <p className="min-w-0 flex-1 truncate text-[11px] text-ink-soft">
              {transcriere ? `„${transcriere}”` : '„Joi la 3, întâlnire cu Ion de la Granier pentru site”'}
            </p>
          </div>
        )}

        {/* Client */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Client / contact</label>
          <input value={f.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Cu cine? (nume persoană)" className={dlgInput} />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input value={f.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="Telefon" className={dlgInput} />
            <CautaLegatura tipuri={['lead']} valoare={f.lead} onAlege={alegeLead} placeholder="🎯 Leagă de un lead…" />
          </div>
          <div className="mt-2">
            <CautaLegatura tipuri={['proiect']} valoare={f.proiect} onAlege={alegeProiect} placeholder="📁 Leagă de un proiect…" />
          </div>
          {maiMult ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input value={f.company} onChange={(e) => set('company', e.target.value)} placeholder="Firma" className={dlgInput} />
              <input value={f.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="Email" type="email" className={dlgInput} />
              <input value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Unde (adresă, Zoom…)" className={`${dlgInput} sm:col-span-2`} />
            </div>
          ) : (
            <button type="button" onClick={() => setMaiMult(true)} className="mt-1.5 text-xs font-medium text-brand hover:underline">
              ＋ firmă, email, locație
            </button>
          )}
        </div>

        {/* Categorie */}
        {categorii.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Categorie</label>
            <div className="flex flex-wrap gap-2">
              {categorii.map((c) => {
                const ales = f.categoryId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      set('categoryId', ales ? '' : c.id)
                      if (!ales && !editare) set('durationMinutes', c.defaultDurationMinutes)
                    }}
                    className={`${chip} ${ales ? 'text-white' : 'text-ink'}`}
                    style={ales ? { background: c.color, borderColor: c.color } : undefined}
                  >
                    <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ background: ales ? '#fff' : c.color }} />
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Data + ora */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Data</label>
            <div className="mb-2 flex gap-2">
              <button type="button" onClick={() => set('dateKey', azi)} className={`${chip} flex-1 ${f.dateKey === azi ? 'border-brand bg-brand text-white' : 'text-ink'}`}>
                Azi
              </button>
              <button type="button" onClick={() => set('dateKey', maine)} className={`${chip} flex-1 ${f.dateKey === maine ? 'border-brand bg-brand text-white' : 'text-ink'}`}>
                Mâine
              </button>
            </div>
            <input type="date" value={f.dateKey} onChange={(e) => set('dateKey', e.target.value)} className={dlgInput} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:block">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Ora</label>
              <input type="time" value={f.time} onChange={(e) => set('time', e.target.value)} step={300} className={`${dlgInput} text-base`} />
            </div>
            <div>
              <label className="mb-1 mt-0 block text-xs font-semibold text-ink-soft sm:mt-2">Durată (min)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={f.durationMinutes}
                onChange={(e) => set('durationMinutes', e.target.value)}
                placeholder="ex. 30"
                className={dlgInput}
              />
            </div>
          </div>
        </div>

        <input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Despre ce? (ex. Discuție site, Prezentare ofertă)" className={dlgInput} />
        <input value={f.message} onChange={(e) => set('message', e.target.value)} placeholder="Notițe (opțional)" className={dlgInput} />

        <div>
          <label className={lbl}>Cine merge</label>
          <select value={f.responsabilId} onChange={(e) => set('responsabilId', e.target.value)} className={dlgInput}>
            <option value="">— nimeni anume —</option>
            {echipa.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {o.id === eu ? ' (eu)' : ''}
                {o.telegram ? ' ✈' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Status + reminder */}
        <div className="flex flex-wrap items-center gap-2">
          {editare ? (
            <select value={f.status} onChange={(e) => set('status', e.target.value)} className="h-10 rounded-full border border-line bg-surface px-3 text-sm">
              {STATUSURI_PROGRAMARE.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() => set('status', f.status === 'CONFIRMED' ? 'NEW' : 'CONFIRMED')}
              className={`${chip} inline-flex items-center gap-1.5 ${f.status === 'CONFIRMED' ? 'border-st-confirmed bg-st-confirmed text-white' : 'text-ink'}`}
            >
              {f.status === 'CONFIRMED' && <CheckIcon className="size-3.5" />} Confirmat
            </button>
          )}
          <button
            type="button"
            onClick={() => set('reminderOffsets', telegramActiv ? [] : REMINDERE_IMPLICITE)}
            className={`${chip} inline-flex items-center gap-1.5 ${telegramActiv ? 'border-brand bg-brand text-white' : 'text-ink'}`}
          >
            <PaperAirplaneIcon className="size-3.5" /> Telegram
          </button>
        </div>

        {telegramActiv && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Remindere (pentru cine merge)</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETURI_REMINDER.map((r) => {
                const ales = f.reminderOffsets.includes(r.key)
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => comutaReminder(r.key)}
                    className={`h-7 rounded-full border px-3 text-xs font-medium transition-colors ${
                      ales ? 'border-brand bg-brand/10 text-brand' : 'border-line text-ink-soft hover:border-brand'
                    }`}
                  >
                    {ales ? '✓ ' : ''}
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {eroare && <p className="rounded-lg bg-st-cancelled/10 px-3 py-2 text-sm text-st-cancelled">{eroare}</p>}

        <button
          type="submit"
          disabled={salvez}
          className="tap min-h-12 rounded-xl bg-brand py-3 text-base font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
        >
          {salvez ? 'Se salvează…' : editare ? 'Salvează' : 'Salvează programarea'}
        </button>
      </form>
    </Dialog>
  )
}
