'use client'

/**
 * Alegerea datei și orei de recontactare.
 *
 * Butoanele rapide acoperă 90% din cazuri („mâine", „peste 3 zile"), iar
 * câmpul de dată e acolo pentru restul. Ora implicită e 10:00 — dimineața,
 * când firmele mici răspund cel mai bine la telefon.
 */

import { formateazaFollowUp, stareFollowUp, STILURI_FOLLOWUP } from '@/lib/leads/statusuri'

const ORA_IMPLICITA = 10

const RAPIDE = [
  { eticheta: 'Mâine', zile: 1 },
  { eticheta: 'Peste 3 zile', zile: 3 },
  { eticheta: 'Peste o săptămână', zile: 7 },
  { eticheta: 'Peste 2 săptămâni', zile: 14 },
]

/** Data locală în formatul cerut de <input type="datetime-local">. */
function laInputLocal(valoare) {
  if (!valoare) return ''
  const d = new Date(valoare)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function FollowUpPicker({ valoare, onChange, disabled = false }) {
  const stare = stareFollowUp(valoare)
  const stil = stare ? STILURI_FOLLOWUP[stare] : null

  function pesteZile(zile) {
    const d = new Date()
    d.setDate(d.getDate() + zile)
    d.setHours(ORA_IMPLICITA, 0, 0, 0)
    onChange(d.toISOString())
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-700">Recontactează:</span>

        {valoare ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${stil?.color || ''}`}
          >
            {stil?.emoji} {formateazaFollowUp(valoare)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">nesetat</span>
        )}

        {valoare && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(null)}
            className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50"
          >
            șterge
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {RAPIDE.map((r) => (
          <button
            key={r.zile}
            type="button"
            disabled={disabled}
            onClick={() => pesteZile(r.zile)}
            className="rounded-lg bg-white px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-300 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-300 disabled:opacity-50"
          >
            {r.eticheta}
          </button>
        ))}

        <input
          type="datetime-local"
          value={laInputLocal(valoare)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>
    </div>
  )
}
