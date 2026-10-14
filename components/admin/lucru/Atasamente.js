'use client'

/**
 * Atașamentele unui task — „card" (pagina taskului, TaskAttachmentSection din
 * StefanPWA) sau „panou" (sub rândul din listă, TaskAttachmentsPanel).
 * Fișierul urcă direct din browser în Vercel Blob (până la 50 MB).
 */

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { upload } from '@vercel/blob/client'
import { TrashIcon } from '@heroicons/react/24/outline'
import { marimeFisier } from '@/lib/lucru/constante'
import { dataOra } from '@/lib/lucru/timp'
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

function iconita(a) {
  if (esteImagine(a)) return '🖼️'
  if (/pdf/i.test(a.mimeType || a.name)) return '📕'
  if (/zip|rar|7z/i.test(a.mimeType || a.name)) return '🗜️'
  if (/sheet|excel|xlsx?|csv/i.test(a.mimeType || a.name)) return '📊'
  if (/word|docx?/i.test(a.mimeType || a.name)) return '📝'
  return '📄'
}

export default function Atasamente({ taskId, initiale, varianta = 'card', poateSterge = () => true, onSchimbare }) {
  const [lista, setLista] = useState(initiale || null)
  const [progres, setProgres] = useState(null)
  const input = useRef(null)

  // În panoul din listă fișierele se încarcă abia la deschidere
  useEffect(() => {
    if (initiale) return
    let viu = true
    cere(`/api/admin/tasks/${taskId}`)
      .then(({ task }) => viu && setLista(task.attachments))
      .catch(() => viu && setLista([]))
    return () => {
      viu = false
    }
  }, [taskId, initiale])

  async function alege(e) {
    const fisiere = [...(e.target.files || [])]
    e.target.value = ''
    for (const [i, f] of fisiere.entries()) {
      try {
        setProgres({ nume: f.name, pct: 0, nr: i + 1, total: fisiere.length })
        const a = await urcaFisier(taskId, f, (pct) => setProgres((p) => ({ ...p, pct })))
        setLista((l) => [...(l || []), a])
        toast.success('Fișier încărcat')
      } catch (err) {
        toast.error(err.message || `Nu am putut urca ${f.name}`)
      }
    }
    setProgres(null)
    onSchimbare?.()
  }

  async function sterge(a) {
    if (!confirm(`Ștergi „${a.name}"?`)) return
    const vechi = lista
    setLista((l) => l.filter((x) => x.id !== a.id))
    try {
      await cere(`/api/admin/tasks/${taskId}/atasamente?aid=${a.id}`, { metoda: 'DELETE' })
      toast.success('Fișier șters')
      onSchimbare?.()
    } catch (e) {
      setLista(vechi)
      toast.error(e.message)
    }
  }

  const bara = progres && (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-[10px] text-ink-soft">
        <span className="truncate">
          {progres.total > 1 && `${progres.nr}/${progres.total} · `}
          {progres.nume}
        </span>
        <span>{progres.pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progres.pct}%` }} />
      </div>
    </div>
  )

  const inputFisier = <input ref={input} type="file" multiple className="sr-only" onChange={alege} disabled={Boolean(progres)} />

  if (varianta === 'panou') {
    return (
      <div className="border-t border-line bg-surface-2/40 px-3 py-2.5">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-[11px] font-semibold text-ink-soft">📎 Atașamente</p>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={Boolean(progres)}
            className="tap ml-auto inline-flex h-6 items-center gap-1 rounded-md border border-line px-2 text-[10px] font-medium text-ink-soft hover:bg-surface-2"
          >
            ＋ Adaugă
          </button>
          {inputFisier}
        </div>
        {bara}
        {lista === null ? (
          <p className="text-[11px] text-ink-soft">Se încarcă…</p>
        ) : !lista.length ? (
          <p className="text-[11px] text-ink-soft">Niciun atașament.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lista.map((a) => (
              <div key={a.id} className="group relative flex max-w-[120px] flex-col items-center gap-1 rounded-lg border border-line bg-surface p-1.5">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                  {esteImagine(a) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt="" className="h-16 w-16 rounded object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 flex-col items-center justify-center rounded bg-surface-2 text-2xl">{iconita(a)}</div>
                  )}
                </a>
                <span className="w-full truncate text-center text-[10px] text-ink-soft" title={a.name}>
                  {a.name}
                </span>
                {poateSterge(a) && (
                  <button
                    type="button"
                    onClick={() => sterge(a)}
                    className="absolute -right-1.5 -top-1.5 hidden size-5 place-items-center rounded-full bg-st-cancelled text-[10px] text-white group-hover:grid"
                    aria-label="Șterge"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="lcard p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">
          📎 Atașamente {lista?.length > 0 && `(${lista.length})`}
        </h2>
        <label className="tap cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-strong">
          {progres ? 'Se încarcă…' : '＋ Adaugă fișier'}
          {inputFisier}
        </label>
      </div>
      {bara}
      {!lista?.length ? (
        <p className="text-sm text-ink-soft">Niciun atașament.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
              {esteImagine(a) ? (
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt="" className="size-9 rounded-lg object-cover" />
                </a>
              ) : (
                <span className="text-xl leading-none">{iconita(a)}</span>
              )}
              <div className="min-w-0 flex-1">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-medium text-brand hover:underline">
                  {a.name}
                </a>
                <p className="text-[11px] text-ink-soft">
                  {marimeFisier(a.size)} · {a.userName || '—'} · {dataOra(a.createdAt)}
                </p>
              </div>
              {poateSterge(a) && (
                <button
                  type="button"
                  onClick={() => sterge(a)}
                  className="tap grid size-7 shrink-0 place-items-center rounded-lg text-st-cancelled hover:bg-surface-2"
                  title="Șterge"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
