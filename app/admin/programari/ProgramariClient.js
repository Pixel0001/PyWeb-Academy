'use client'

/**
 * Programările — AppointmentsManager din StefanPWA: vederi Azi / Mâine /
 * Săptămâna / Listă, căutare + status + categorie, butonul mare de
 * adăugare, rânduri cu ora, statusul și detaliile la clic.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ChevronRightIcon, TrashIcon, PencilIcon, PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline'
import { STATUSURI_PROGRAMARE, ST_PROGRAMARE, statusProgramare, linkuriHarta, PRESETURI_REMINDER } from '@/lib/lucru/constante'
import { cheieZi, adaugaZile, inceputSaptamana, eticheta, oraLocala } from '@/lib/lucru/timp'
import { cere, fldCls, pastila, btnContur, btnIcon, StatusDropdown, BaraIncarcare, Gol, TitluPagina } from '@/components/admin/lucru/ui'
import FormularProgramare from '@/components/admin/lucru/FormularProgramare'
import Categorii from '@/components/admin/lucru/Categorii'

const VEDERI = [
  { key: 'azi', label: 'Azi' },
  { key: 'maine', label: 'Mâine' },
  { key: 'saptamana', label: 'Săptămâna' },
  { key: 'lista', label: 'Listă' },
]
const OPTIUNI_STATUS = STATUSURI_PROGRAMARE.map((s) => ({ value: s.value, label: s.label, dot: ST_PROGRAMARE[s.value].dot }))
const CHEIE = 'filters:appointments'

function interval(vedere, zi) {
  const azi = cheieZi()
  if (vedere === 'maine') return { de: adaugaZile(azi, 1), pana: adaugaZile(azi, 1), grupat: false }
  if (vedere === 'saptamana') {
    const luni = inceputSaptamana(azi)
    return { de: luni, pana: adaugaZile(luni, 6), grupat: true }
  }
  if (vedere === 'lista') return { de: azi, pana: adaugaZile(azi, 13), grupat: true }
  if (vedere === 'zi' && zi) return { de: zi, pana: zi, grupat: false }
  return { de: azi, pana: azi, grupat: false }
}

const telefonWa = (tel) => {
  const c = String(tel || '').replace(/\D/g, '')
  if (!c) return null
  return c.startsWith('0') && c.length === 9 ? `373${c.slice(1)}` : c
}

function Programare({ p, nume, eu, poate, poateSterge, onStatus, onSterge, onEditeaza }) {
  const [deschis, setDeschis] = useState(false)
  const [ocupat, setOcupat] = useState(false)
  const nav = p.location && !/online|zoom|meet|telefon|la noi/i.test(p.location) ? linkuriHarta({ address: p.location }) : null
  const wa = telefonWa(p.contactPhone)

  async function schimba(s) {
    if (s === p.status) return
    setOcupat(true)
    await onStatus(p, s)
    setOcupat(false)
  }

  return (
    <div className={`lcard overflow-hidden ${ocupat ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap">
        <button type="button" onClick={() => setDeschis((d) => !d)} className="min-w-0 basis-full text-left sm:basis-0 sm:flex-1">
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand">{oraLocala(p.startAt)}</span>
            <span className="min-w-0 truncate text-sm font-medium">
              {p.contactName}
              {p.company && p.company !== p.contactName && <span className="font-normal text-ink-soft"> · {p.company}</span>}
            </span>
            {p.category && (
              <span className="hidden shrink-0 items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-soft sm:inline-flex">
                <span className="size-1.5 rounded-full" style={{ background: p.category.color }} />
                {p.category.name}
              </span>
            )}
            <ChevronRightIcon className={`size-3.5 shrink-0 text-ink-soft transition-transform ${deschis ? 'rotate-90' : ''}`} />
          </div>
          <p className="flex items-center gap-1 text-[11px] text-ink-soft">
            <span>
              {oraLocala(p.startAt)}–{oraLocala(p.endAt)}
            </span>
            {p.title && <span>· {p.title}</span>}
            {p.responsabilId && p.responsabilId !== eu && nume[p.responsabilId] && <span>· {nume[p.responsabilId]}</span>}
            {p.reminderOffsets?.length > 0 && <PaperAirplaneIcon className="size-3" title="Reminder pe Telegram" />}
          </p>
        </button>

        <div className="flex flex-1 items-center justify-between gap-2 sm:flex-none sm:justify-end">
          {poate ? (
            <StatusDropdown
              status={p.status}
              eticheta={statusProgramare(p.status).label}
              badge={ST_PROGRAMARE[p.status].badge}
              optiuni={OPTIUNI_STATUS}
              pending={ocupat}
              onChange={schimba}
            />
          ) : (
            <span className={`h-7 rounded-full px-2.5 text-[11px] font-semibold leading-7 ${ST_PROGRAMARE[p.status].badge}`}>{statusProgramare(p.status).label}</span>
          )}
          <div className="flex items-center gap-2">
            {poate && (
              <button type="button" onClick={() => onEditeaza(p)} className={btnIcon} title="Editează / mută">
                <PencilIcon className="size-3.5" />
              </button>
            )}
            {poateSterge && (
              <button type="button" onClick={() => onSterge(p)} disabled={ocupat} className={`${btnIcon} !text-st-cancelled disabled:opacity-50`} title="Șterge">
                <TrashIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {deschis && (
        <div className="flex flex-col gap-1.5 border-t border-line bg-surface-2/40 px-3 py-2.5 text-[12px]">
          {p.contactPhone && (
            <div className="flex flex-wrap items-center gap-2">
              <a href={`tel:${p.contactPhone}`} className="inline-flex h-7 items-center rounded-lg border border-line bg-surface px-2.5 text-[11px] font-medium hover:bg-surface-2">
                📞 {p.contactPhone}
              </a>
              {wa && (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 items-center rounded-lg border border-line bg-surface px-2.5 text-[11px] font-medium hover:bg-surface-2"
                >
                  💬 WhatsApp
                </a>
              )}
            </div>
          )}
          {p.contactEmail && <p>✉️ {p.contactEmail}</p>}
          {p.location && (
            <div className="flex flex-wrap items-center gap-2">
              <span>📍 {p.location}</span>
              {nav && (
                <>
                  <a href={nav.waze} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                    Waze
                  </a>
                  <a href={nav.google} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                    Maps
                  </a>
                </>
              )}
            </div>
          )}
          {p.lead && (
            <p>
              🎯 Lead:{' '}
              <Link href="/admin/leads" className="font-medium text-brand hover:underline">
                {p.lead.denumire}
              </Link>
            </p>
          )}
          {p.project && (
            <p>
              📁 Proiect:{' '}
              <Link href={`/admin/projects/${p.project.id}`} className="font-medium text-brand hover:underline">
                {p.project.name}
              </Link>
            </p>
          )}
          {p.responsabilId && nume[p.responsabilId] && <p>🙋 Merge: {nume[p.responsabilId]}</p>}
          {p.message && <p className="whitespace-pre-wrap">📝 {p.message}</p>}
          {p.reminderOffsets?.length > 0 && (
            <p className="text-[11px] text-ink-soft">
              ✈ Remindere:{' '}
              {p.reminderOffsets
                .map((k) => `${PRESETURI_REMINDER.find((r) => r.key === k)?.label || k}${p.remindersSent?.includes(k) ? ' ✓' : ''}`)
                .join(' · ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProgramariClient({ eu, esteSuperAdmin, echipa, categoriiInitiale, poateCrea, poateEdita, poateSterge, ziInitiala }) {
  const [vedere, setVedere] = useState(ziInitiala ? 'zi' : 'azi')
  const [zi] = useState(ziInitiala)
  const [f, setF] = useState({ q: '', status: '', category: '', responsabil: '' })
  const [cautare, setCautare] = useState('')
  const [lista, setLista] = useState([])
  const [incarc, setIncarc] = useState(true)
  const [gata, setGata] = useState(false)
  const [categorii, setCategorii] = useState(categoriiInitiale)
  const [formular, setFormular] = useState(null)
  const [arataCategorii, setArataCategorii] = useState(false)
  const temporizator = useRef(null)

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])
  const azi = cheieZi()
  const { de, pana, grupat } = interval(vedere, zi)

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(CHEIE) || '{}')
      if (s.f) {
        setF((x) => ({ ...x, ...s.f }))
        setCautare(s.f.q || '')
      }
      if (s.vedere && !ziInitiala) setVedere(s.vedere)
    } catch {
      /* fără stocare */
    }
    setGata(true)
  }, [ziInitiala])

  const incarca = useCallback(async () => {
    if (!gata) return
    setIncarc(true)
    try {
      const p = new URLSearchParams({ de, pana })
      for (const [k, v] of Object.entries(f)) if (v) p.set(k, v)
      const r = await cere(`/api/admin/programari?${p}`)
      setLista(r.programari)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIncarc(false)
    }
  }, [de, pana, f, gata])

  useEffect(() => {
    incarca()
    if (!gata) return
    try {
      localStorage.setItem(CHEIE, JSON.stringify({ f, vedere: vedere === 'zi' ? 'azi' : vedere }))
    } catch {
      /* fără stocare */
    }
  }, [incarca, f, vedere, gata])

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const poateModifica = (p) => poateEdita || esteSuperAdmin || p.creatorId === eu || p.responsabilId === eu

  async function schimbaStatus(p, status) {
    try {
      await cere(`/api/admin/programari/${p.id}`, { metoda: 'PATCH', corp: { status } })
      setLista((l) => l.map((x) => (x.id === p.id ? { ...x, status } : x)))
      toast.success(`Status: ${statusProgramare(status).label}`)
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function sterge(p) {
    if (!confirm('Ștergi programarea?')) return
    const vechi = lista
    setLista((l) => l.filter((x) => x.id !== p.id))
    try {
      await cere(`/api/admin/programari/${p.id}`, { metoda: 'DELETE' })
      toast.success('Programare ștearsă')
    } catch (e) {
      setLista(vechi)
      toast.error(e.message)
    }
  }

  const peZile = useMemo(() => {
    const m = new Map()
    for (const p of lista) {
      if (!m.has(p.dateKey)) m.set(p.dateKey, [])
      m.get(p.dateKey).push(p)
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [lista])

  const areFiltre = Boolean(f.q || f.status || f.category || f.responsabil)
  const rand = (p) => (
    <Programare
      key={p.id}
      p={p}
      nume={nume}
      eu={eu}
      poate={poateModifica(p)}
      poateSterge={poateSterge || esteSuperAdmin || p.creatorId === eu}
      onStatus={schimbaStatus}
      onSterge={sterge}
      onEditeaza={(x) => setFormular({ programare: x })}
    />
  )

  return (
    <div className="lucru w-full text-ink">
      <TitluPagina
        dreapta={
          <div className="flex gap-2">
            <Link href="/admin/calendar" className={btnContur}>
              🗓️ Calendar
            </Link>
            <button type="button" onClick={() => setArataCategorii(true)} className={btnContur}>
              🏷️ Categorii
            </button>
          </div>
        }
      >
        Programări
      </TitluPagina>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {zi && (
            <button type="button" onClick={() => setVedere('zi')} className={pastila(vedere === 'zi')}>
              {eticheta(zi, azi)}
            </button>
          )}
          {VEDERI.map((v) => (
            <button key={v.key} type="button" onClick={() => setVedere(v.key)} className={pastila(vedere === v.key)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={cautare}
            onChange={(e) => {
              setCautare(e.target.value)
              clearTimeout(temporizator.current)
              const v = e.target.value
              temporizator.current = setTimeout(() => set('q', v), 350)
            }}
            placeholder="Caută după nume, firmă, telefon…"
            className="h-9 min-w-36 flex-1 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
          />
          <select value={f.status} onChange={(e) => set('status', e.target.value)} className={fldCls(f.status)}>
            <option value="">Toate statusurile</option>
            {STATUSURI_PROGRAMARE.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {categorii.length > 0 && (
            <select value={f.category} onChange={(e) => set('category', e.target.value)} className={fldCls(f.category)}>
              <option value="">Toate categoriile</option>
              {categorii.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <select value={f.responsabil} onChange={(e) => set('responsabil', e.target.value)} className={fldCls(f.responsabil)}>
            <option value="">Toată echipa</option>
            <option value="eu">Doar ale mele</option>
            {echipa
              .filter((o) => o.id !== eu)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
          </select>
          {areFiltre && (
            <button
              type="button"
              onClick={() => {
                clearTimeout(temporizator.current)
                setCautare('')
                setF({ q: '', status: '', category: '', responsabil: '' })
              }}
              className={btnContur}
            >
              Șterge filtrele
            </button>
          )}
        </div>
      </div>

      {poateCrea && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setFormular({ implicit: { dateKey: vedere === 'maine' ? adaugaZile(azi, 1) : vedere === 'zi' && zi >= azi ? zi : azi } })}
            className="tap flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-base font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand-strong"
          >
            <PlusIcon className="size-5" strokeWidth={2.5} />
            Adaugă programare
          </button>
        </div>
      )}

      <BaraIncarcare activ={incarc} />

      {!lista.length ? (
        <Gol>{incarc ? 'Se încarcă…' : 'Nicio programare.'}</Gol>
      ) : grupat ? (
        <div className="flex flex-col gap-5">
          {peZile.map(([k, lst]) => (
            <section key={k}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{eticheta(k, azi)}</h3>
              <div className="flex flex-col gap-2.5">{lst.map(rand)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">{lista.map(rand)}</div>
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
