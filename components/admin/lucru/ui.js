'use client'

/**
 * Bucăți de interfață comune pentru Taskuri, Kanban, Proiecte, Programări și
 * Calendar — copiate după StefanPWA (aceleași forme și dimensiuni), cu
 * culorile PyWeb (tokenii brand / ink / line / st-* din globals.css).
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon, EllipsisVerticalIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export const dlgInput =
  'h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-ink outline-none focus:border-brand'
export const dlgTextarea =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand'
export const lbl = 'mb-1 block text-xs font-semibold text-ink-soft'
export const btnSalveaza =
  'tap h-12 w-full rounded-xl bg-brand font-semibold text-white hover:bg-brand-strong disabled:opacity-60'
export const btnContur =
  'tap h-9 shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 text-xs text-ink-soft hover:bg-surface-2'
export const btnIcon =
  'tap grid size-8 shrink-0 place-items-center rounded-lg border border-line text-ink-soft hover:bg-surface-2'
export const cautareCls =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-brand'

/** Select de filtru: se colorează când are o valoare aleasă. */
export const fldCls = (val) =>
  `h-9 min-w-0 max-w-full appearance-none sel-arrow rounded-lg border pl-2 pr-7 text-xs outline-none focus:border-brand ${
    val ? 'border-brand bg-brand/10 font-semibold text-brand' : 'border-line bg-surface text-ink'
  }`

/** Pastilă (scope / vedere): plină când e activă. */
export const pastila = (activ) =>
  `tap shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${activ ? 'bg-brand text-white' : 'lcard text-ink-soft'}`

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

