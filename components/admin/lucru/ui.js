'use client'

/**
 * Bucăți mici de interfață comune pentru Taskuri, Kanban, Proiecte și Programări.
 */

import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  statusTask,
  prioritate,
  statusProiect,
  statusProgramare,
  refScurt,
} from '@/lib/lucru/constante'

export const clsInput =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50'
export const clsEticheta = 'mb-1 block text-xs font-semibold text-gray-600'
export const clsBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60'
export const clsBtnAlb =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60'
export const clsChip =
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors'

/** fetch + JSON + mesajul de eroare al serverului. */
export async function cere(url, { metoda = 'GET', corp, ...rest } = {}) {
  const r = await fetch(url, {
    method: metoda,
    headers: corp !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: corp !== undefined ? JSON.stringify(corp) : undefined,
    ...rest,
  })
  const date = await r.json().catch(() => ({}))
  if (!r.ok) {
    const e = new Error(date.error || `Eroare ${r.status}`)
    e.status = r.status
    e.date = date
    throw e
  }
  return date
}

export function Modal({ titlu, subtitlu, onInchide, children, latime = 'max-w-2xl', subsol }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onInchide()
    window.addEventListener('keydown', esc)
    const veche = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = veche
    }
  }, [onInchide])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-2 sm:p-6">
        <div className="fixed inset-0 bg-black/50" onClick={onInchide} />
        <div role="dialog" aria-modal="true" aria-label={titlu} className={`relative my-2 w-full ${latime} rounded-2xl bg-white shadow-xl sm:my-4`}>
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 rounded-t-2xl border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg">{titlu}</h2>
              {subtitlu && <p className="text-xs text-gray-500">{subtitlu}</p>}
            </div>
            <button type="button" onClick={onInchide} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Închide">
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="space-y-4 p-4 sm:p-6">{children}</div>
          {subsol && (
            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              {subsol}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function InsignaStatusTask({ status, mic = false }) {
  const s = statusTask(status)
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border ${mic ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-[11px]'} font-semibold ${s.culoare}`}>
      {s.emoji} {s.label}
    </span>
  )
}

export function InsignaPrioritate({ valoare, mic = false }) {
  const p = prioritate(valoare)
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full ${mic ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-[11px]'} font-semibold ${p.culoare}`}>
      {p.emoji} {p.label}
    </span>
  )
}

export function InsignaStatusProiect({ status }) {
  const s = statusProiect(status)
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${s.culoare}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.punct }} /> {s.label}
    </span>
  )
}

export function InsignaStatusProgramare({ status }) {
  const s = statusProgramare(status)
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${s.culoare}`}>
      {s.emoji} {s.label}
    </span>
  )
}

export function InsignaCategorie({ categorie }) {
  if (!categorie) return null
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `${categorie.color}1a`, color: categorie.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: categorie.color }} />
      {categorie.name}
    </span>
  )
}

export function Ref({ seq }) {
  if (seq == null) return null
  return <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-indigo-600">{refScurt(seq)}</span>
}

/** Inițialele cuiva, într-un cerculeț. */
export function Avatar({ nume, mic = false }) {
  const init = String(nume || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span
      title={nume}
      className={`inline-grid shrink-0 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700 ring-2 ring-white ${mic ? 'h-5 w-5 text-[9px]' : 'h-7 w-7 text-[11px]'}`}
    >
      {init || '?'}
    </span>
  )
}

export function Avatare({ ids, nume, mic = true, max = 3 }) {
  const lista = (ids || []).filter((id) => nume[id])
  if (!lista.length) return null
  return (
    <span className="inline-flex -space-x-1.5">
      {lista.slice(0, max).map((id) => (
        <Avatar key={id} nume={nume[id]} mic={mic} />
      ))}
      {lista.length > max && (
        <span className="inline-grid h-5 w-5 place-items-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-600 ring-2 ring-white">
          +{lista.length - max}
        </span>
      )}
    </span>
  )
}

export function Gol({ emoji = '📭', titlu, text, children }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <div className="text-3xl">{emoji}</div>
      <p className="mt-2 text-sm font-semibold text-gray-800">{titlu}</p>
      {text && <p className="mt-1 text-xs text-gray-500">{text}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}

export function AccesInterzis({ permisiune }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h1 className="text-lg font-semibold text-red-900">Acces restricționat</h1>
      <p className="mt-1 text-sm text-red-700">
        Nu ai permisiunea <code className="font-mono">{permisiune}</code>. Cere-i unui SUPERADMIN să ți-o acorde din
        Securitate → Permisiuni.
      </p>
    </div>
  )
}
