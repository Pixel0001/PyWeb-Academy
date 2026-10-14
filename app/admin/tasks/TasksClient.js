'use client'

/**
 * Lista de taskuri — TasksManager din StefanPWA: pastile Ale mele / Toate /
 * Create de mine, bara de filtre, butonul mare „＋ Task nou", grupe pe status,
 * rânduri care se deschid (descriere, locație, istoric, comentarii), 📎,
 * paginare numerică.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ChevronRightIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import {
  STATUSURI_TASK,
  ST_TASK,
  PRIORITATI,
  PROGRES,
  statusTask,
  prioritate,
  linkuriHarta,
} from '@/lib/lucru/constante'
import { fmtDue, fmtDataOra } from '@/lib/lucru/timp'
import {
  cere,
  fldCls,
  pastila,
  cautareCls,
  btnContur,
  btnIcon,
  StatusDropdown,
  MeniuActiuni,
  Paginare,
  BaraIncarcare,
  Gol,
  TitluPagina,
} from '@/components/admin/lucru/ui'
import FormularTask from '@/components/admin/lucru/FormularTask'
import Categorii from '@/components/admin/lucru/Categorii'
import Atasamente from '@/components/admin/lucru/Atasamente'

const SCOPURI = [
  { key: 'mine', label: 'Ale mele' },
  { key: 'all', label: 'Toate' },
  { key: 'created', label: 'Create de mine' },
]
const GOALE = { q: '', status: '', assignee: '', project: '', category: '', prio: '', due: '', sort: '', ps: '' }
const CHEIE = 'filters:/admin/tasks'

export const OPTIUNI_STATUS_TASK = STATUSURI_TASK.map((s) => ({ value: s.value, label: s.label, dot: ST_TASK[s.value].dot }))

/** Grupează pe status, în ordinea în care apar primele. */
function peStatus(taskuri) {
  const ordine = []
  const m = new Map()
  for (const t of taskuri) {
    if (!m.has(t.status)) {
      m.set(t.status, [])
      ordine.push(t.status)
    }
    m.get(t.status).push(t)
  }
  return ordine.map((s) => [s, m.get(s)])
}

function Istoric({ randuri, creat, creator }) {
  return (
    <div className="border-t border-line bg-surface-2/40 px-3 py-2.5">
      {!randuri ? (
        <p className="text-[11px] text-ink-soft">Se încarcă istoricul…</p>
      ) : (
        <ol className="flex flex-col gap-2">
          <li className="flex items-start gap-2.5">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-st-new" />
            <div className="min-w-0 text-[11px]">
              <span className="font-medium">Creat</span>
              <span className="text-ink-soft">
                {' '}
                · {creator} · {fmtDataOra(creat)}
              </span>
            </div>
          </li>
          {randuri
            .filter((r) => r.toStatus && r.action !== 'CREATED')
            .slice()
            .reverse()
            .map((r) => (
              <li key={r.id} className="flex items-start gap-2.5">
                <span className={`mt-1 size-2 shrink-0 rounded-full ${ST_TASK[r.toStatus]?.dot || 'bg-st-new'}`} />
                <div className="min-w-0 text-[11px]">
                  <span className="font-medium">
                    {r.fromStatus ? `${statusTask(r.fromStatus).label} → ` : ''}
                    {statusTask(r.toStatus).label}
                  </span>
                  <span className="text-ink-soft">
                    {' '}
                    · {r.userName || '—'} · {fmtDataOra(r.createdAt)}
                  </span>
                  {r.meta?.sursa === 'TELEGRAM' && <span className="text-ink-soft"> · via Telegram</span>}
                </div>
              </li>
            ))}
        </ol>
      )}
    </div>
  )
}

