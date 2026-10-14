'use client'

/**
 * Proiect nou / editare — ProjectDialog din StefanPWA: nume, descriere,
 * status, client (lead sau text liber), responsabil, locație cu hartă.
 */

import { useState } from 'react'
import toast from 'react-hot-toast'
import { STATUSURI_PROIECT } from '@/lib/lucru/constante'
import { Dialog, dlgInput, dlgTextarea, lbl, btnSalveaza, cere } from './ui'
import CautaLegatura from './CautaLegatura'
import { AlegeLocatie } from './Harti'

export default function FormularProiect({ proiect, echipa, eu, onSalvat, onInchide }) {
  const editare = Boolean(proiect)
  const [f, setF] = useState(() => ({
    name: proiect?.name || '',
    description: proiect?.description || '',
    status: proiect?.status || 'ACTIVE',
    responsabilId: proiect?.responsabilId || (editare ? '' : eu || ''),
    clientName: proiect?.clientName || '',
    clientPhone: proiect?.clientPhone || '',
    lead: proiect?.lead
      ? { tip: 'lead', id: proiect.leadId, nume: proiect.lead.denumire, detaliu: [proiect.lead.oras, proiect.lead.telefon].filter(Boolean).join(' · ') }
      : null,
    address: proiect?.address || '',
    locatie: proiect?.lat != null && proiect?.lng != null ? { lat: proiect.lat, lng: proiect.lng } : null,
  }))
  const [salvez, setSalvez] = useState(false)
  const [eroare, setEroare] = useState(null)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))

  function alegeLead(l) {
    setF((x) => ({
      ...x,
      lead: l,
      clientName: x.clientName || l?.nume || '',
      clientPhone: x.clientPhone || l?.telefon || '',
      address: x.address || [l?.adresa, l?.oras].filter(Boolean).join(', '),
      name: x.name || (l ? `Site ${l.nume}` : ''),
    }))
  }

  async function trimite(e) {
    e.preventDefault()
    setEroare(null)
    setSalvez(true)
    try {
      const corp = {
        name: f.name,
        description: f.description,
        status: f.status,
        responsabilId: f.responsabilId || null,
        clientName: f.clientName,
        clientPhone: f.clientPhone,
        leadId: f.lead?.id || null,
        address: f.address,
        lat: f.locatie?.lat ?? null,
        lng: f.locatie?.lng ?? null,
      }
      const { proiect: salvat } = await cere(editare ? `/api/admin/projects/${proiect.id}` : '/api/admin/projects', {
        metoda: editare ? 'PATCH' : 'POST',
        corp,
      })
      toast.success(editare ? 'Proiect salvat' : 'Proiect creat')
      onSalvat?.(salvat)
      onInchide()
    } catch (err) {
      setEroare(err.message)
    } finally {
      setSalvez(false)
    }
  }

  return (
    <Dialog titlu={editare ? 'Editează proiect' : 'Proiect nou'} onInchide={onInchide}>
      <form onSubmit={trimite} className="flex flex-col gap-3">
        <input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Nume proiect *" required className={dlgInput} />
        <textarea value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Descriere" rows={3} className={dlgTextarea} />
        <select value={f.status} onChange={(e) => set('status', e.target.value)} className={dlgInput}>
          {STATUSURI_PROIECT.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div>
          <label className={lbl}>Client (lead din CRM sau text liber)</label>
          <CautaLegatura tipuri={['lead']} valoare={f.lead} onAlege={alegeLead} placeholder="Caută firma în leaduri…" />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input value={f.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="Nume client" className={dlgInput} />
            <input value={f.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} placeholder="Telefon client" className={dlgInput} />
          </div>
        </div>

        <p className="text-xs text-ink-soft">Task-urile noi din proiect se asignează implicit responsabilului.</p>
        <select value={f.responsabilId} onChange={(e) => set('responsabilId', e.target.value)} className={dlgInput}>
          <option value="">— Responsabil —</option>
          {echipa.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {o.id === eu ? ' (eu)' : ''}
            </option>
          ))}
        </select>

        <div>
          <label className={lbl}>Locație</label>
          <input value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Adresă (ex. str. Ismail 33, Chișinău)" className={dlgInput} />
          <div className="mt-2">
            <AlegeLocatie valoare={f.locatie} onSchimbare={(v) => set('locatie', v)} adresa={f.address} onAdresa={(a) => set('address', a)} />
          </div>
        </div>

        {eroare && <p className="text-sm text-st-cancelled">{eroare}</p>}
        <button type="submit" disabled={salvez} className={btnSalveaza}>
          {salvez ? 'Se salvează…' : 'Salvează'}
        </button>
      </form>
    </Dialog>
  )
}
