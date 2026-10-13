'use client'

/**
 * Pagina unui task: status, progres, detalii, fișiere, comentarii și istoric.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { STATUSURI_TASK, statusTask, INTERVALE_REAMINTIRE } from '@/lib/lucru/constante'
import { dataOra, relativ } from '@/lib/lucru/timp'
import {
  cere,
  clsBtnAlb,
  InsignaStatusTask,
  InsignaPrioritate,
  InsignaCategorie,
  Ref,
  Avatar,
} from '@/components/admin/lucru/ui'
import FormularTask from '@/components/admin/lucru/FormularTask'
import Atasamente from '@/components/admin/lucru/Atasamente'
import { Termen } from '../TasksClient'

const SURSE = { WEB: 'panou', VOICE: '🎤 voce', TELEGRAM: 'Telegram' }

function textActivitate(a) {
  switch (a.action) {
    case 'CREATED':
      return `a creat taskul${a.note ? ` (${a.note})` : ''}`
    case 'STATUS_CHANGED':
      return (
        <>
          a mutat din <b>{statusTask(a.fromStatus).label}</b> în <b>{statusTask(a.toStatus).label}</b>
          {a.meta?.sursa === 'TELEGRAM' && <span className="text-gray-400"> · din Telegram</span>}
        </>
      )
    case 'PROGRESS':
      return (
        <>
          a schimbat progresul: {a.meta?.de ?? 0}% → <b>{a.meta?.la}%</b>
          {a.meta?.sursa === 'TELEGRAM' && <span className="text-gray-400"> · din Telegram</span>}
        </>
      )
    case 'EDITED':
      return (
        <>
          {a.note || 'a editat taskul'}
          {a.meta?.termenNou !== undefined && (
            <span className="text-gray-500">
              {' '}
              (termen: {a.meta.termenVechi || 'fără'} → {a.meta.termenNou || 'fără'})
            </span>
          )}
        </>
      )
    case 'COMMENTED':
      return 'a comentat'
    case 'ATTACHMENT_ADDED':
      return (
        <>
          a atașat <b>{a.note}</b>
        </>
      )
    case 'ATTACHMENT_DELETED':
      return (
        <>
          a șters fișierul <b>{a.note}</b>
        </>
      )
    default:
      return a.note || a.action
  }
}

const EMOJI_ACTIVITATE = {
  CREATED: '🆕',
  STATUS_CHANGED: '🔄',
  PROGRESS: '📈',
  EDITED: '✏️',
  COMMENTED: '💬',
  ATTACHMENT_ADDED: '📎',
  ATTACHMENT_DELETED: '🗑️',
}

export default function TaskDetaliu({ id, eu, esteSuperAdmin, echipa, categorii, proiecte, poateEdita, poateSterge }) {
  const router = useRouter()
  const [task, setTask] = useState(null)
  const [eroare, setEroare] = useState(null)
  const [editez, setEditez] = useState(false)
  const [comentariu, setComentariu] = useState('')
  const [trimit, setTrimit] = useState(false)
  const [progres, setProgres] = useState(0)

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])

  const incarca = useCallback(async () => {
    try {
      const { task } = await cere(`/api/admin/tasks/${id}`)
      setTask(task)
      setProgres(task.progress)
    } catch (e) {
      setEroare(e.message)
    }
  }, [id])

  useEffect(() => {
    incarca()
  }, [incarca])

  if (eroare) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {eroare} ·{' '}
        <Link href="/admin/tasks" className="font-semibold underline">
          Înapoi la taskuri
        </Link>
      </div>
    )
  }
  if (!task) return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />

  const alMeu = task.creatorId === eu || task.assigneeIds.includes(eu)
  const pot = poateEdita || esteSuperAdmin || alMeu
  const potSterge = poateSterge || esteSuperAdmin || task.creatorId === eu

  async function patch(corp, mesaj) {
    try {
      await cere(`/api/admin/tasks/${id}`, { metoda: 'PATCH', corp })
      if (mesaj) toast.success(mesaj)
      await incarca()
    } catch (e) {
      toast.error(e.message)
      setProgres(task.progress)
    }
  }

  async function trimiteComentariu(e) {
    e.preventDefault()
    if (!comentariu.trim()) return
    setTrimit(true)
    try {
      await cere(`/api/admin/tasks/${id}/comentarii`, { metoda: 'POST', corp: { body: comentariu } })
      setComentariu('')
      await incarca()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTrimit(false)
    }
  }

  async function sterge() {
    if (!confirm(`Ștergi definitiv taskul „${task.title}" cu tot cu comentarii și fișiere?`)) return
    try {
      await cere(`/api/admin/tasks/${id}`, { metoda: 'DELETE' })
      toast.success('Taskul a fost șters')
      router.push('/admin/tasks')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const reamintire = INTERVALE_REAMINTIRE.find((r) => r.value === (task.reminderIntervalMinutes || 0))

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/tasks" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-700">
          <ArrowLeftIcon className="h-4 w-4" /> Taskuri
        </Link>
        <div className="flex gap-1.5">
          {pot && (
            <button type="button" onClick={() => setEditez(true)} className={clsBtnAlb}>
              <PencilSquareIcon className="h-4 w-4" /> Editează
            </button>
          )}
          {potSterge && (
            <button type="button" onClick={sterge} className={`${clsBtnAlb} text-red-600 hover:bg-red-50`}>
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Antet ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Ref seq={task.seq} />
          <InsignaStatusTask status={task.status} />
          <InsignaPrioritate valoare={task.priority} />
          <InsignaCategorie categorie={task.category} />
          <Termen dueAt={task.dueAt} status={task.status} />
        </div>
        <h1 className="mt-2 text-xl font-bold text-gray-900">{task.title}</h1>
        {task.description && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{task.description}</p>}

        {pot && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
            <div className="flex flex-wrap gap-1.5">
              {STATUSURI_TASK.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={task.status === s.value}
                  onClick={() => patch({ status: s.value }, `${s.emoji} ${s.label}`)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    task.status === s.value ? `${s.culoare} ring-2 ring-indigo-300` : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 text-xs font-semibold text-gray-600">Progres</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progres}
                onChange={(e) => setProgres(Number(e.target.value))}
                onPointerUp={() => progres !== task.progress && patch({ progress: progres })}
                onKeyUp={() => progres !== task.progress && patch({ progress: progres })}
                className="flex-1 accent-indigo-600"
              />
              <span className="w-10 text-right text-sm font-bold text-indigo-700">{progres}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {/* ── Fișiere ─────────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <Atasamente
              taskId={task.id}
              initiale={task.attachments}
              poateSterge={(a) => a.userId === eu || poateEdita || esteSuperAdmin}
              onSchimbare={incarca}
            />
          </div>

          {/* ── Comentarii ──────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">💬 Comentarii {task.comments.length > 0 && `(${task.comments.length})`}</h3>
            {task.comments.length === 0 && <p className="mb-2 text-xs text-gray-400">Niciun comentariu. Cei implicați primesc comentariile pe Telegram.</p>}
            <ul className="space-y-3">
              {task.comments.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <Avatar nume={c.userName || nume[c.userId]} />
                  <div className="min-w-0 flex-1 rounded-lg bg-gray-50 px-3 py-2">
                    <p className="text-[11px] text-gray-500">
                      <b className="text-gray-800">{c.userName || nume[c.userId] || 'Cineva'}</b> · {relativ(c.createdAt)}
                      {c.source === 'TELEGRAM' && ' · din Telegram'}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-gray-800">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <form onSubmit={trimiteComentariu} className="mt-3 flex items-end gap-2">
              <textarea
                value={comentariu}
                onChange={(e) => setComentariu(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) trimiteComentariu(e)
                }}
                rows={2}
                placeholder="Scrie un comentariu… (Ctrl+Enter trimite)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button type="submit" disabled={trimit || !comentariu.trim()} className="rounded-lg bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 disabled:opacity-50" aria-label="Trimite">
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-3">
          {/* ── Detalii ─────────────────────────────────── */}
          <div className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <Detaliu eticheta="Cine se ocupă">
              {task.assigneeIds.length ? (
                <div className="flex flex-wrap gap-1">
                  {task.assigneeIds.map((aid) => (
                    <span key={aid} className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-0.5 pl-0.5 pr-2 text-xs">
                      <Avatar nume={nume[aid] || '?'} mic /> {nume[aid] || 'cont inactiv'}
                    </span>
                  ))}
                </div>
              ) : (
                '—'
              )}
            </Detaliu>
            <Detaliu eticheta="Creat de">
              {nume[task.creatorId] || '—'} · {dataOra(task.createdAt)}
              {task.createdFrom !== 'WEB' && <span className="text-gray-500"> · {SURSE[task.createdFrom] || task.createdFrom}</span>}
            </Detaliu>
            <Detaliu eticheta="Termen">{task.dueAt ? dataOra(task.dueAt) : 'fără'}</Detaliu>
            <Detaliu eticheta="Reamintire">
              {reamintire?.label || '—'}
              {task.nextReminderAt && !['DONE', 'CANCELLED'].includes(task.status) && (
                <span className="text-gray-500"> · următoarea {dataOra(task.nextReminderAt)}</span>
              )}
            </Detaliu>
            {task.project && (
              <Detaliu eticheta="Proiect">
                <Link href={`/admin/projects/${task.project.id}`} className="font-medium text-indigo-700 hover:underline">
                  📁 {task.project.name}
                </Link>
              </Detaliu>
            )}
            {task.lead && (
              <Detaliu eticheta="Lead">
                <Link href="/admin/leads" className="font-medium text-indigo-700 hover:underline">
                  🎯 {task.lead.denumire}
                </Link>
                {task.lead.telefon && (
                  <a href={`tel:${task.lead.telefon}`} className="block text-xs text-gray-500 hover:text-indigo-700">
                    📞 {task.lead.telefon}
                  </a>
                )}
              </Detaliu>
            )}
            <Detaliu eticheta="Ultima modificare">{relativ(task.updatedAt)}</Detaliu>
          </div>

          {/* ── Istoric ─────────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">🕓 Istoric</h3>
            <ol className="relative space-y-3 border-l border-gray-200 pl-4">
              {task.activities.map((a) => (
                <li key={a.id} className="text-xs text-gray-700">
                  <span className="absolute -left-[9px] grid h-[18px] w-[18px] place-items-center rounded-full bg-white text-[10px] ring-1 ring-gray-200">
                    {EMOJI_ACTIVITATE[a.action] || '•'}
                  </span>
                  <b>{a.userName || nume[a.userId] || 'Cineva'}</b> {textActivitate(a)}
                  <div className="text-[10px] text-gray-400">{dataOra(a.createdAt)}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {editez && (
        <FormularTask
          task={task}
          echipa={echipa}
          categorii={categorii}
          proiecte={proiecte}
          eu={eu}
          onInchide={() => setEditez(false)}
          onSalvat={incarca}
        />
      )}
    </div>
  )
}

function Detaliu({ eticheta, children }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{eticheta}</div>
      <div className="text-gray-800">{children}</div>
    </div>
  )
}
