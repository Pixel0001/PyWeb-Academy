'use client'

/** Proiectele: carduri sau hartă (Mapbox, cu clustere — ca în StefanPWA). */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PlusIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { STATUSURI_PROIECT } from '@/lib/lucru/constante'
import { relativ } from '@/lib/lucru/timp'
import { cere, clsBtn, InsignaStatusProiect, Ref, Avatar, Gol } from '@/components/admin/lucru/ui'
import FormularProiect from '@/components/admin/lucru/FormularProiect'
import { HartaProiecte } from '@/components/admin/lucru/Harti'

const CHEIE = 'pyweb.proiecte.vedere'

export default function ProiecteClient({ eu, echipa, poateCrea }) {
  const [proiecte, setProiecte] = useState([])
  const [incarc, setIncarc] = useState(true)
  const [statusuri, setStatusuri] = useState(['ACTIVE', 'ON_HOLD'])
  const [q, setQ] = useState('')
  const [vedere, setVedere] = useState('carduri')
  const [formular, setFormular] = useState(false)

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])

  useEffect(() => {
    try {
      const v = localStorage.getItem(CHEIE)
      if (v === 'harta') setVedere('harta')
    } catch {
      /* fără stocare */
    }
  }, [])

  const incarca = useCallback(async () => {
    setIncarc(true)
    try {
      const p = new URLSearchParams()
      if (statusuri.length) p.set('status', statusuri.join(','))
      if (q.trim()) p.set('q', q.trim())
      const { proiecte } = await cere(`/api/admin/projects?${p}`)
      setProiecte(proiecte)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIncarc(false)
    }
  }, [statusuri, q])

  useEffect(() => {
    const t = setTimeout(incarca, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [incarca, q])

  function schimbaVedere(v) {
    setVedere(v)
    try {
      localStorage.setItem(CHEIE, v)
    } catch {
      /* fără stocare */
    }
  }

  const comuta = (s) => setStatusuri((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]))
  const cuLocatie = proiecte.filter((p) => p.lat != null).length

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">Proiecte</h1>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{proiecte.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {[
              ['carduri', '▦ Carduri'],
              ['harta', `🗺️ Hartă${cuLocatie ? ` (${cuLocatie})` : ''}`],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => schimbaVedere(v)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${vedere === v ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
              >
                {l}
              </button>
            ))}
          </div>
          {poateCrea && (
            <button type="button" onClick={() => setFormular(true)} className={clsBtn}>
              <PlusIcon className="h-4 w-4" /> Proiect nou
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5">
        <div className="relative min-w-[200px] flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Caută după nume, client, adresă sau #număr…"
            className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUSURI_PROIECT.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => comuta(s.value)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                statusuri.includes(s.value) ? s.culoare : 'border-gray-200 text-gray-400'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.punct }} /> {s.label}
            </button>
          ))}
        </div>
      </div>

      {vedere === 'harta' ? (
        <HartaProiecte proiecte={proiecte} />
      ) : incarc && !proiecte.length ? (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !proiecte.length ? (
        <Gol emoji="📁" titlu="Niciun proiect" text="Un proiect adună taskurile, fișierele și programările unui client.">
          {poateCrea && (
            <button type="button" onClick={() => setFormular(true)} className={clsBtn}>
              <PlusIcon className="h-4 w-4" /> Proiect nou
            </button>
          )}
        </Gol>
      ) : (
        <div className={`grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 ${incarc ? 'opacity-60' : ''}`}>
          {proiecte.map((p) => {
            const pct = p.taskuri.total ? Math.round((p.taskuri.gata / p.taskuri.total) * 100) : 0
            return (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-3.5 transition hover:border-indigo-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Ref seq={p.seq} />
                      <InsignaStatusProiect status={p.status} />
                    </div>
                    <h3 className="mt-1.5 truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{p.name}</h3>
                  </div>
                  {p.responsabilId && nume[p.responsabilId] && <Avatar nume={nume[p.responsabilId]} />}
                </div>
                {(p.clientName || p.lead) && (
                  <p className="mt-1 truncate text-xs text-gray-600">
                    👤 {p.clientName || p.lead?.denumire}
                    {p.lead && <span className="text-gray-400"> · 🎯 lead</span>}
                  </p>
                )}
                {p.address && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                    <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                    {p.address}
                  </p>
                )}
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {p.taskuri.deschise} deschise · {p.taskuri.gata}/{p.taskuri.total} gata
                    </span>
                    <span>{relativ(p.updatedAt)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-gray-100">
                    <div className="h-1.5 rounded bg-green-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {formular && <FormularProiect echipa={echipa} eu={eu} onInchide={() => setFormular(false)} onSalvat={incarca} />}
    </div>
  )
}
