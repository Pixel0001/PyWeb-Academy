'use client'

/**
 * Fereastra „Lead nou" / „Editează" — ca în CRM-ul Olla English.
 *
 * Pentru firmele care nu vin din extragerea Google: o recomandare, o pagină
 * de Facebook, cineva care ne-a sunat. Dacă firma există deja (același
 * telefon, sau același nume în același oraș), întâi arătăm care e — ca să
 * n-o sune doi oameni — și abia apoi lăsăm salvarea „oricum".
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { STATUSURI, SURSE, getSursa, getStatus } from '@/lib/leads/statusuri'

const inputClass =
  'w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500'

function laInputLocal(valoare) {
  if (!valoare) return ''
  const d = new Date(valoare)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function pesteZile(zile) {
  const d = new Date()
  d.setDate(d.getDate() + zile)
  d.setHours(10, 0, 0, 0)
  return laInputLocal(d)
}

export default function FormularLead({ lead = null, echipa = [], orase = [], categorii = [], onInchide, onSalvat }) {
  const editare = Boolean(lead)
  const [date, setDate] = useState(() => ({
    denumire: lead?.denumire || '',
    telefon: lead?.telefon || lead?.telefonLocal || '',
    oras: lead?.oras || '',
    categorie: lead?.categoriePrincipala || '',
    siteUrl: lead?.siteUrl || '',
    adresa: lead?.adresa || '',
    sursa: lead ? lead.sursa || 'GOOGLE_MAPS' : 'MANUAL',
    sursaDetaliu: lead?.sursaDetaliu || '',
    status: lead?.status || 'DE_SUNAT',
    responsabilId: lead?.responsabilId || '',
    nextFollowUpAt: laInputLocal(lead?.nextFollowUpAt),
    nota: '',
  }))
  const [salveaza, setSalveaza] = useState(false)
  const [duplicate, setDuplicate] = useState(null)

  // Escape închide; pagina din spate nu se mai derulează
  useEffect(() => {
    const laTasta = (e) => e.key === 'Escape' && onInchide()
    document.addEventListener('keydown', laTasta)
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', laTasta)
      document.body.style.overflow = anterior
    }
  }, [onInchide])

  const seteaza = (camp) => (e) => setDate((d) => ({ ...d, [camp]: e.target.value }))
  const sursa = getSursa(date.sursa)

  async function trimite(e, forteaza = false) {
    e?.preventDefault()
    if (!date.denumire.trim()) {
      toast.error('Scrie numele firmei')
      return
    }

    setSalveaza(true)
    try {
      const corp = {
        ...date,
        responsabilId: date.responsabilId || null,
        nextFollowUpAt: date.nextFollowUpAt ? new Date(date.nextFollowUpAt).toISOString() : null,
      }

      let raspuns
      if (editare) {
        // La editare trimitem doar ce s-a schimbat — un site neatins nu se re-verifică
        const schimbari = {}
        const initial = {
          denumire: lead.denumire || '',
          telefon: lead.telefon || lead.telefonLocal || '',
          oras: lead.oras || '',
          categorie: lead.categoriePrincipala || '',
          siteUrl: lead.siteUrl || '',
          adresa: lead.adresa || '',
          sursa: lead.sursa || 'GOOGLE_MAPS',
          sursaDetaliu: lead.sursaDetaliu || '',
          status: lead.status,
          responsabilId: lead.responsabilId || null,
          nextFollowUpAt: lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString() : null,
        }
        for (const [cheie, valoare] of Object.entries(initial)) {
          if ((corp[cheie] ?? '') !== (valoare ?? '')) schimbari[cheie] = corp[cheie]
        }
        if (!Object.keys(schimbari).length) {
          onInchide()
          return
        }
        raspuns = await fetch(`/api/admin/leads/${lead.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schimbari),
        })
      } else {
        raspuns = await fetch('/api/admin/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...corp, forteaza }),
        })
      }

      const rez = await raspuns.json().catch(() => ({}))

      if (raspuns.status === 409 && rez.duplicate) {
        setDuplicate(rez.duplicate)
        return
      }
      if (!raspuns.ok) throw new Error(rez.error || 'Nu am putut salva')

      toast.success(editare ? 'Lead actualizat' : 'Lead adăugat')
      onSalvat(rez.lead)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalveaza(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-3 sm:p-6">
        <div className="fixed inset-0 bg-black/50" onClick={onInchide} />

        <form
          onSubmit={trimite}
          role="dialog"
          aria-modal="true"
          aria-label={editare ? 'Editează lead' : 'Lead nou'}
          className="relative my-2 w-full max-w-2xl rounded-2xl bg-white shadow-xl sm:my-4"
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 rounded-t-2xl border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                {editare ? `Editează: ${lead.denumire}` : 'Lead nou'}
              </h2>
              <p className="text-xs text-gray-500">
                {editare
                  ? 'Datele firmei, statusul, responsabilul sau recontactarea'
                  : 'Recomandare, Facebook, Instagram, cineva care ne-a sunat...'}
              </p>
            </div>
            <button
              type="button"
              onClick={onInchide}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              aria-label="Închide"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            {duplicate && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Firma pare să existe deja
                </p>
                <ul className="mt-1.5 space-y-1">
                  {duplicate.map((d) => (
                    <li key={d.id} className="text-xs text-amber-900">
                      <Link
                        href={`/admin/leads/${d.id}`}
                        target="_blank"
                        className="font-medium underline hover:text-amber-700"
                      >
                        {d.denumire}
                      </Link>
                      {d.oras ? ` · ${d.oras}` : ''}
                      {d.telefon || d.telefonLocal ? ` · ${d.telefon || d.telefonLocal}` : ''}
                      {' · '}
                      {getStatus(d.status).emoji} {getStatus(d.status).label}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => trimite(e, true)}
                    disabled={salveaza}
                    className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    E altă firmă — salvează oricum
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicate(null)}
                    className="rounded-lg border border-amber-400 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                  >
                    Corectez datele
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Camp eticheta="Numele firmei *" latime="sm:col-span-2">
                <input
                  autoFocus
                  value={date.denumire}
                  onChange={seteaza('denumire')}
                  placeholder="ex: Salon Bella"
                  className={inputClass}
                />
              </Camp>
              <Camp eticheta="Telefon">
                <input
                  value={date.telefon}
                  onChange={seteaza('telefon')}
                  placeholder="069 123 456"
                  inputMode="tel"
                  className={inputClass}
                />
              </Camp>
              <Camp eticheta="Oraș">
                <input value={date.oras} onChange={seteaza('oras')} list="lead-orase" className={inputClass} />
                <datalist id="lead-orase">
                  {orase.map((o) => (
                    <option key={o.value} value={o.value} />
                  ))}
                </datalist>
              </Camp>
              <Camp eticheta="Categorie">
                <input
                  value={date.categorie}
                  onChange={seteaza('categorie')}
                  list="lead-categorii"
                  placeholder="ex: salon de frumusețe"
                  className={inputClass}
                />
                <datalist id="lead-categorii">
                  {categorii.map((c) => (
                    <option key={c.value} value={c.value} />
                  ))}
                </datalist>
              </Camp>
              <Camp eticheta="Site / pagină" ajutor="se verifică automat, ca la extragere">
                <input
                  value={date.siteUrl}
                  onChange={seteaza('siteUrl')}
                  placeholder="firma.md sau facebook.com/firma"
                  className={inputClass}
                />
              </Camp>
              <Camp eticheta="Adresă" latime="sm:col-span-2">
                <input value={date.adresa} onChange={seteaza('adresa')} className={inputClass} />
              </Camp>

              <Camp eticheta="Sursă">
                <select value={date.sursa} onChange={seteaza('sursa')} className={inputClass}>
                  {SURSE.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.emoji} {s.label}
                    </option>
                  ))}
                </select>
              </Camp>
              <Camp eticheta={sursa.detaliu}>
                <input value={date.sursaDetaliu} onChange={seteaza('sursaDetaliu')} className={inputClass} />
              </Camp>

              <Camp eticheta="Status">
                <select value={date.status} onChange={seteaza('status')} className={inputClass}>
                  {STATUSURI.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.emoji} {s.label}
                    </option>
                  ))}
                </select>
              </Camp>
              <Camp eticheta="Responsabil">
                <select value={date.responsabilId} onChange={seteaza('responsabilId')} className={inputClass}>
                  <option value="">Nimeni</option>
                  {echipa.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name || o.email}
                    </option>
                  ))}
                </select>
              </Camp>

              <Camp eticheta="Recontactare" latime="sm:col-span-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="datetime-local"
                    value={date.nextFollowUpAt}
                    onChange={seteaza('nextFollowUpAt')}
                    className={`${inputClass} w-auto`}
                  />
                  {[1, 3, 7].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setDate((d) => ({ ...d, nextFollowUpAt: pesteZile(z) }))}
                      className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
                    >
                      +{z}z
                    </button>
                  ))}
                  {date.nextFollowUpAt && (
                    <button
                      type="button"
                      onClick={() => setDate((d) => ({ ...d, nextFollowUpAt: '' }))}
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      șterge
                    </button>
                  )}
                </div>
              </Camp>

              {!editare && (
                <Camp eticheta="Notiță" latime="sm:col-span-2">
                  <textarea
                    value={date.nota}
                    onChange={seteaza('nota')}
                    rows={2}
                    placeholder="Ce știm despre ei, cine i-a recomandat, ce vor..."
                    className={inputClass}
                  />
                </Camp>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 rounded-b-2xl border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={onInchide}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Renunță
            </button>
            <button
              type="submit"
              disabled={salveaza}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {salveaza ? 'Se salvează…' : editare ? 'Salvează' : 'Adaugă lead-ul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Camp({ eticheta, ajutor, latime = '', children }) {
  return (
    <label className={`block ${latime}`}>
      <span className="mb-1 block text-xs font-medium text-gray-700">
        {eticheta}
        {ajutor && <span className="ml-1 font-normal text-gray-400">· {ajutor}</span>}
      </span>
      {children}
    </label>
  )
}