function Comentarii({ randuri, ciorna, trimit, onCiorna, onTrimite }) {
  return (
    <div className="border-t border-line bg-surface-2/40 px-3 py-2.5">
      <p className="mb-2 text-[11px] font-semibold text-ink-soft">Comentarii</p>
      <div className="mb-2 flex flex-col gap-2">
        {randuri === undefined ? (
          <p className="text-[11px] text-ink-soft">Se încarcă…</p>
        ) : !randuri.length ? (
          <p className="text-[11px] text-ink-soft">Niciun comentariu încă.</p>
        ) : (
          randuri.map((c) => (
            <div key={c.id} className="text-[11px]">
              <span className="font-medium">{c.userName || '—'}</span>
              <span className="text-ink-soft">
                {' '}
                · {fmtDataOra(c.createdAt)}
                {c.source === 'TELEGRAM' ? ' · via Telegram' : ''}
              </span>
              <p className="mt-0.5 whitespace-pre-wrap">{c.body}</p>
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onTrimite()
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={ciorna}
          onChange={(e) => onCiorna(e.target.value)}
          placeholder="Scrie un comentariu…"
          rows={1}
          className="min-w-0 flex-1 resize-none rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={trimit || !ciorna.trim()}
          className="tap h-8 shrink-0 rounded-lg bg-brand px-3 text-[11px] font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
        >
          {trimit ? '…' : 'Trimite'}
        </button>
      </form>
    </div>
  )
}

export default function TasksClient({ eu, echipa, categoriiInitiale, proiecte, poateCrea, poateEdita, poateSterge, filtreUrl }) {
  const [filtre, setFiltre] = useState(GOALE)
  const [scop, setScop] = useState('mine')
  const [pagina, setPagina] = useState(1)
  const [date, setDate] = useState({ taskuri: [], total: 0, totalPagini: 1 })
  const [incarc, setIncarc] = useState(true)
  const [gata, setGata] = useState(false)
  const [cautare, setCautare] = useState('')
  const [categorii, setCategorii] = useState(categoriiInitiale)
  const [formular, setFormular] = useState(null)
  const [editez, setEditez] = useState(null)
  const [arataCategorii, setArataCategorii] = useState(false)
  const [deschis, setDeschis] = useState(null)
  const [fisiereDeschise, setFisiereDeschise] = useState(null)
  const [detalii, setDetalii] = useState({})
  const [ciorne, setCiorne] = useState({})
  const [trimit, setTrimit] = useState(null)
  const [statusPending, setStatusPending] = useState(null)
  const cerere = useRef(0)
  const temporizator = useRef(null)

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])

  // Filtrele salvate + cele din link (?project=…, ?due=…)
  useEffect(() => {
    let salvate = {}
    try {
      salvate = JSON.parse(localStorage.getItem(CHEIE) || '{}')
    } catch {
      /* fără stocare */
    }
    const f = { ...GOALE, ...(salvate.filtre || {}) }
    if (filtreUrl.project) f.project = filtreUrl.project
    if (filtreUrl.due) f.due = filtreUrl.due
    setFiltre(f)
    setCautare(f.q)
    setScop(filtreUrl.scope || salvate.scop || 'mine')
    setGata(true)
    if (filtreUrl.nou && poateCrea) setFormular({ implicit: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const incarca = useCallback(async () => {
    if (!gata) return
    const nr = ++cerere.current
    setIncarc(true)
    try {
      const p = new URLSearchParams({ scope: scop, page: String(pagina) })
      for (const [k, v] of Object.entries(filtre)) if (v) p.set(k, v)
      const r = await cere(`/api/admin/tasks?${p}`)
      if (nr === cerere.current) setDate(r)
    } catch (e) {
      if (nr === cerere.current) toast.error(e.message)
    } finally {
      if (nr === cerere.current) setIncarc(false)
    }
  }, [filtre, scop, pagina, gata])

  useEffect(() => {
    incarca()
    if (!gata) return
    try {
      localStorage.setItem(CHEIE, JSON.stringify({ filtre, scop }))
    } catch {
      /* fără stocare */
    }
  }, [incarca, filtre, scop, gata])

  function aplica(patch, scopNou) {
    setFiltre((f) => ({ ...f, ...patch }))
    if (scopNou) setScop(scopNou)
    setPagina(1)
  }

  function laCautare(v) {
    setCautare(v)
    clearTimeout(temporizator.current)
    temporizator.current = setTimeout(() => aplica({ q: v }), 350)
  }

  async function incarcaDetalii(id) {
    try {
      const { task } = await cere(`/api/admin/tasks/${id}`)
      setDetalii((d) => ({ ...d, [id]: task }))
    } catch {
      setDetalii((d) => ({ ...d, [id]: { activities: [], comments: [] } }))
    }
  }

  function comuta(id) {
    if (deschis === id) {
      setDeschis(null)
      return
    }
    setDeschis(id)
    if (!detalii[id]) incarcaDetalii(id)
  }

  function inlocuieste(id, patch) {
    setDate((d) => ({ ...d, taskuri: d.taskuri.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  }

  async function schimbaStatus(t, status) {
    const vechi = t.status
    setStatusPending(t.id)
    inlocuieste(t.id, { status })
    try {
      await cere(`/api/admin/tasks/${t.id}`, { metoda: 'PATCH', corp: { status } })
      toast.success(`Status: ${statusTask(status).label}`)
      if (deschis === t.id) incarcaDetalii(t.id)
    } catch (e) {
      inlocuieste(t.id, { status: vechi })
      toast.error(e.message)
    } finally {
      setStatusPending(null)
    }
  }

  async function schimbaProgres(t, progress) {
    const vechi = t.progress
    inlocuieste(t.id, { progress })
    try {
      const { task } = await cere(`/api/admin/tasks/${t.id}`, { metoda: 'PATCH', corp: { progress } })
      inlocuieste(t.id, { status: task.status, progress: task.progress })
      toast.success(`Progres: ${progress}%`)
    } catch (e) {
      inlocuieste(t.id, { progress: vechi })
      toast.error(e.message)
    }
  }

  async function sterge(t) {
    if (!confirm('Ștergi taskul? Se șterg și comentariile și fișierele.')) return
    const vechi = date.taskuri
    setDate((d) => ({ ...d, taskuri: d.taskuri.filter((x) => x.id !== t.id) }))
    try {
      await cere(`/api/admin/tasks/${t.id}`, { metoda: 'DELETE' })
      toast.success('Task șters')
    } catch (e) {
      setDate((d) => ({ ...d, taskuri: vechi }))
      toast.error(e.message)
    }
  }

  async function trimiteComentariu(id) {
    const body = (ciorne[id] || '').trim()
    if (!body) return
    setTrimit(id)
    try {
      await cere(`/api/admin/tasks/${id}/comentarii`, { metoda: 'POST', corp: { body } })
      setCiorne((c) => ({ ...c, [id]: '' }))
      await incarcaDetalii(id)
      toast.success('Comentariu adăugat')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setTrimit(null)
    }
  }

  const poateEditaRand = (t) => poateEdita || t.creatorId === eu || t.assigneeIds.includes(eu)
  const poateStergeRand = (t) => poateSterge || t.creatorId === eu
  const filtreActive = Object.entries(filtre).some(([k, v]) => k !== 'ps' && v)

  return (
    <div className="lucru w-full text-ink">
      <TitluPagina
        dreapta={
          <div className="flex gap-2">
            <Link href="/admin/kanban" className={btnContur}>
              📋 Kanban
            </Link>
            <button type="button" onClick={() => setArataCategorii(true)} className={btnContur}>
              🏷️ Categorii
            </button>
          </div>
        }
      >
        Taskuri
      </TitluPagina>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {SCOPURI.map((s) => (
          <button key={s.key} type="button" onClick={() => aplica({}, s.key)} className={pastila(scop === s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Filtre ─────────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            clearTimeout(temporizator.current)
            aplica({ q: cautare })
          }}
          className="flex min-w-40 flex-1 items-center"
        >
          <input value={cautare} onChange={(e) => laCautare(e.target.value)} placeholder="Caută după titlu sau #număr…" className={cautareCls} />
        </form>
        <select value={filtre.status} onChange={(e) => aplica({ status: e.target.value })} className={fldCls(filtre.status)}>
          <option value="">Status</option>
          {STATUSURI_TASK.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={filtre.assignee} onChange={(e) => aplica({ assignee: e.target.value })} className={fldCls(filtre.assignee)}>
          <option value="">Persoană</option>
          {echipa.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select value={filtre.project} onChange={(e) => aplica({ project: e.target.value })} className={fldCls(filtre.project)}>
          <option value="">Proiect</option>
          <option value="none">— Fără proiect —</option>
          {proiecte.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {categorii.length > 0 && (
          <select value={filtre.category} onChange={(e) => aplica({ category: e.target.value })} className={fldCls(filtre.category)}>
            <option value="">Categorie</option>
            {categorii.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <select value={filtre.prio} onChange={(e) => aplica({ prio: e.target.value })} className={fldCls(filtre.prio)}>
          <option value="">Prioritate</option>
          {PRIORITATI.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select value={filtre.due} onChange={(e) => aplica({ due: e.target.value })} className={fldCls(filtre.due)}>
          <option value="">Termen</option>
          <option value="overdue">Întârziate</option>
          <option value="today">Azi</option>
          <option value="tomorrow">Mâine</option>
          <option value="week">Săptămâna asta</option>
          <option value="month">Luna asta</option>
          <option value="none">Fără termen</option>
        </select>
        <select value={filtre.sort} onChange={(e) => aplica({ sort: e.target.value })} className={fldCls(filtre.sort)}>
          <option value="">Sortare implicită</option>
          <option value="dueAsc">Termen ↑</option>
          <option value="dueDesc">Termen ↓</option>
        </select>
        {filtreActive && (
          <button
            type="button"
            onClick={() => {
              setCautare('')
              aplica({ ...GOALE, ps: filtre.ps })
            }}
            className={btnContur}
          >
            Șterge filtrele
          </button>
        )}
      </div>

      {poateCrea && (
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setFormular({ implicit: { projectId: filtre.project && filtre.project !== 'none' ? filtre.project : '' } })}
            className="tap h-10 flex-1 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-strong"
          >
            ＋ Task nou
          </button>
        </div>
      )}

      <BaraIncarcare activ={incarc} />

      {!date.taskuri.length ? (
        <Gol>{incarc ? 'Se încarcă…' : filtreActive ? 'Niciun task pe filtrele alese.' : 'Niciun task încă.'}</Gol>
      ) : (
        <div className={`flex flex-col gap-0 transition-opacity duration-200 ${incarc ? 'pointer-events-none opacity-50' : ''}`}>
          {peStatus(date.taskuri).map(([status, grup]) => (
            <div key={status} className="mb-3">
              <div className="mb-1.5 flex items-center gap-2 px-1">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${ST_TASK[status].badge}`}>
                  <span className={`size-2 rounded-full ${ST_TASK[status].dot}`} />
                  {statusTask(status).label.toUpperCase()}
                </span>
                <span className="text-xs text-ink-soft">{grup.length}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {grup.map((t) => {
                  const harta = t.project ? linkuriHarta(t.project) : null
                  const d = detalii[t.id]
                  const asignati = t.assigneeIds.map((id) => nume[id]).filter(Boolean).join(', ')
                  return (
                    <div key={t.id} className="lcard overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap">
                        <button type="button" onClick={() => comuta(t.id)} className="min-w-0 basis-full text-left sm:basis-0 sm:flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            {t.seq != null && (
                              <Link
                                href={`/admin/tasks/${t.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand hover:bg-brand/20"
                              >
                                #{t.seq}
                              </Link>
                            )}
                            <span className="min-w-0 truncate text-sm font-medium">{t.title}</span>
                            <ChevronRightIcon className={`size-3.5 shrink-0 text-ink-soft transition-transform ${deschis === t.id ? 'rotate-90' : ''}`} />
                          </div>
                          <p className="flex flex-wrap items-center gap-x-1 truncate text-[11px] text-ink-soft">
                            {prioritate(t.priority).label}
                            {t.project && ` · ${t.project.name}`}
                            {asignati && ` · ${asignati}`}
                            {t.dueAt && (
                              <span className={new Date(t.dueAt) < new Date() && !['DONE', 'CANCELLED'].includes(t.status) ? 'font-semibold text-st-cancelled' : ''}>
                                {` · ${fmtDue(t.dueAt)}`}
                              </span>
                            )}
                            {t.progress > 0 && ` · ${t.progress}%`}
                            {t.lead && ` · 🎯 ${t.lead.denumire}`}
                            {t.category && (
                              <span className="inline-flex items-center gap-1">
                                {' · '}
                                <span className="size-1.5 rounded-full" style={{ background: t.category.color }} />
                                {t.category.name}
                              </span>
                            )}
                            {t._count?.comments > 0 && ` · 💬 ${t._count.comments}`}
                          </p>
                        </button>

                        <div className="flex flex-1 items-center justify-between gap-2 sm:flex-none sm:justify-end">
                          <StatusDropdown
                            status={t.status}
                            eticheta={statusTask(t.status).label}
                            badge={ST_TASK[t.status].badge}
                            optiuni={OPTIUNI_STATUS_TASK}
                            pending={statusPending === t.id}
                            onChange={(s) => s !== t.status && schimbaStatus(t, s)}
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={t.progress}
                              onChange={(e) => schimbaProgres(t, Number(e.target.value))}
                              title="Progres"
                              className="hidden h-8 w-16 shrink-0 rounded-lg border border-line bg-surface px-1 text-[11px] outline-none focus:border-brand sm:block"
                            >
                              {[...new Set([...PROGRES, t.progress])].sort((a, b) => a - b).map((p) => (
                                <option key={p} value={p}>
                                  {p}%
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setFisiereDeschise((id) => (id === t.id ? null : t.id))}
                              className={`tap hidden size-8 shrink-0 place-items-center rounded-lg border text-sm sm:grid ${
                                fisiereDeschise === t.id ? 'border-brand bg-brand/10 text-brand' : 'border-line text-ink-soft hover:bg-surface-2'
                              }`}
                              title="Atașamente"
                            >
                              📎
                            </button>
                            {poateEditaRand(t) && (
                              <button type="button" onClick={() => setEditez(t)} className={`${btnIcon} hidden sm:grid`} title="Editează">
                                <PencilIcon className="size-3.5" />
                              </button>
                            )}
                            {poateStergeRand(t) && (
                              <button type="button" onClick={() => sterge(t)} className={`${btnIcon} hidden !text-st-cancelled sm:grid`} title="Șterge">
                                <TrashIcon className="size-3.5" />
                              </button>
                            )}
                            <MeniuActiuni
                              className="sm:hidden"
                              items={[
                                { key: 'f', label: 'Atașamente', icon: <span className="text-sm">📎</span>, onClick: () => setFisiereDeschise((id) => (id === t.id ? null : t.id)) },
                                ...(poateEditaRand(t) ? [{ key: 'e', label: 'Editează', icon: <PencilIcon className="size-3.5" />, onClick: () => setEditez(t) }] : []),
                                ...(poateStergeRand(t) ? [{ key: 'd', label: 'Șterge', icon: <TrashIcon className="size-3.5" />, onClick: () => sterge(t), pericol: true }] : []),
                              ]}
                            />
                          </div>
                        </div>
                      </div>

                      {deschis === t.id && (
                        <>
                          {t.description && (
                            <div className="border-t border-line bg-surface-2/40 px-3 py-2.5">
                              <p className="mb-1 text-[11px] font-semibold text-ink-soft">Descriere</p>
                              <p className="whitespace-pre-wrap text-[12px]">{t.description}</p>
                            </div>
                          )}
                          {harta && (
                            <div className="border-t border-line bg-surface-2/40 px-3 py-2.5">
                              <p className="mb-1.5 text-[11px] font-semibold text-ink-soft">Locație</p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  [harta.google, '🗺 Google Maps'],
                                  [harta.waze, '🚗 Waze'],
                                  [harta.apple, '🍎 Apple Maps'],
                                ].map(([href, text]) => (
                                  <a
                                    key={href}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-line bg-surface px-2.5 text-[11px] font-medium text-ink hover:bg-surface-2"
                                  >
                                    {text}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          <Istoric randuri={d?.activities} creat={t.createdAt} creator={nume[t.creatorId] || '—'} />
                          <Comentarii
                            randuri={d?.comments}
                            ciorna={ciorne[t.id] || ''}
                            trimit={trimit === t.id}
                            onCiorna={(v) => setCiorne((c) => ({ ...c, [t.id]: v }))}
                            onTrimite={() => trimiteComentariu(t.id)}
                          />
                        </>
                      )}
                      {fisiereDeschise === t.id && (
                        <Atasamente
                          taskId={t.id}
                          varianta="panou"
                          poateSterge={(a) => a.userId === eu || poateEdita}
                          onSchimbare={incarca}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Paginare
        pagina={date.pagina || pagina}
        totalPagini={date.totalPagini || 1}
        onPagina={setPagina}
        marime={filtre.ps}
        onMarime={(v) => aplica({ ps: v === '20' ? '' : v })}
      />

      {formular && (
        <FormularTask
          implicit={formular.implicit}
          echipa={echipa}
          categorii={categorii}
          proiecte={proiecte}
          eu={eu}
          onInchide={() => setFormular(null)}
          onSalvat={(t) => {
            // Ca în StefanPWA: treci pe „Create de mine" și deschide taskul nou
            aplica({}, 'created')
            setDeschis(t.id)
            incarcaDetalii(t.id)
          }}
        />
      )}
      {editez && (
        <FormularTask
          task={editez}
          echipa={echipa}
          categorii={categorii}
          proiecte={proiecte}
          eu={eu}
          onInchide={() => setEditez(null)}
          onSalvat={() => incarca()}
        />
      )}
      {arataCategorii && <Categorii categorii={categorii} onSchimbare={setCategorii} onInchide={() => setArataCategorii(false)} />}
    </div>
  )
}
