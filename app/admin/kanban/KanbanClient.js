'use client'

/**
 * Kanban — TaskKanban din StefanPWA: pastile rapide de termen, bara de
 * filtre (în browser, instant), coloane pe status cu drag & drop.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { STATUSURI_TASK, ST_TASK, PRIORITATI, PRIO_TEXT, statusTask, prioritate } from '@/lib/lucru/constante'
import { cheieZi, adaugaZile, inceputSaptamana } from '@/lib/lucru/timp'
import { cere, fldCls, pastila, TitluPagina, btnContur } from '@/components/admin/lucru/ui'
import FormularTask from '@/components/admin/lucru/FormularTask'

const LIMITA = 100
const CHEIE = 'filters:kanban'
const RAPIDE = [
  ['today', 'Azi'],
  ['tomorrow', 'Mâine'],
  ['week', 'Săptămâna asta'],
  ['month', 'Luna asta'],
]

function potrivesteTermen(dueAt, filtru) {
  if (!filtru) return true
  if (filtru === 'none') return !dueAt
  if (!dueAt) return false
  const d = new Date(dueAt)
  if (filtru === 'overdue') return d < new Date()
  const zi = cheieZi(d)
  const azi = cheieZi()
  if (filtru === 'today') return zi === azi
  if (filtru === 'tomorrow') return zi === adaugaZile(azi, 1)
  if (filtru === 'week') {
    const luni = inceputSaptamana(azi)
    return zi >= luni && zi <= adaugaZile(luni, 6)
  }
  if (filtru === 'month') return zi.slice(0, 7) === azi.slice(0, 7)
  return true
}

function citeste() {
  try {
    return JSON.parse(localStorage.getItem(CHEIE) || '{}')
  } catch {
    return {}
  }
}

export default function KanbanClient({ eu, echipa, categorii, proiecte, poateCrea }) {
  const [taskuri, setTaskuri] = useState([])
  const [total, setTotal] = useState(0)
  const [trag, setTrag] = useState(null)
  const [peste, setPeste] = useState(null)
  const [formular, setFormular] = useState(false)
  const [f, setF] = useState({ q: '', status: '', prio: '', assignee: '', project: '', category: '', due: '' })
  const [gata, setGata] = useState(false)

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])

  const incarca = () =>
    cere(`/api/admin/tasks?scope=all&ps=${LIMITA}`)
      .then((r) => {
        setTaskuri(r.taskuri)
        setTotal(r.total)
      })
      .catch((e) => toast.error(e.message))

  useEffect(() => {
    let viu = true
    const salvate = citeste()
    cere(`/api/admin/tasks?scope=all&ps=${LIMITA}`)
      .then((r) => {
        if (!viu) return
        setF((x) => ({ ...x, ...salvate }))
        setGata(true)
        setTaskuri(r.taskuri)
        setTotal(r.total)
      })
      .catch((e) => toast.error(e.message))
    return () => {
      viu = false
    }
  }, [])

  useEffect(() => {
    if (!gata) return
    try {
      if (Object.values(f).some(Boolean)) localStorage.setItem(CHEIE, JSON.stringify(f))
      else localStorage.removeItem(CHEIE)
    } catch {
      /* fără stocare */
    }
  }, [f, gata])

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const areFiltre = Object.values(f).some(Boolean)

  const filtrate = useMemo(() => {
    const termen = f.q.trim().toLowerCase()
    return taskuri.filter((t) => {
      if (f.status && t.status !== f.status) return false
      if (f.prio && t.priority !== f.prio) return false
      if (f.assignee && !t.assigneeIds.includes(f.assignee)) return false
      if (f.project && t.projectId !== f.project) return false
      if (f.category && t.categoryId !== f.category) return false
      if (!potrivesteTermen(t.dueAt, f.due)) return false
      if (termen && !t.title.toLowerCase().includes(termen) && String(t.seq) !== termen.replace('#', '')) return false
      return true
    })
  }, [taskuri, f])

  const peColoana = useMemo(() => {
    const m = new Map(STATUSURI_TASK.map((s) => [s.value, []]))
    for (const t of filtrate) m.get(t.status)?.push(t)
    return m
  }, [filtrate])

  async function muta(id, status) {
    const t = taskuri.find((x) => x.id === id)
    if (!t || t.status === status) return
    const vechi = taskuri
    setTaskuri((l) => l.map((x) => (x.id === id ? { ...x, status } : x)))
    try {
      await cere(`/api/admin/tasks/${id}`, { metoda: 'PATCH', corp: { status } })
      toast.success(`Mutat în „${statusTask(status).label}"`)
    } catch (e) {
      setTaskuri(vechi)
      toast.error(e.message)
    }
  }

  return (
    <div className="lucru w-full text-ink">
      <TitluPagina
        dreapta={
          <div className="flex gap-2">
            <Link href="/admin/tasks" className={btnContur}>
              ☰ Listă
            </Link>
            {poateCrea && (
              <button type="button" onClick={() => setFormular(true)} className="tap h-9 rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-strong">
                ＋ Task nou
              </button>
            )}
          </div>
        }
      >
        Kanban
      </TitluPagina>

      {total > LIMITA && (
        <div className="mb-3 rounded-xl border border-amber-300/40 bg-amber-100/60 px-4 py-2.5 text-xs text-amber-900">
          Kanban afișează primele {LIMITA} task-uri. Folosește <strong>lista</strong> pentru filtrare avansată cu mai multe date.
        </div>
      )}

      {/* Pastile rapide */}
      <div className="mb-2 flex flex-wrap gap-2">
        {RAPIDE.map(([k, l]) => (
          <button key={k} type="button" onClick={() => set('due', f.due === k ? '' : k)} className={pastila(f.due === k)}>
            {l}
          </button>
        ))}
        {areFiltre && (
          <button
            type="button"
            onClick={() => setF({ q: '', status: '', prio: '', assignee: '', project: '', category: '', due: '' })}
            className="tap ml-auto rounded-full border border-line px-4 py-1.5 text-sm text-ink-soft hover:bg-surface-2"
          >
            Șterge filtrele
          </button>
        )}
      </div>

      {/* Filtre */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={f.q}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Caută task…"
          className="h-9 min-w-36 flex-1 rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-brand"
        />
        <select value={f.status} onChange={(e) => set('status', e.target.value)} className={fldCls(f.status)}>
          <option value="">Status</option>
          {STATUSURI_TASK.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={f.prio} onChange={(e) => set('prio', e.target.value)} className={fldCls(f.prio)}>
          <option value="">Prioritate</option>
          {[...PRIORITATI].reverse().map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select value={f.assignee} onChange={(e) => set('assignee', e.target.value)} className={fldCls(f.assignee)}>
          <option value="">Persoană</option>
          {echipa.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select value={f.project} onChange={(e) => set('project', e.target.value)} className={fldCls(f.project)}>
          <option value="">Proiect</option>
          {proiecte.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {categorii.length > 0 && (
          <select value={f.category} onChange={(e) => set('category', e.target.value)} className={fldCls(f.category)}>
            <option value="">Categorie</option>
            {categorii.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <select value={f.due} onChange={(e) => set('due', e.target.value)} className={fldCls(f.due)}>
          <option value="">Orice termen</option>
          <option value="overdue">Întârziate</option>
          <option value="today">Azi</option>
          <option value="tomorrow">Mâine</option>
          <option value="week">Săptămâna asta</option>
          <option value="month">Luna asta</option>
          <option value="none">Fără termen</option>
        </select>
      </div>

      {/* Tabla — întoarsă pe X ca bara de scroll să fie sus */}
      <div className="overflow-x-auto pt-1 [transform:rotateX(180deg)]">
        <div className="flex gap-3 pb-2 [transform:rotateX(180deg)]">
          {STATUSURI_TASK.map((col) => {
            const lista = peColoana.get(col.value) || []
            const activ = peste === col.value
            return (
              <div
                key={col.value}
                className="flex w-64 shrink-0 flex-col"
                onDragOver={(e) => {
                  e.preventDefault()
                  if (peste !== col.value) setPeste(col.value)
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget === e.target) setPeste(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('text/plain') || trag
                  if (id) muta(id, col.value)
                  setPeste(null)
                  setTrag(null)
                }}
              >
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className={`size-2.5 rounded-full ${ST_TASK[col.value].dot}`} />
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="ml-auto rounded-full bg-surface-2 px-2 text-xs text-ink-soft">{lista.length}</span>
                </div>
                <div className={`flex min-h-24 flex-1 flex-col gap-2 rounded-2xl p-2 transition-colors ${activ ? 'bg-brand-soft ring-2 ring-brand' : 'bg-surface-2/60'}`}>
                  {lista.map((t) => (
                    <Link
                      key={t.id}
                      href={`/admin/tasks/${t.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', t.id)
                        e.dataTransfer.effectAllowed = 'move'
                        setTrag(t.id)
                      }}
                      onDragEnd={() => {
                        setTrag(null)
                        setPeste(null)
                      }}
                      className={`lcard block cursor-grab p-2.5 hover:opacity-90 active:cursor-grabbing ${trag === t.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                        {t.category && <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: t.category.color }} title={t.category.name} />}
                      </div>
                      {t.seq != null && (
                        <span className="mt-1 inline-block rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand">#{t.seq}</span>
                      )}
                      <p className="mt-1 truncate text-[11px] text-ink-soft">
                        <span className={PRIO_TEXT[t.priority]}>{prioritate(t.priority).label}</span>
                        {t.project && ` · ${t.project.name}`}
                        {t.assigneeIds.length > 0 && ` · ${t.assigneeIds.map((x) => nume[x]).filter(Boolean).join(', ')}`}
                        {t.progress > 0 && ` · ${t.progress}%`}
                      </p>
                    </Link>
                  ))}
                  {!lista.length && <p className="py-3 text-center text-xs text-ink-soft">—</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {formular && (
        <FormularTask echipa={echipa} categorii={categorii} proiecte={proiecte} eu={eu} onInchide={() => setFormular(false)} onSalvat={incarca} />
      )}
    </div>
  )
}
