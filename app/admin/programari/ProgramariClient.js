'use client'

/**
 * Calendarul de programări: zi, săptămână sau lună.
 * Programările sunt cu oricine (antreprenori, clienți) — opțional legate de
 * un lead sau de un proiect. Reminderele merg pe Telegram doar la echipă.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import { STATUSURI_PROGRAMARE, STATUSURI_PROGRAMARE_INCHISE, statusProgramare, PRESETURI_REMINDER } from '@/lib/lucru/constante'
import {
  cheieZi,
  adaugaZile,
  inceputSaptamana,
  eticheta,
  oraLocala,
  numeZi,
  numeLuna,
} from '@/lib/lucru/timp'
import { cere, clsBtn, clsBtnAlb, Modal, InsignaStatusProgramare, InsignaCategorie, Gol } from '@/components/admin/lucru/ui'
import FormularProgramare from '@/components/admin/lucru/FormularProgramare'
import Categorii from '@/components/admin/lucru/Categorii'
import { LinkuriNavigare } from '@/components/admin/lucru/Harti'

const CHEIE_VEDERE = 'pyweb.programari.vedere'

function intervalVedere(vedere, zi) {
  if (vedere === 'zi') return { de: zi, pana: zi }
  if (vedere === 'saptamana') {
    const luni = inceputSaptamana(zi)
    return { de: luni, pana: adaugaZile(luni, 6) }
  }
  // Luna întreagă, plus zilele din săptămânile de margine
  const [a, l] = zi.split('-')
  const prima = `${a}-${l}-01`
  const de = inceputSaptamana(prima)
  return { de, pana: adaugaZile(de, 41) }
}

function telefonWhatsApp(tel) {
  const c = String(tel || '').replace(/\D/g, '')
  if (!c) return null
  if (c.startsWith('0') && c.length === 9) return `373${c.slice(1)}`
  return c
}

function Card({ p, onDeschide, compact = false }) {
  const inchisa = STATUSURI_PROGRAMARE_INCHISE.includes(p.status)
  const culoare = p.category?.color || '#6366f1'
  return (
    <button
      type="button"
      onClick={() => onDeschide(p)}
      className={`w-full rounded-lg border bg-white text-left shadow-sm transition hover:border-indigo-300 hover:shadow ${inchisa ? 'opacity-60' : ''} ${compact ? 'px-2 py-1' : 'px-2.5 py-2'}`}
      style={{ borderLeft: `3px solid ${culoare}` }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-gray-900">{oraLocala(p.startAt)}</span>
        {!compact && <span className="text-[10px] text-gray-400">–{oraLocala(p.endAt)}</span>}
        <span className="ml-auto text-[11px]">{statusProgramare(p.status).emoji}</span>
      </div>
      <p className={`truncate font-medium text-gray-900 ${compact ? 'text-[11px]' : 'text-xs'} ${p.status === 'CANCELLED' ? 'line-through' : ''}`}>
        {p.contactName}
        {p.company && p.company !== p.contactName && <span className="font-normal text-gray-500"> · {p.company}</span>}
      </p>
      {!compact && <p className="truncate text-[11px] text-gray-500">{p.title}</p>}
    </button>
  )
}

export default function ProgramariClient({
  eu,
  esteSuperAdmin,
  echipa,
  categoriiInitiale,
  poateCrea,
  poateEdita,
  poateSterge,
  ziInitiala,
}) {
  const azi = cheieZi()
  const [zi, setZi] = useState(ziInitiala || azi)
  const [vedere, setVedere] = useState('saptamana')
  const [responsabil, setResponsabil] = useState('')
  const [q, setQ] = useState('')
  const [date, setDate] = useState({ programari: [], urmatoare: [] })
  const [incarc, setIncarc] = useState(true)
  const [categorii, setCategorii] = useState(categoriiInitiale)
  const [formular, setFormular] = useState(null) // { programare? , implicit? }
  const [deschisa, setDeschisa] = useState(null)
  const [arataCategorii, setArataCategorii] = useState(false)

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])

  useEffect(() => {
    try {
      const v = localStorage.getItem(CHEIE_VEDERE)
      if (['zi', 'saptamana', 'luna'].includes(v)) setVedere(ziInitiala ? 'zi' : v)
      else if (ziInitiala) setVedere('zi')
    } catch {
      if (ziInitiala) setVedere('zi')
    }
  }, [ziInitiala])

  const { de, pana } = intervalVedere(vedere, zi)

  const incarca = useCallback(async () => {
    setIncarc(true)
    try {
      const p = new URLSearchParams({ de, pana })
      if (responsabil) p.set('responsabil', responsabil)
      if (q.trim()) p.set('q', q.trim())
      setDate(await cere(`/api/admin/programari?${p}`))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIncarc(false)
    }
  }, [de, pana, responsabil, q])

  useEffect(() => {
    const t = setTimeout(incarca, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [incarca, q])

  function schimbaVedere(v) {
    setVedere(v)
    try {
      localStorage.setItem(CHEIE_VEDERE, v)
    } catch {
      /* fără stocare */
    }
  }

  function muta(directie) {
    if (vedere === 'zi') setZi(adaugaZile(zi, directie))
    else if (vedere === 'saptamana') setZi(adaugaZile(zi, 7 * directie))
    else {
      const [a, l] = zi.split('-').map(Number)
      const d = new Date(Date.UTC(a, l - 1 + directie, 1, 12))
      setZi(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`)
    }
  }

  const peZi = useMemo(() => {
    const m = {}
    for (const p of date.programari) (m[p.dateKey] ||= []).push(p)
    return m
  }, [date.programari])

  const titlu = useMemo(() => {
    if (vedere === 'zi') return eticheta(zi, azi)
    if (vedere === 'saptamana') {
      const [, l1, z1] = de.split('-').map(Number)
      const [, l2, z2] = pana.split('-').map(Number)
      return l1 === l2 ? `${z1}–${z2} ${numeLuna(l1 - 1, true)}` : `${z1} ${numeLuna(l1 - 1)} – ${z2} ${numeLuna(l2 - 1)}`
    }
    const [a, l] = zi.split('-').map(Number)
    return `${numeLuna(l - 1, true)} ${a}`
  }, [vedere, zi, de, pana, azi])

  const poateModifica = (p) => poateEdita || esteSuperAdmin || p.creatorId === eu || p.responsabilId === eu

  async function schimbaStatus(p, status) {
    try {
      const { programare } = await cere(`/api/admin/programari/${p.id}`, { metoda: 'PATCH', corp: { status } })
      toast.success(`${statusProgramare(status).emoji} ${statusProgramare(status).label}`)
      setDeschisa((d) => (d?.id === p.id ? { ...d, ...programare } : d))
      incarca()
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function sterge(p) {
    if (!confirm(`Ștergi programarea cu ${p.contactName} (${eticheta(p.dateKey, azi)}, ${oraLocala(p.startAt)})?`)) return
    try {
      await cere(`/api/admin/programari/${p.id}`, { metoda: 'DELETE' })
      toast.success('Programare ștearsă')
      setDeschisa(null)
      incarca()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const programareNoua = (implicit = {}) => setFormular({ implicit: { dateKey: zi < azi ? azi : zi, ...implicit } })

  // ── Vederi ─────────────────────────────────────────────────────

  const zileSaptamana = Array.from({ length: 7 }, (_, i) => adaugaZile(de, i))

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-gray-900">Programări</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setArataCategorii(true)} className={clsBtnAlb}>
            🏷️ Categorii
          </button>
          {poateCrea && (
            <button type="button" onClick={() => programareNoua()} className={clsBtn}>
              <PlusIcon className="h-4 w-4" /> Programare
            </button>
          )}
        </div>
      </div>

      {/* ── Ce urmează ─────────────────────────────────────── */}
      {date.urmatoare.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {date.urmatoare.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setDeschisa(p)}
              className="min-w-[200px] shrink-0 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-left hover:border-indigo-300"
            >
              <p className="text-[11px] font-semibold text-indigo-700">
                {eticheta(p.dateKey, azi).split(' · ')[0]} · {oraLocala(p.startAt)}
              </p>
              <p className="truncate text-sm font-medium text-gray-900">{p.contactName}</p>
              <p className="truncate text-[11px] text-gray-500">{p.title}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Navigare + filtre ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => muta(-1)} className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50" aria-label="Înapoi">
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setZi(azi)} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold hover:bg-gray-50">
            Azi
          </button>
          <button type="button" onClick={() => muta(1)} className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50" aria-label="Înainte">
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <span className="ml-1 text-sm font-semibold capitalize text-gray-900">{titlu}</span>
          {incarc && <span className="ml-1 text-xs text-gray-400">…</span>}
        </div>
        <div className="ml-auto inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {[
            ['zi', 'Zi'],
            ['saptamana', 'Săptămână'],
            ['luna', 'Lună'],
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
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <select
            value={responsabil}
            onChange={(e) => setResponsabil(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700"
          >
            <option value="">👥 Toată echipa</option>
            <option value="eu">👤 Doar ale mele</option>
            {echipa
              .filter((o) => o.id !== eu)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
          </select>
          <div className="relative flex-1 sm:w-56 sm:flex-none">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Caută nume, firmă, telefon…"
              className="w-full rounded-lg border border-gray-300 py-1.5 pl-7 pr-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {vedere === 'zi' && (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          {(peZi[zi] || []).length ? (
            <div className="space-y-2">
              {peZi[zi].map((p) => (
                <div key={p.id} className="flex gap-3">
                  <div className="w-14 shrink-0 pt-2 text-right text-xs font-bold text-gray-500">{oraLocala(p.startAt)}</div>
                  <div className="flex-1">
                    <Card p={p} onDeschide={setDeschisa} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Gol emoji="📅" titlu="Nicio programare în ziua asta">
              {poateCrea && (
                <button type="button" onClick={() => programareNoua({ dateKey: zi })} className={clsBtn}>
                  <PlusIcon className="h-4 w-4" /> Adaugă
                </button>
              )}
            </Gol>
          )}
        </div>
      )}

      {vedere === 'saptamana' && (
        <div className="grid gap-2 md:grid-cols-7">
          {zileSaptamana.map((k) => {
            const lista = peZi[k] || []
            const eAzi = k === azi
            return (
              <div key={k} className={`flex min-h-[90px] flex-col rounded-xl border bg-white md:min-h-[260px] ${eAzi ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-gray-200'}`}>
                <div className={`flex items-center justify-between rounded-t-xl border-b px-2 py-1.5 ${eAzi ? 'border-indigo-100 bg-indigo-50' : 'border-gray-100 bg-gray-50/70'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setZi(k)
                      schimbaVedere('zi')
                    }}
                    className="text-left"
                  >
                    <span className={`text-[11px] font-semibold uppercase ${eAzi ? 'text-indigo-700' : 'text-gray-500'}`}>{numeZi(k, true)}</span>{' '}
                    <span className={`text-sm font-bold ${eAzi ? 'text-indigo-700' : 'text-gray-900'}`}>{Number(k.slice(8))}</span>
                  </button>
                  {poateCrea && k >= azi && (
                    <button type="button" onClick={() => programareNoua({ dateKey: k })} className="rounded p-0.5 text-gray-400 hover:bg-white hover:text-indigo-600" aria-label="Programare nouă">
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-1.5">
                  {lista.map((p) => (
                    <Card key={p.id} p={p} onDeschide={setDeschisa} />
                  ))}
                  {!lista.length && <p className="hidden py-4 text-center text-[10px] text-gray-300 md:block">liber</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {vedere === 'luna' && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center text-[11px] font-semibold uppercase text-gray-500">
            {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map((z) => (
              <div key={z} className="py-1.5">
                {z}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }, (_, i) => adaugaZile(de, i)).map((k) => {
              const lista = peZi[k] || []
              const inLuna = k.slice(0, 7) === zi.slice(0, 7)
              const eAzi = k === azi
              return (
                <div key={k} className={`min-h-[78px] border-b border-r border-gray-100 p-1 sm:min-h-[100px] ${inLuna ? '' : 'bg-gray-50/60'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setZi(k)
                      schimbaVedere('zi')
                    }}
                    className={`mb-0.5 inline-grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                      eAzi ? 'bg-indigo-600 text-white' : inLuna ? 'text-gray-800 hover:bg-gray-100' : 'text-gray-400'
                    }`}
                  >
                    {Number(k.slice(8))}
                  </button>
                  <div className="space-y-0.5">
                    {lista.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setDeschisa(p)}
                        className={`block w-full truncate rounded px-1 text-left text-[10px] font-medium ${STATUSURI_PROGRAMARE_INCHISE.includes(p.status) ? 'opacity-50' : ''}`}
                        style={{ background: `${p.category?.color || '#6366f1'}1a`, color: p.category?.color || '#4338ca' }}
                      >
                        {oraLocala(p.startAt)} {p.contactName}
                      </button>
                    ))}
                    {lista.length > 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          setZi(k)
                          schimbaVedere('zi')
                        }}
                        className="text-[10px] font-semibold text-indigo-600"
                      >
                        +{lista.length - 3} încă
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Detaliile unei programări ─────────────────────── */}
      {deschisa && (
        <Modal
          titlu={`${deschisa.title} · ${deschisa.contactName}`}
          subtitlu={`${eticheta(deschisa.dateKey, azi)}, ${oraLocala(deschisa.startAt)}–${oraLocala(deschisa.endAt)}`}
          onInchide={() => setDeschisa(null)}
          latime="max-w-lg"
          subsol={
            poateModifica(deschisa) ? (
              <>
                {(poateSterge || esteSuperAdmin || deschisa.creatorId === eu) && (
                  <button type="button" onClick={() => sterge(deschisa)} className={`${clsBtnAlb} mr-auto text-red-600 hover:bg-red-50`}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFormular({ programare: deschisa })
                    setDeschisa(null)
                  }}
                  className={clsBtnAlb}
                >
                  <PencilSquareIcon className="h-4 w-4" /> Editează / mută
                </button>
              </>
            ) : null
          }
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <InsignaStatusProgramare status={deschisa.status} />
            <InsignaCategorie categorie={deschisa.category} />
          </div>

          <div className="space-y-1.5 text-sm">
            <p>
              👤 <b>{deschisa.contactName}</b>
              {deschisa.company && <span className="text-gray-600"> · {deschisa.company}</span>}
            </p>
            {deschisa.contactPhone && (
              <div className="flex flex-wrap items-center gap-1.5">
                <a href={`tel:${deschisa.contactPhone}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50">
                  <PhoneIcon className="h-3.5 w-3.5" /> {deschisa.contactPhone}
                </a>
                {telefonWhatsApp(deschisa.contactPhone) && (
                  <a
                    href={`https://wa.me/${telefonWhatsApp(deschisa.contactPhone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-100"
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>
            )}
            {deschisa.contactEmail && (
              <a href={`mailto:${deschisa.contactEmail}`} className="block text-xs text-indigo-700 hover:underline">
                ✉️ {deschisa.contactEmail}
              </a>
            )}
            {deschisa.location && (
              <div className="space-y-1">
                <p>📍 {deschisa.location}</p>
                {!/online|zoom|meet|telefon|la noi/i.test(deschisa.location) && <LinkuriNavigare address={deschisa.location} mic />}
              </div>
            )}
            {deschisa.lead && (
              <p>
                🎯 Lead:{' '}
                <Link href="/admin/leads" className="font-medium text-indigo-700 hover:underline">
                  {deschisa.lead.denumire}
                </Link>
              </p>
            )}
            {deschisa.project && (
              <p>
                📁 Proiect:{' '}
                <Link href={`/admin/projects/${deschisa.project.id}`} className="font-medium text-indigo-700 hover:underline">
                  {deschisa.project.name}
                </Link>
              </p>
            )}
            {deschisa.responsabilId && <p>🙋 Merge: {nume[deschisa.responsabilId] || '—'}</p>}
            {deschisa.message && <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-2 text-xs text-gray-700">📝 {deschisa.message}</p>}
            {deschisa.reminderOffsets?.length > 0 && (
              <p className="text-[11px] text-gray-500">
                🔔{' '}
                {deschisa.reminderOffsets
                  .map((k) => {
                    const r = PRESETURI_REMINDER.find((x) => x.key === k)
                    return `${r?.label || k}${deschisa.remindersSent?.includes(k) ? ' ✓' : ''}`
                  })
                  .join(' · ')}
              </p>
            )}
          </div>

          {poateModifica(deschisa) && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
              {STATUSURI_PROGRAMARE.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={deschisa.status === s.value}
                  onClick={() => schimbaStatus(deschisa, s.value)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    deschisa.status === s.value ? `${s.culoare} ring-2 ring-indigo-300` : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {formular && (
        <FormularProgramare
          programare={formular.programare}
          implicit={formular.implicit}
          echipa={echipa}
          categorii={categorii}
          eu={eu}
          onInchide={() => setFormular(null)}
          onSalvat={incarca}
        />
      )}
      {arataCategorii && <Categorii categorii={categorii} onSchimbare={setCategorii} onInchide={() => setArataCategorii(false)} />}
    </div>
  )
}
