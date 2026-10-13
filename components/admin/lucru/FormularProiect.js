'use client'

/** Proiect nou / editare: nume, client (liber sau lead), responsabil, adresă + pin pe hartă. */

import { useState } from 'react'
import toast from 'react-hot-toast'
import { STATUSURI_PROIECT } from '@/lib/lucru/constante'
import { Modal, clsInput, clsEticheta, clsBtn, clsBtnAlb, cere } from './ui'
import CautaLegatura from './CautaLegatura'
import { AlegeLocatie } from './Harti'

export default function FormularProiect({ proiect, echipa, eu, onSalvat, onInchide }) {
  const editare = Boolean(proiect)
  const [f, setF] = useState(() => ({
    name: proiect?.name || '',
    description: proiect?.description || '',
    status: proiect?.status || 'ACTIVE',
    responsabilId: proiect?.responsabilId || eu || '',
    clientName: proiect?.clientName || '',
    clientPhone: proiect?.clientPhone || '',
    lead: proiect?.lead
      ? { tip: 'lead', id: proiect.leadId, nume: proiect.lead.denumire, detaliu: [proiect.lead.oras, proiect.lead.telefon].filter(Boolean).join(' · ') }
      : null,
    address: proiect?.address || '',
    locatie: proiect?.lat != null && proiect?.lng != null ? { lat: proiect.lat, lng: proiect.lng } : null,
  }))
  const [salvez, setSalvez] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))

  function alegeLead(l) {
    setF((x) => ({
      ...x,
      lead: l,
      // Completăm din lead doar ce e gol
      clientName: x.clientName || l?.nume || '',
      clientPhone: x.clientPhone || l?.telefon || '',
      address: x.address || [l?.adresa, l?.oras].filter(Boolean).join(', '),
      name: x.name || (l ? `Site ${l.nume}` : ''),
    }))
  }

  async function trimite(e) {
    e.preventDefault()
    if (!f.name.trim()) {
      toast.error('Scrie numele proiectului.')
      return
    }
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
      toast.error(err.message)
    } finally {
      setSalvez(false)
    }
  }

  return (
    <Modal
      titlu={editare ? 'Editează proiectul' : 'Proiect nou'}
      subtitlu={editare ? proiect.name : 'Un client / o lucrare, cu taskurile și programările ei'}
      onInchide={onInchide}
      subsol={
        <>
          <button type="button" onClick={onInchide} className={clsBtnAlb}>
            Renunță
          </button>
          <button type="submit" form="formular-proiect" disabled={salvez} className={clsBtn}>
            {salvez ? 'Salvez…' : editare ? 'Salvează' : 'Creează proiectul'}
          </button>
        </>
      }
    >
      <form id="formular-proiect" onSubmit={trimite} className="space-y-4">
        <div>
          <label className={clsEticheta}>Legat de un lead (opțional)</label>
          <CautaLegatura tipuri={['lead']} valoare={f.lead} onAlege={alegeLead} placeholder="Caută firma din leaduri — completez eu restul" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={clsEticheta}>Nume proiect *</label>
            <input className={clsInput} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Site Dulcinella" />
          </div>
          <div>
            <label className={clsEticheta}>Status</label>
            <select className={clsInput} value={f.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSURI_PROIECT.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={clsEticheta}>Descriere</label>
          <textarea className={clsInput} rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Ce facem, ce s-a stabilit, prețul…" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={clsEticheta}>Client</label>
            <input className={clsInput} value={f.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="Nume / firmă" />
          </div>
          <div>
            <label className={clsEticheta}>Telefon client</label>
            <input className={clsInput} value={f.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} placeholder="+373…" />
          </div>
          <div>
            <label className={clsEticheta}>Responsabil</label>
            <select className={clsInput} value={f.responsabilId} onChange={(e) => set('responsabilId', e.target.value)}>
              <option value="">— nimeni —</option>
              {echipa.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id === eu ? `${o.name} (eu)` : o.name}
                </option>
              ))}
            </select>
            <p className="mt-0.5 text-[10px] text-gray-400">Taskurile noi din proiect merg implicit la el</p>
          </div>
        </div>
        <div>
          <label className={clsEticheta}>Adresă</label>
          <input className={clsInput} value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="str. Ismail 33, Chișinău" />
        </div>
        <div>
          <label className={clsEticheta}>Locație pe hartă (opțional)</label>
          <AlegeLocatie valoare={f.locatie} onSchimbare={(v) => set('locatie', v)} adresa={f.address} onAdresa={(a) => set('address', a)} />
        </div>
      </form>
    </Modal>
  )
}
