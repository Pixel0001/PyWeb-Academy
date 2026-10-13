'use client'

/**
 * Atașamentele unui task. Fișierul urcă direct din browser în Vercel Blob
 * (până la 50 MB), apoi îl legăm de task.
 */

import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { upload } from '@vercel/blob/client'
import { PaperClipIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { marimeFisier } from '@/lib/lucru/constante'
import { relativ } from '@/lib/lucru/timp'
import { cere } from './ui'

const MAX = 50 * 1024 * 1024

/** Urcă un fișier și îl atașează la task. Întoarce atașamentul salvat. */
export async function urcaFisier(taskId, fisier, laProgres) {
  if (fisier.size > MAX) throw new Error(`${fisier.name}: maxim 50 MB.`)
  const sigur = fisier.name.replace(/[^\w.\-]+/g, '_').slice(-80) || 'fisier'
  const blob = await upload(`tasks/${taskId}/${sigur}`, fisier, {
    access: 'public',
    handleUploadUrl: '/api/admin/tasks/upload',
    onUploadProgress: laProgres ? (e) => laProgres(Math.round(e.percentage)) : undefined,
  })
  const { atasament } = await cere(`/api/admin/tasks/${taskId}/atasamente`, {
    metoda: 'POST',
    corp: { name: fisier.name, url: blob.url, size: fisier.size, mimeType: fisier.type || null },
  })
  return atasament
}

const esteImagine = (a) => /^image\//.test(a.mimeType || '') || /\.(png|jpe?g|webp|gif|avif)$/i.test(a.name)

export default function Atasamente({ taskId, initiale = [], poateSterge = () => true, onSchimbare }) {
  const [lista, setLista] = useState(initiale)
  const [progres, setProgres] = useState(null)
  const input = useRef(null)

  async function alege(e) {
    const fisiere = [...(e.target.files || [])]
    e.target.value = ''
    for (const [i, f] of fisiere.entries()) {
      try {
        setProgres({ nume: f.name, pct: 0, nr: i + 1, total: fisiere.length })
        const a = await urcaFisier(taskId, f, (pct) => setProgres((p) => ({ ...p, pct })))
        setLista((l) => [a, ...l])
      } catch (err) {
        toast.error(err.message || `Nu am putut urca ${f.name}`)
      }
    }
    setProgres(null)
    onSchimbare?.()
  }

  async function sterge(a) {
    if (!confirm(`Ștergi „${a.name}"?`)) return
    try {
      await cere(`/api/admin/tasks/${taskId}/atasamente?aid=${a.id}`, { metoda: 'DELETE' })
      setLista((l) => l.filter((x) => x.id !== a.id))
      onSchimbare?.()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">📎 Fișiere {lista.length > 0 && `(${lista.length})`}</h3>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={Boolean(progres)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
        >
          <PaperClipIcon className="h-3.5 w-3.5" /> Adaugă
        </button>
        <input ref={input} type="file" multiple className="sr-only" onChange={alege} />
      </div>

      {progres && (
        <div className="mb-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-xs text-indigo-800">
          Urc {progres.total > 1 && `${progres.nr}/${progres.total} · `}
          {progres.nume} — {progres.pct}%
          <div className="mt-1 h-1 rounded bg-indigo-100">
            <div className="h-1 rounded bg-indigo-500 transition-all" style={{ width: `${progres.pct}%` }} />
          </div>
        </div>
      )}

      {lista.length === 0 ? (
        <p className="text-xs text-gray-400">Niciun fișier. Poți urca poze, PDF-uri, arhive (max 50 MB).</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {lista.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
              {esteImagine(a) ? (
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt="" className="h-10 w-10 rounded object-cover" />
                </a>
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-gray-100 text-lg">📄</span>
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-xs font-medium text-gray-900 hover:text-indigo-700"
                >
                  {a.name}
                </a>
                <p className="truncate text-[11px] text-gray-500">
                  {marimeFisier(a.size)} · {a.userName || ''} · {relativ(a.createdAt)}
                </p>
              </div>
              <a href={a.url} download className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Descarcă">
                <ArrowDownTrayIcon className="h-4 w-4" />
              </a>
              {poateSterge(a) && (
                <button type="button" onClick={() => sterge(a)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Șterge">
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
