'use client'

/**
 * Calendarul — pagina Calendar din StefanPWA: Lună / Săptămână / Zi, cu
 * task-urile (după termen) și programările, filtre pe persoană, proiect,
 * categorie.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { ST_TASK, statusTask } from '@/lib/lucru/constante'
import { cheieZi, adaugaZile, inceputSaptamana, momentLocal, oraLocala, numeLuna } from '@/lib/lucru/timp'
import { cere, fldCls, btnContur } from '@/components/admin/lucru/ui'

const ZILE = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D']
const CHEIE = 'filters:calendar'
const VIOLET = '#8b5cf6'

function intervalul(vedere, ancora) {
  if (vedere === 'day') return [ancora]
  if (vedere === 'week') {
    const luni = inceputSaptamana(ancora)
    return Array.from({ length: 7 }, (_, i) => adaugaZile(luni, i))
  }
  const start = inceputSaptamana(`${ancora.slice(0, 7)}-01`)
  return Array.from({ length: 42 }, (_, i) => adaugaZile(start, i))
}

function eticheta(vedere, ancora) {
  const [a, l, z] = ancora.split('-').map(Number)
  if (vedere === 'month') return `${numeLuna(l - 1, true)} ${a}`
  if (vedere === 'week') {
    const luni = inceputSaptamana(ancora)
    const dum = adaugaZile(luni, 6)
    const f = (k) => `${Number(k.slice(8))} ${numeLuna(Number(k.slice(5, 7)) - 1)}`
    return `${f(luni)} – ${f(dum)} ${dum.slice(0, 4)}`
  }
  const zi = new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(a, l - 1, z, 12))
  )
  return zi
}

function muta(vedere, ancora, dir) {
  if (vedere === 'day') return adaugaZile(ancora, dir)
  if (vedere === 'week') return adaugaZile(inceputSaptamana(ancora), 7 * dir)
  const [a, l] = ancora.split('-').map(Number)
  const d = new Date(Date.UTC(a, l - 1 + dir, 1, 12))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function Punct({ e }) {
  if (e.tip === 'APPT') return <span className="mt-0.5 size-2 shrink-0 rounded-full" style={{ background: e.culoare || VIOLET }} />
  return <span className={`mt-0.5 size-2 shrink-0 rounded-full ${ST_TASK[e.status]?.dot || 'bg-ink-soft'}`} />
}

function Card({ e }) {
  return (
    <Link href={e.href} prefetch={false} className="lcard flex items-start gap-1.5 p-1.5 text-[11px] hover:opacity-80">
      <Punct e={e} />
      <div className="min-w-0 flex-1 overflow-hidden">
        {e.seq != null && <span className="mr-0.5 font-mono text-[10px] font-semibold text-brand">#{e.seq}</span>}
        {e.ora && <span className="mr-0.5 font-semibold">{e.ora}</span>}
        <span className="truncate">{e.titlu}</span>
        {e.client && <div className="truncate text-ink-soft">{e.client}</div>}
      </div>
    </Link>
  )
}

export default function CalendarClient({ eu, echipa, categorii, proiecte, vedeProgramari }) {
  const azi = cheieZi()
  const [vedere, setVedere] = useState('month')
  const [ancora, setAncora] = useState(azi)
  const [scop, setScop] = useState('all')
  const [arataTaskuri, setArataTaskuri] = useState(true)
  const [arataProgramari, setArataProgramari] = useState(vedeProgramari)
  const [f, setF] = useState({ assignee: '', project: '', category: '' })
  const [elemente, setElemente] = useState([])
  const [incarc, setIncarc] = useState(false)
  const [gata, setGata] = useState(false)

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])
  const zile = useMemo(() => intervalul(vedere, ancora), [vedere, ancora])

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(CHEIE) || '{}')
      if (s.vedere) setVedere(s.vedere)
      if (s.scop) setScop(s.scop)
      if (s.f) setF((x) => ({ ...x, ...s.f }))
      if (s.arataTaskuri === false) setArataTaskuri(false)
      if (s.arataProgramari === false) setArataProgramari(false)
    } catch {
      /* fără stocare */
    }
    setGata(true)
  }, [])

  const incarca = useCallback(async () => {
    if (!gata) return
    setIncarc(true)
    try {
      const de = zile[0]
      const pana = zile[zile.length - 1]
      const cereri = []
      if (arataTaskuri) {
        const p = new URLSearchParams({
          scope: scop,
          ps: '500',
          dueDe: momentLocal(de).toISOString(),
          duePana: momentLocal(adaugaZile(pana, 1)).toISOString(),
        })
        if (f.assignee) p.set('assignee', f.assignee)
        if (f.project) p.set('project', f.project)
        if (f.category) p.set('category', f.category)
        cereri.push(cere(`/api/admin/tasks?${p}`).then((r) => r.taskuri))
      } else cereri.push(Promise.resolve([]))
      if (arataProgramari && vedeProgramari) {
        const p = new URLSearchParams({ de, pana })
        const resp = f.assignee || (scop === 'mine' ? 'eu' : '')
        if (resp) p.set('responsabil', resp)
        if (f.category) p.set('category', f.category)
        cereri.push(cere(`/api/admin/programari?${p}`).then((r) => (f.project ? r.programari.filter((x) => x.projectId === f.project) : r.programari)))
      } else cereri.push(Promise.resolve([]))

      const [taskuri, programari] = await Promise.all(cereri)
      const lista = [
        ...taskuri
          .filter((t) => t.dueAt)
          .map((t) => ({
            id: t.id,
            tip: 'TASK',
            titlu: t.title,
            la: new Date(t.dueAt),
            zi: cheieZi(t.dueAt),
            status: t.status,
            seq: t.seq,
            cine: t.assigneeIds.map((x) => nume[x]).filter(Boolean).join(', '),
            href: `/admin/tasks/${t.id}`,
          })),
        ...programari.map((a) => ({
          id: a.id,
          tip: 'APPT',
          titlu: a.title,
          la: new Date(a.startAt),
          zi: a.dateKey,
          ora: oraLocala(a.startAt),
          status: a.status,
          client: a.contactName,
          culoare: a.category?.color,
          href: `/admin/programari?zi=${a.dateKey}`,
        })),
      ].sort((a, b) => a.la - b.la)
      setElemente(lista)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIncarc(false)
    }
  }, [gata, zile, scop, arataTaskuri, arataProgramari, vedeProgramari, f, nume])

  useEffect(() => {
    incarca()
    if (!gata) return
    try {
      localStorage.setItem(CHEIE, JSON.stringify({ vedere, scop, f, arataTaskuri, arataProgramari }))
    } catch {
      /* fără stocare */
    }
  }, [incarca, gata, vedere, scop, f, arataTaskuri, arataProgramari])

  const peZi = useMemo(() => {
    const m = new Map()
    for (const e of elemente) {
      if (!m.has(e.zi)) m.set(e.zi, [])
      m.get(e.zi).push(e)
    }
    return m
  }, [elemente])

  const chip = (activ) => `tap rounded-full px-3.5 py-1.5 text-sm font-medium ${activ ? 'bg-brand text-white' : 'lcard text-ink-soft'}`
  const tabVedere = (v) => `rounded-full px-3.5 py-1.5 text-sm font-medium ${vedere === v ? 'bg-brand text-white' : 'text-ink-soft'}`
  const laZi = (k) => {
    setAncora(k)
    setVedere('day')
  }

  return (
    <div className="lucru w-full text-ink">
      <h1 className="mb-4 text-lg font-bold lg:text-xl">Calendar</h1>

      <div className="mb-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-full bg-surface-2 p-1">
            {[
              ['month', 'Lună'],
              ['week', 'Săptămână'],
              ['day', 'Zi'],
            ].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setVedere(v)} className={tabVedere(v)}>
                {l}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setAncora(azi)} className="tap lcard ml-auto rounded-full px-3.5 py-1.5 text-sm">
            Azi
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setAncora(muta(vedere, ancora, -1))} className="tap lcard grid size-9 place-items-center rounded-lg" aria-label="Înapoi">
            <ChevronLeftIcon className="size-4" />
          </button>
          <span className="text-sm font-semibold capitalize">
            {eticheta(vedere, ancora)}
            {incarc && <span className="ml-2 text-xs font-normal text-ink-soft">…</span>}
          </span>
          <button type="button" onClick={() => setAncora(muta(vedere, ancora, 1))} className="tap lcard grid size-9 place-items-center rounded-lg" aria-label="Înainte">
            <ChevronRightIcon className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['all', 'Toate'],
            ['mine', 'Ale mele'],
            ['created', 'Create de mine'],
          ].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setScop(k)} className={chip(scop === k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setArataTaskuri((x) => !x)} className={chip(arataTaskuri)}>
            Task-uri
          </button>
          {vedeProgramari && (
            <button type="button" onClick={() => setArataProgramari((x) => !x)} className={chip(arataProgramari)}>
              Programări
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })} className={fldCls(f.assignee)}>
            <option value="">Persoană</option>
            {echipa.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {o.id === eu ? ' (eu)' : ''}
              </option>
            ))}
          </select>
          <select value={f.project} onChange={(e) => setF({ ...f, project: e.target.value })} className={fldCls(f.project)}>
            <option value="">Proiect</option>
            {proiecte.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {categorii.length > 0 && (
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={fldCls(f.category)}>
              <option value="">Categorie</option>
              {categorii.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {(f.assignee || f.project || f.category) && (
            <button type="button" onClick={() => setF({ assignee: '', project: '', category: '' })} className={btnContur}>
              Șterge filtrele
            </button>
          )}
        </div>
      </div>

      {vedere === 'month' && (
        <div>
          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold text-ink-soft">
            {ZILE.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {zile.map((k) => {
              const inLuna = k.slice(0, 7) === ancora.slice(0, 7)
              const lista = peZi.get(k) || []
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => laZi(k)}
                  className={`lcard flex min-h-16 flex-col gap-1 p-1.5 text-left ${inLuna ? '' : 'opacity-40'} ${k === azi ? 'ring-2 ring-brand' : ''}`}
                >
                  <span className={`text-xs tabular-nums ${k === azi ? 'font-bold text-brand' : 'text-ink-soft'}`}>{Number(k.slice(8))}</span>
                  <div className="flex flex-wrap gap-0.5">
                    {lista.slice(0, 6).map((e) =>
                      e.tip === 'APPT' ? (
                        <span key={e.id} className="size-1.5 rounded-full" style={{ background: e.culoare || VIOLET }} title={`${e.ora} ${e.client} · Programare`} />
                      ) : (
                        <span key={e.id} className={`size-1.5 rounded-full ${ST_TASK[e.status]?.dot}`} title={`${e.titlu} · ${statusTask(e.status).label}`} />
                      )
                    )}
                  </div>
                  {lista.length > 0 && <span className="mt-auto text-[10px] font-medium text-ink-soft">{lista.length}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {vedere === 'week' && (
        <div className="overflow-x-auto">
          <div className="grid min-w-[560px] grid-cols-7 gap-1">
            {zile.map((k, i) => {
              const eAzi = k === azi
              return (
                <div key={k} className={`flex min-h-32 flex-col rounded-xl border p-1.5 ${eAzi ? 'border-brand' : 'border-line'}`}>
                  <button
                    type="button"
                    onClick={() => laZi(k)}
                    className={`mb-1.5 flex items-center gap-1 text-xs font-semibold ${eAzi ? 'text-brand' : 'text-ink-soft'}`}
                  >
                    <span>{ZILE[i]}</span>
                    <span className={`ml-auto tabular-nums ${eAzi ? 'size-5 rounded-full bg-brand text-center leading-5 text-white' : ''}`}>{Number(k.slice(8))}</span>
                  </button>
                  <div className="flex flex-col gap-1">
                    {(peZi.get(k) || []).map((e) => (
                      <Card key={`${e.tip}${e.id}`} e={e} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {vedere === 'day' &&
        (!(peZi.get(ancora) || []).length ? (
          <div className="lcard grid place-items-center p-10 text-center text-sm text-ink-soft">Nicio intrare în această zi.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {peZi.get(ancora).map((e) => (
              <Link key={`${e.tip}${e.id}`} href={e.href} prefetch={false} className="lcard flex items-center gap-2.5 px-3 py-2">
                {e.tip === 'APPT' ? (
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: e.culoare || VIOLET }} />
                ) : (
                  <span className={`size-2.5 shrink-0 rounded-full ${ST_TASK[e.status]?.dot}`} />
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {e.seq != null && <span className="mr-1 font-mono text-xs text-brand">#{e.seq}</span>}
                  {e.ora && <span className="mr-1 font-mono text-xs text-brand">{e.ora}</span>}
                  {e.titlu}
                </span>
                <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-ink-soft">{e.tip === 'APPT' ? 'Programare' : 'Task'}</span>
                {(e.cine || e.client) && <span className="hidden shrink-0 text-[11px] text-ink-soft sm:inline">{e.cine || e.client}</span>}
              </Link>
            ))}
          </div>
        ))}
    </div>
  )
}