/** Dialogul din StefanPWA: foaie de jos pe telefon, card centrat pe desktop. */
export function Dialog({ titlu, onInchide, children, latime = 'max-w-lg' }) {
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
    <div
      className="lucru fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onInchide()}
    >
      <div className={`lcard max-h-[92dvh] w-full ${latime} overflow-auto rounded-b-none rounded-t-2xl p-5 text-ink sm:rounded-2xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">{titlu}</h2>
          <button
            type="button"
            onClick={onInchide}
            className="tap grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-surface-2"
            aria-label="Închide"
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Meniu flotant (portal), închis la clic în afară sau la scroll. */
function useMeniuFlotant() {
  const [deschis, setDeschis] = useState(false)
  const [poz, setPoz] = useState({ top: 0, left: 0, minWidth: 0 })
  const buton = useRef(null)

  useEffect(() => {
    if (!deschis) return
    const inchide = () => setDeschis(false)
    document.addEventListener('mousedown', inchide)
    window.addEventListener('scroll', inchide, true)
    return () => {
      document.removeEventListener('mousedown', inchide)
      window.removeEventListener('scroll', inchide, true)
    }
  }, [deschis])

  function comuta(e, aliniereDreapta = false) {
    e.stopPropagation()
    e.preventDefault()
    const r = buton.current?.getBoundingClientRect()
    if (r) {
      const latime = Math.max(r.width, 160)
      setPoz({
        top: r.bottom + 4,
        left: aliniereDreapta ? Math.max(8, r.right - latime) : Math.min(r.left, window.innerWidth - latime - 8),
        minWidth: latime,
      })
    }
    setDeschis((d) => !d)
  }
  return { deschis, setDeschis, poz, buton, comuta }
}

/**
 * Pastila de status care deschide lista de statusuri (StatusDropdown din StefanPWA).
 * optiuni = [{ value, label, dot }], badge = clasele pastilei curente.
 */
export function StatusDropdown({ status, eticheta, badge, optiuni, onChange, pending = false }) {
  const { deschis, setDeschis, poz, buton, comuta } = useMeniuFlotant()
  return (
    <>
      <button
        ref={buton}
        type="button"
        disabled={pending}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => comuta(e)}
        className={`h-7 shrink-0 rounded-full px-2.5 text-[11px] font-semibold transition-opacity disabled:opacity-50 ${badge}`}
      >
        {eticheta}
      </button>
      {deschis &&
        createPortal(
          <div
            style={{ position: 'fixed', top: poz.top, left: poz.left, minWidth: poz.minWidth, zIndex: 9999 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="lucru rounded-xl border border-line bg-surface p-1 shadow-xl"
          >
            {optiuni.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(o.value)
                  setDeschis(false)
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] font-medium hover:bg-surface-2 ${o.value === status ? 'font-bold' : ''}`}
              >
                <span className={`size-2 shrink-0 rounded-full ${o.dot}`} />
                <span className={o.value === status ? 'text-ink' : 'text-ink-soft'}>{o.label}</span>
                {o.value === status && <span className="ml-auto text-[10px] text-brand">✓</span>}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

/** Meniul „⋮" de pe telefon (CardActionsMenu din StefanPWA). */
export function MeniuActiuni({ items, className = '' }) {
  const { deschis, setDeschis, poz, buton, comuta } = useMeniuFlotant()
  if (!items.length) return null
  return (
    <>
      <button ref={buton} type="button" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => comuta(e, true)} className={`${btnIcon} ${className}`} aria-label="Acțiuni">
        <EllipsisVerticalIcon className="size-4" />
      </button>
      {deschis &&
        createPortal(
          <div
            style={{ position: 'fixed', top: poz.top, left: poz.left, minWidth: poz.minWidth, zIndex: 9999 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="lucru rounded-xl border border-line bg-surface p-1 shadow-xl"
          >
            {items.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeschis(false)
                  it.onClick()
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium hover:bg-surface-2 ${it.pericol ? 'text-st-cancelled' : 'text-ink'}`}
              >
                {it.icon}
                {it.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

function butoanePagini(curenta, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pagini = new Set([1, total])
  for (let i = Math.max(2, curenta - 2); i <= Math.min(total - 1, curenta + 2); i++) pagini.add(i)
  const sortate = [...pagini].sort((a, b) => a - b)
  const rez = []
  sortate.forEach((p, i) => {
    if (i > 0 && p - sortate[i - 1] > 1) rez.push('…')
    rez.push(p)
  })
  return rez
}

/** Paginarea numerică cu „20 / pag." (ca în StefanPWA). */
export function Paginare({ pagina, totalPagini, onPagina, marime, onMarime }) {
  if (totalPagini <= 1 && !marime) return null
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
      <button
        disabled={pagina <= 1}
        onClick={() => onPagina(pagina - 1)}
        className="tap grid size-9 place-items-center rounded-lg border border-line text-ink-soft hover:bg-surface-2 disabled:opacity-40"
        aria-label="Înapoi"
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      {butoanePagini(pagina, totalPagini).map((b, i) =>
        b === '…' ? (
          <span key={`e${i}`} className="flex h-9 w-6 items-center justify-center text-sm text-ink-soft">
            …
          </span>
        ) : (
          <button
            key={b}
            onClick={() => onPagina(b)}
            className={`tap h-9 min-w-[36px] rounded-lg px-2.5 text-sm font-medium ${
              b === pagina ? 'bg-brand text-white' : 'border border-line text-ink hover:bg-surface-2'
            }`}
          >
            {b}
          </button>
        )
      )}
      <button
        disabled={pagina >= totalPagini}
        onClick={() => onPagina(pagina + 1)}
        className="tap grid size-9 place-items-center rounded-lg border border-line text-ink-soft hover:bg-surface-2 disabled:opacity-40"
        aria-label="Înainte"
      >
        <ChevronRightIcon className="size-4" />
      </button>
      {onMarime && (
        <select
          value={marime || '20'}
          onChange={(e) => onMarime(e.target.value)}
          className="ml-2 h-9 rounded-lg border border-line bg-surface px-2 text-xs outline-none focus:border-brand"
          title="Pe pagină"
        >
          {['20', '50', '100', '200', '500'].map((n) => (
            <option key={n} value={n}>
              {n} / pag.
            </option>
          ))}
          <option value="all">Toate</option>
        </select>
      )}
    </div>
  )
}

/** Linie de încărcare subțire, ca în StefanPWA. */
export function BaraIncarcare({ activ }) {
  if (!activ) return null
  return <div className="mb-2 h-0.5 animate-pulse rounded-full bg-brand opacity-60" />
}

export function Gol({ children }) {
  return <div className="lcard grid place-items-center p-8 text-center text-sm text-ink-soft">{children}</div>
}

/** Rând de detaliu „ETICHETĂ / valoare" (MetaRow din StefanPWA). */
export function MetaRow({ eticheta, valoare, alerta = false, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">{eticheta}</p>
      {children || <p className={`break-words text-sm font-medium ${alerta ? 'text-st-cancelled' : 'text-ink'}`}>{valoare}</p>}
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

/** Titlul paginii (în StefanPWA e în bara de sus). */
export function TitluPagina({ children, dreapta }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-lg font-bold text-ink lg:text-xl">{children}</h1>
      {dreapta}
    </div>
  )
}
