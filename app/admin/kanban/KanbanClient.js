'use client'

/**
 * Kanban: o coloană pe status, tragi cardul ca să-l muți.
 * Pe telefon (fără drag) schimbi statusul din meniul cardului.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PlusIcon, ChatBubbleLeftIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import { STATUSURI_TASK, ORDINE_PRIORITATE, statusTask } from '@/lib/lucru/constante'
import { cere, clsBtn, clsBtnAlb, InsignaPrioritate, InsignaCategorie, Ref, Avatare } from '@/components/admin/lucru/ui'
import FiltreTaskuri, { useFiltreTaskuri } from '@/components/admin/lucru/FiltreTaskuri'
import FormularTask from '@/components/admin/lucru/FormularTask'
import { Termen } from '../tasks/TasksClient'

export default function KanbanClient({ eu, echipa, categorii, proiecte, poateCrea }) {
  const f = useFiltreTaskuri('pyweb.kanban.filtre')
  const [taskuri, setTaskuri] = useState([])
  const [incarc, setIncarc] = useState(true)
  const [trag, setTrag] = useState(null)
  const [peste, setPeste] = useState(null)
  const [formular, setFormular] = useState(false)
  const [ascunse, setAscunse] = useState({ CANCELLED: true, READ: false })

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])

  const incarca = useCallback(async () => {
    if (!f.gata) return
    setIncarc(true)
    try {
      const { taskuri } = await cere(`/api/admin/tasks?${f.query}&limit=500`)
      setTaskuri(taskuri)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIncarc(false)
    }
  }, [f.query, f.gata])

  useEffect(() => {
    incarca()
  }, [incarca])

  async function muta(id, status) {
    const t = taskuri.find((x) => x.id === id)
    if (!t || t.status === status) return
    const vechi = taskuri
    setTaskuri((l) => l.map((x) => (x.id === id ? { ...x, status, progress: status === 'DONE' ? 100 : x.progress } : x)))
    try {
      await cere(`/api/admin/tasks/${id}`, { metoda: 'PATCH', corp: { status } })
      toast.success(`${statusTask(status).emoji} ${t.title.slice(0, 40)} → ${statusTask(status).label}`)
    } catch (e) {
      setTaskuri(vechi)
      toast.error(e.message)
    }
  }

  const coloane = useMemo(() => {
    const pe = Object.fromEntries(STATUSURI_TASK.map((s) => [s.value, []]))
    for (const t of taskuri) pe[t.status]?.push(t)
    for (const l of Object.values(pe)) {
      l.sort(
        (a, b) =>
          (ORDINE_PRIORITATE[a.priority] ?? 2) - (ORDINE_PRIORITATE[b.priority] ?? 2) ||
          (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity)
      )
    }
    return STATUSURI_TASK.map((s) => ({ ...s, taskuri: pe[s.value] }))
  }, [taskuri])

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">Kanban</h1>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{taskuri.length}</span>
          {incarc && <span className="text-xs text-gray-400">se încarcă…</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSURI_TASK.filter((s) => ['READ', 'CANCELLED'].includes(s.value)).map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setAscunse((a) => ({ ...a, [s.value]: !a[s.value] }))}
              className={`rounded-lg border px-2 py-1 text-xs ${ascunse[s.value] ? 'border-dashed border-gray-300 text-gray-400' : 'border-gray-300 text-gray-700'}`}
            >
              {ascunse[s.value] ? '＋' : '−'} {s.label}
            </button>
          ))}
          <Link href="/admin/tasks" className={clsBtnAlb}>
            ☰ Listă
          </Link>
          {poateCrea && (
            <button type="button" onClick={() => setFormular(true)} className={clsBtn}>
              <PlusIcon className="h-4 w-4" /> Task nou
            </button>
          )}
        </div>
      </div>

      <FiltreTaskuri f={f} echipa={echipa} categorii={categorii} proiecte={proiecte} eu={eu} />

      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-3">
        {coloane
          .filter((c) => !ascunse[c.value])
          .map((c) => (
            <div
              key={c.value}
              onDragOver={(e) => {
                if (!trag) return
                e.preventDefault()
                setPeste(c.value)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setPeste((p) => (p === c.value ? null : p))
              }}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/plain') || trag
                setPeste(null)
                setTrag(null)
                if (id) muta(id, c.value)
              }}
              className={`flex w-[270px] shrink-0 flex-col rounded-xl border bg-gray-50/80 transition-colors ${
                peste === c.value ? 'border-indigo-400 bg-indigo-50/60' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 rounded-t-xl border-b border-gray-200 bg-white px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.punct }} />
                <span className="text-sm font-semibold text-gray-800">
                  {c.emoji} {c.label}
                </span>
                <span className="ml-auto rounded-full bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-500">{c.taskuri.length}</span>
              </div>
              <div className="flex min-h-[120px] flex-col gap-2 p-2">
                {c.taskuri.map((t) => (
                  <div
                    key={t.id}
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
                    className={`cursor-grab rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm hover:border-indigo-300 active:cursor-grabbing ${trag === t.id ? 'opacity-40' : ''}`}
                    style={t.category ? { borderLeft: `3px solid ${t.category.color}` } : undefined}
                  >
                    <Link href={`/admin/tasks/${t.id}`} className="block" draggable={false}>
                      <div className="flex items-start gap-1.5">
                        <Ref seq={t.seq} />
                        <span className={`text-sm font-medium leading-snug ${t.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.title}</span>
                      </div>
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {t.priority !== 'MEDIUM' && <InsignaPrioritate valoare={t.priority} mic />}
                      <Termen dueAt={t.dueAt} status={t.status} />
                      <InsignaCategorie categorie={t.category} />
                    </div>
                    {t.project && <p className="mt-1 truncate text-[11px] text-gray-500">📁 {t.project.name}</p>}
                    {t.progress > 0 && t.status !== 'DONE' && (
                      <div className="mt-1.5 h-1 rounded bg-gray-100">
                        <div className="h-1 rounded bg-indigo-500" style={{ width: `${t.progress}%` }} />
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Avatare ids={t.assigneeIds} nume={nume} />
                      {t._count?.comments > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500">
                          <ChatBubbleLeftIcon className="h-3 w-3" />
                          {t._count.comments}
                        </span>
                      )}
                      {t._count?.attachments > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-500">
                          <PaperClipIcon className="h-3 w-3" />
                          {t._count.attachments}
                        </span>
                      )}
                      {/* Pe telefon nu se poate trage — mutarea se face de aici */}
                      <select
                        value={t.status}
                        onChange={(e) => muta(t.id, e.target.value)}
                        className="ml-auto max-w-[96px] rounded border border-gray-200 bg-white px-1 py-0.5 text-[10px] text-gray-600"
                        aria-label="Mută în"
                      >
                        {STATUSURI_TASK.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.emoji} {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {!c.taskuri.length && <p className="py-6 text-center text-[11px] text-gray-400">Trage aici</p>}
              </div>
            </div>
          ))}
      </div>

      {formular && (
        <FormularTask
          echipa={echipa}
          categorii={categorii}
          proiecte={proiecte}
          eu={eu}
          onInchide={() => setFormular(false)}
          onSalvat={incarca}
        />
      )}
    </div>
  )
}
