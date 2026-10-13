'use client'

/**
 * Caută un lead web (sau un proiect) de care să legi ceva.
 * `tipuri` = ['lead'] | ['proiect'] | ['lead', 'proiect'].
 */

import { useEffect, useRef, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { clsInput, cere } from './ui'

export default function CautaLegatura({ tipuri = ['lead', 'proiect'], valoare, onAlege, placeholder }) {
  const [q, setQ] = useState('')
  const [rez, setRez] = useState({ leaduri: [], proiecte: [] })
  const [deschis, setDeschis] = useState(false)
  const temporizator = useRef(null)

  useEffect(() => {
    clearTimeout(temporizator.current)
    if (q.trim().length < 2) return
    temporizator.current = setTimeout(async () => {
      try {
        setRez(await cere(`/api/admin/programari/legaturi?q=${encodeURIComponent(q.trim())}`))
        setDeschis(true)
      } catch {
        /* căutarea nu e critică */
      }
    }, 250)
    return () => clearTimeout(temporizator.current)
  }, [q])

  if (valoare) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm">
        <span className="shrink-0">{valoare.tip === 'lead' ? '🎯' : '📁'}</span>
        <span className="min-w-0 flex-1 truncate font-medium text-indigo-900">
          {valoare.nume}
          {valoare.detaliu && <span className="font-normal text-indigo-700"> · {valoare.detaliu}</span>}
        </span>
        <button type="button" onClick={() => onAlege(null)} className="rounded p-0.5 text-indigo-500 hover:bg-indigo-100" aria-label="Scoate legătura">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Sub 2 litere nu arătăm rezultatele vechi
  const scurt = q.trim().length < 2
  const leaduri = !scurt && tipuri.includes('lead') ? rez.leaduri : []
  const proiecte = !scurt && tipuri.includes('proiect') ? rez.proiecte : []

  return (
    <div className="relative">
      <input
        className={clsInput}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setDeschis(true)}
        onBlur={() => setTimeout(() => setDeschis(false), 150)}
        placeholder={placeholder || (tipuri.length > 1 ? 'Caută un lead sau un proiect…' : tipuri[0] === 'lead' ? 'Caută un lead (nume sau telefon)…' : 'Caută un proiect…')}
      />
      {deschis && (leaduri.length > 0 || proiecte.length > 0) && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {leaduri.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onAlege({ tip: 'lead', id: l.id, nume: l.denumire, detaliu: [l.oras, l.telefon].filter(Boolean).join(' · '), telefon: l.telefon, adresa: l.adresa, oras: l.oras })
                  setQ('')
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-indigo-50"
              >
                🎯 <span className="font-medium">{l.denumire}</span>
                <span className="text-xs text-gray-500"> · {[l.oras, l.telefon].filter(Boolean).join(' · ')}</span>
              </button>
            </li>
          ))}
          {proiecte.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onAlege({ tip: 'proiect', id: p.id, nume: p.name, detaliu: p.clientName || '', telefon: p.clientPhone, adresa: p.address, clientName: p.clientName })
                  setQ('')
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-indigo-50"
              >
                📁 <span className="font-medium">{p.name}</span>
                {p.clientName && <span className="text-xs text-gray-500"> · {p.clientName}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
