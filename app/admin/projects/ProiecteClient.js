'use client'

/**
 * Proiectele — ProjectsManager din StefanPWA: buton mare „＋ Proiect nou",
 * căutare + status, rânduri care se deschid cu taskurile proiectului,
 * 📍 / ＋ Task / 📎 / editare / ștergere, paginare.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ChevronRightIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { STATUSURI_PROIECT, ST_TASK, statusProiect } from '@/lib/lucru/constante'
import { cere, fldCls, cautareCls, btnContur, MeniuActiuni, Paginare, BaraIncarcare, Gol, TitluPagina } from '@/components/admin/lucru/ui'
import FormularProiect from '@/components/admin/lucru/FormularProiect'
import FormularTask from '@/components/admin/lucru/FormularTask'

const CHEIE = 'filters:projects'

function FisiereProiect({ id }) {
  const [fisiere, setFisiere] = useState(null)
  useEffect(() => {
    let viu = true
    cere(`/api/admin/projects/${id}`)
      .then((r) => viu && setFisiere(r.fisiere))
      .catch(() => viu && setFisiere([]))
    return () => {
      viu = false
    }
  }, [id])
  return (
    <div className="border-t border-line bg-surface-2/40 px-3 py-2.5">
      <p className="mb-2 text-[11px] font-semibold text-ink-soft">📎 Fișierele proiectului (din task-uri)</p>
      {fisiere === null ? (
        <p className="text-[11px] text-ink-soft">Se încarcă…</p>
      ) : !fisiere.length ? (
        <p className="text-[11px] text-ink-soft">Niciun fișier. Se adaugă pe task-urile proiectului.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {fisiere.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex max-w-[120px] flex-col items-center gap-1 rounded-lg border border-line bg-surface p-1.5"
              title={`${a.name} · din „${a.taskTitle}”`}
            >
              {/^image\//.test(a.mimeType || '') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt="" className="h-16 w-16 rounded object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded bg-surface-2 text-2xl">📄</div>
              )}
              <span className="w-full truncate text-center text-[10px] text-ink-soft">{a.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProiecteClient({ eu, echipa, categorii, proiecteOptiuni, poateCrea, poateEdita, poateSterge, poateCreaTask }) {
  const [filtre, setFiltre] = useState({ q: '', status: '', ps: '' })
  const [cautare, setCautare] = useState('')
  const [pagina, setPagina] = useState(1)
  const [date, setDate] = useState({ proiecte: [], totalPagini: 1 })
  const [incarc, setIncarc] = useState(true)
  const [gata, setGata] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [taskNou, setTaskNou] = useState(null)
  const [deschis, setDeschis] = useState(null)
  const [fisiere, setFisiere] = useState(null)
  const [taskuri, setTaskuri] = useState({})
  const temporizator = useRef(null)

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(CHEIE) || '{}')
      setFiltre((f) => ({ ...f, ...s }))
      setCautare(s.q || '')
    } catch {
      /* fără stocare */
    }
    setGata(true)
  }, [])

  const incarca = useCallback(async () => {
    if (!gata) return
    setIncarc(true)
    try {
      const p = new URLSearchParams({ page: String(pagina) })
      for (const [k, v] of Object.entries(filtre)) if (v) p.set(k, v)
      setDate(await cere(`/api/admin/projects?${p}`))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIncarc(false)
    }
  }, [filtre, pagina, gata])

  useEffect(() => {
    incarca()
    if (!gata) return
    try {
      localStorage.setItem(CHEIE, JSON.stringify(filtre))
    } catch {
      /* fără stocare */
    }
  }, [incarca, filtre, gata])

  const aplica = (patch) => {
    setFiltre((f) => ({ ...f, ...patch }))
    setPagina(1)
  }

  async function comuta(id) {
    if (deschis === id) {
      setDeschis(null)
      return
    }
    setDeschis(id)
    if (!taskuri[id]) {
      try {
        const r = await cere(`/api/admin/tasks?scope=all&project=${id}&ps=200`)
        setTaskuri((t) => ({ ...t, [id]: r.taskuri }))
      } catch {
        setTaskuri((t) => ({ ...t, [id]: [] }))
      }
    }
  }

  async function sterge(p) {
    if (!confirm(`Ștergi proiectul „${p.name}"? Task-urile rămân, fără proiect.`)) return
    const vechi = date.proiecte
    setDate((d) => ({ ...d, proiecte: d.proiecte.filter((x) => x.id !== p.id) }))
    try {
      await cere(`/api/admin/projects/${p.id}`, { metoda: 'DELETE' })
      toast.success('Proiect șters')
    } catch (e) {
      setDate((d) => ({ ...d, proiecte: vechi }))
      toast.error(e.message)
    }
  }

  const ref = (seq) => `#${String(seq).padStart(3, '0')}`

  return (
    <div className="lucru w-full text-ink">
      <TitluPagina
        dreapta={
          <Link href="/admin/harta" className={btnContur}>
            🗺️ Hartă
          </Link>
        }
      >
        Proiecte
      </TitluPagina>

      {poateCrea && (
        <button
          type="button"
          onClick={() => setDialog({ proiect: null })}
          className="tap mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white hover:bg-brand-strong"
        >
          ＋ Proiect nou
        </button>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            aplica({ q: cautare })
          }}
          className="flex min-w-40 flex-1 items-center"
        >
          <input
            value={cautare}
            onChange={(e) => {
              setCautare(e.target.value)
              clearTimeout(temporizator.current)
              const v = e.target.value
              temporizator.current = setTimeout(() => aplica({ q: v }), 300)
            }}
            placeholder="Caută proiect, client, adresă sau #număr…"
            className={cautareCls}
          />
        </form>
        <select value={filtre.status} onChange={(e) => aplica({ status: e.target.value })} className={fldCls(filtre.status)}>
          <option value="">Toate statusurile</option>
          {STATUSURI_PROIECT.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setCautare('')
            aplica({ q: '', status: '' })
          }}
          className={btnContur}
        >
          Șterge filtrele
        </button>
      </div>

      <BaraIncarcare activ={incarc} />

      {!date.proiecte.length ? (
        <Gol>{incarc ? 'Se încarcă…' : filtre.q || filtre.status ? 'Niciun proiect pe filtrele alese.' : 'Niciun proiect încă.'}</Gol>
      ) : (
        <div className="flex flex-col gap-2.5">
          {date.proiecte.map((p) => (
            <div key={p.id} className="lcard overflow-hidden">
              <div className="flex items-center gap-1.5 p-2.5 sm:gap-2.5 sm:p-3.5">
                <button
                  type="button"
                  onClick={() => comuta(p.id)}
                  className="tap grid size-6 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-surface-2 sm:size-7"
                  title={deschis === p.id ? 'Restrânge' : 'Arată task-urile'}
                >
                  <ChevronRightIcon className={`size-3 transition-transform sm:size-3.5 ${deschis === p.id ? 'rotate-90' : ''}`} />
                </button>

                <Link href={`/admin/projects/${p.id}`} className="tap min-w-0 flex-1 text-left">
                  <div className="flex min-w-0 items-center gap-1">
                    {p.seq != null && (
                      <span
                        className="shrink-0 cursor-copy rounded bg-surface-2 px-1 py-0.5 font-mono text-[10px] font-semibold text-ink-soft hover:bg-brand/10 hover:text-brand"
                        title="Clic pentru copiere"
                        onClick={(e) => {
                          e.preventDefault()
                          navigator.clipboard?.writeText(ref(p.seq))
                          toast.success(`Copiat: ${ref(p.seq)}`)
                        }}
                      >
                        {ref(p.seq)}
                      </span>
                    )}
                    <p className="truncate text-[12px] font-semibold leading-tight sm:text-sm">{p.name}</p>
                  </div>
                  <p className="truncate text-[11px] text-ink-soft">
                    {statusProiect(p.status).label} · {p.taskuri.total} task-uri
                    {(p.clientName || p.lead) && ` · ${p.clientName || p.lead.denumire}`}
                    {p.responsabilId && nume[p.responsabilId] && ` · ${nume[p.responsabilId]}`}
                    {p.lat != null && ' · 📍'}
                  </p>
                </Link>

                {p.lat != null && p.lng != null && (
                  <Link href={`/admin/projects/${p.id}`} className="tap hidden size-8 shrink-0 place-items-center rounded-lg border border-line hover:bg-surface-2 sm:grid" title="Vezi pe hartă">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="10" r="3" />
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8Z" />
                    </svg>
                  </Link>
                )}
                {poateCreaTask && (
                  <button
                    type="button"
                    onClick={() => setTaskNou(p)}
                    className="tap grid size-8 shrink-0 place-items-center rounded-lg border border-line text-brand hover:bg-brand-soft sm:inline-flex sm:h-9 sm:w-auto sm:gap-1 sm:px-2.5"
                    title="Adaugă task"
                  >
                    <PlusIcon className="size-3.5" />
                    <span className="hidden text-xs font-medium sm:inline">Task</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFisiere((id) => (id === p.id ? null : p.id))}
                  className={`tap hidden size-9 shrink-0 place-items-center rounded-lg border text-sm sm:grid ${
                    fisiere === p.id ? 'border-brand bg-brand/10 text-brand' : 'border-line text-ink-soft hover:bg-surface-2'
                  }`}
                  title="Fișiere"
                >
                  📎
                </button>
                {poateEdita && (
                  <button type="button" onClick={() => setDialog({ proiect: p })} className="tap hidden size-9 place-items-center rounded-lg border border-line hover:bg-surface-2 sm:grid" title="Editează">
                    <PencilIcon className="size-4" />
                  </button>
                )}
                {poateSterge && (
                  <button type="button" onClick={() => sterge(p)} className="tap hidden size-9 place-items-center rounded-lg border border-line text-st-cancelled hover:bg-surface-2 sm:grid" title="Șterge">
                    <TrashIcon className="size-4" />
                  </button>
                )}
                <MeniuActiuni
                  className="sm:hidden"
                  items={[
                    { key: 'f', label: 'Fișiere', icon: <span className="text-sm">📎</span>, onClick: () => setFisiere((id) => (id === p.id ? null : p.id)) },
                    ...(poateEdita ? [{ key: 'e', label: 'Editează', icon: <PencilIcon className="size-3.5" />, onClick: () => setDialog({ proiect: p }) }] : []),
                    ...(poateSterge ? [{ key: 'd', label: 'Șterge', icon: <TrashIcon className="size-3.5" />, onClick: () => sterge(p), pericol: true }] : []),
                  ]}
                />
              </div>

              {deschis === p.id && (
                <div className="border-t border-line bg-surface-2/40">
                  {!taskuri[p.id] ? (
                    <p className="px-4 py-3 text-[12px] text-ink-soft">Se încarcă task-urile…</p>
                  ) : !taskuri[p.id].length ? (
                    <p className="px-4 py-3 text-[12px] text-ink-soft">Niciun task în acest proiect.</p>
                  ) : (
                    <>
                      <div className="flex flex-col divide-y divide-line">
                        {taskuri[p.id].map((t) => (
                          <Link key={t.id} href={`/admin/tasks/${t.id}`} className="flex items-center gap-2.5 px-4 py-2 hover:bg-surface-2">
                            <span className={`size-2 shrink-0 rounded-full ${ST_TASK[t.status]?.dot || 'bg-st-new'}`} />
                            {t.seq != null && (
                              <span className="shrink-0 rounded bg-brand/10 px-1.5 py-px font-mono text-[10px] font-semibold text-brand">#{t.seq}</span>
                            )}
                            <span className="min-w-0 flex-1 truncate text-[13px]">{t.title}</span>
                            {t.assigneeIds.length > 0 && (
                              <span className="shrink-0 text-[11px] text-ink-soft">{t.assigneeIds.map((x) => nume[x]).filter(Boolean).join(', ')}</span>
                            )}
                            {t.dueAt && (
                              <span className={`shrink-0 text-[11px] ${new Date(t.dueAt) < new Date() && t.status !== 'DONE' ? 'text-st-cancelled' : 'text-ink-soft'}`}>
                                {new Date(t.dueAt).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Chisinau' })}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-line px-4 py-2">
                        <Link href={`/admin/tasks?scope=all&project=${p.id}`} className="text-[11px] font-medium text-brand hover:underline">
                          Vezi toate task-urile proiectului →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}

              {fisiere === p.id && <FisiereProiect id={p.id} />}
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

      {dialog && <FormularProiect proiect={dialog.proiect} echipa={echipa} eu={eu} onInchide={() => setDialog(null)} onSalvat={incarca} />}
      {taskNou && (
        <FormularTask
          implicit={{ projectId: taskNou.id, assigneeIds: taskNou.responsabilId ? [taskNou.responsabilId] : undefined }}
          echipa={echipa}
          categorii={categorii}
          proiecte={proiecteOptiuni.some((x) => x.id === taskNou.id) ? proiecteOptiuni : [{ id: taskNou.id, name: taskNou.name }, ...proiecteOptiuni]}
          eu={eu}
          onInchide={() => setTaskNou(null)}
          onSalvat={() => {
            setTaskuri((t) => ({ ...t, [taskNou.id]: undefined }))
            incarca()
          }}
        />
      )}
    </div>
  )
}
