'use client'

/**
 * Pagina unui task — ca în StefanPWA: antet cu #număr și status, detalii,
 * butoanele de status, atașamente, comentarii și istoricul complet cu
 * durata dintre evenimente.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { STATUSURI_TASK, ST_TASK, PROGRES, statusTask, prioritate, INTERVALE_REAMINTIRE } from '@/lib/lucru/constante'
import { fmtDue, fmtDataOra, fmtDurata } from '@/lib/lucru/timp'
import { cere, MetaRow, dlgTextarea } from '@/components/admin/lucru/ui'
import FormularTask from '@/components/admin/lucru/FormularTask'
import Atasamente from '@/components/admin/lucru/Atasamente'

const btnActiune =
  'tap inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium hover:bg-surface-2 disabled:opacity-50'

function evenimente(task, nume) {
  const ev = [{ key: 'creat', at: task.createdAt, dot: 'bg-st-new', action: 'CREATED', userName: nume[task.creatorId] || '—' }]
  const activitati = [...(task.activities || [])].reverse()
  for (const a of activitati) {
    const baza = { key: a.id, at: a.createdAt, userName: a.userName || nume[a.userId] || '—', action: a.action, note: a.note, meta: a.meta }
    if (a.action === 'CREATED') continue
    if (a.action === 'STATUS_CHANGED') {
      if (!a.toStatus) continue
      ev.push({ ...baza, dot: ST_TASK[a.toStatus]?.dot || 'bg-brand', fromStatus: a.fromStatus, toStatus: a.toStatus })
    } else if (a.action === 'PROGRESS') ev.push({ ...baza, dot: 'bg-st-progress' })
    else if (a.action === 'EDITED') ev.push({ ...baza, dot: 'bg-brand/60' })
    else if (a.action === 'COMMENTED') ev.push({ ...baza, dot: 'bg-st-confirmed' })
    else if (a.action === 'ATTACHMENT_ADDED') ev.push({ ...baza, dot: 'bg-st-progress' })
    else if (a.action === 'ATTACHMENT_DELETED') ev.push({ ...baza, dot: 'bg-st-cancelled' })
    else ev.push({ ...baza, dot: 'bg-brand' })
  }
  for (let i = 1; i < ev.length; i++) ev[i].durata = new Date(ev[i].at) - new Date(ev[i - 1].at)
  return ev
}

export default function TaskDetaliu({ id, eu, esteSuperAdmin, echipa, categorii, proiecte, poateEdita, poateSterge }) {
  const router = useRouter()
  const [task, setTask] = useState(null)
  const [eroare, setEroare] = useState(null)
  const [editez, setEditez] = useState(false)
  const [ciorna, setCiorna] = useState('')
  const [trimit, setTrimit] = useState(false)
  const [ocupat, setOcupat] = useState(false)

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])

  const incarca = useCallback(async () => {
    try {
      const r = await cere(`/api/admin/tasks/${id}`)
      setTask(r.task)
    } catch (e) {
      setEroare(e.message)
    }
  }, [id])

  useEffect(() => {
    let viu = true
    cere(`/api/admin/tasks/${id}`)
      .then((r) => viu && setTask(r.task))
      .catch((e) => viu && setEroare(e.message))
    return () => {
      viu = false
    }
  }, [id])

  if (eroare) {
    return (
      <div className="lucru mx-auto w-full max-w-2xl">
        <div className="lcard p-6 text-sm text-st-cancelled">
          {eroare} ·{' '}
          <Link href="/admin/tasks" className="font-semibold underline">
            Înapoi la task-uri
          </Link>
        </div>
      </div>
    )
  }
  if (!task) return <div className="mx-auto h-64 w-full max-w-2xl animate-pulse rounded-2xl bg-surface-2" />

  const pot = poateEdita || esteSuperAdmin || task.creatorId === eu || task.assigneeIds.includes(eu)
  const potSterge = poateSterge || esteSuperAdmin || task.creatorId === eu
  const inchis = ['DONE', 'CANCELLED'].includes(task.status)
  const intarziere = task.dueAt && !inchis ? Date.now() - new Date(task.dueAt).getTime() : 0
  const asignati = task.assigneeIds.map((x) => nume[x]).filter(Boolean).join(', ')
  const ev = evenimente(task, nume)

  async function patch(corp, mesaj) {
    setOcupat(true)
    try {
      await cere(`/api/admin/tasks/${id}`, { metoda: 'PATCH', corp })
      if (mesaj) toast.success(mesaj)
      await incarca()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setOcupat(false)
    }
  }

  async function trimiteComentariu(e) {
    e.preventDefault()
    if (!ciorna.trim()) return
    setTrimit(true)
    try {
      await cere(`/api/admin/tasks/${id}/comentarii`, { metoda: 'POST', corp: { body: ciorna } })
      setCiorna('')
      toast.success('Comentariu adăugat')
      await incarca()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTrimit(false)
    }
  }

  async function sterge() {
    if (!confirm('Ștergi definitiv taskul, cu tot cu comentarii și fișiere?')) return
    try {
      await cere(`/api/admin/tasks/${id}`, { metoda: 'DELETE' })
      toast.success('Task șters')
      router.push('/admin/tasks')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="lucru mx-auto w-full max-w-2xl text-ink">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/admin/tasks" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
          ← Înapoi la task-uri
        </Link>
        <div className="flex items-center gap-2">
          {pot && (
            <button type="button" onClick={() => setEditez(true)} className={`${btnActiune} text-ink-soft`}>
              <PencilIcon className="size-4" /> Editează
            </button>
          )}
          {potSterge && (
            <button type="button" onClick={sterge} className={`${btnActiune} text-st-cancelled`}>
              <TrashIcon className="size-4" /> Șterge
            </button>
          )}
        </div>
      </div>

      {/* ── Antet ─────────────────────────────────────── */}
      <div className="lcard mb-3 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {task.seq != null && <span className="rounded bg-brand/10 px-2 py-0.5 font-mono text-sm font-bold text-brand">#{task.seq}</span>}
          <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] text-ink-soft">Task</span>
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${ST_TASK[task.status].badge}`}>{statusTask(task.status).label}</span>
          {intarziere > 0 && (
            <span className="rounded bg-st-cancelled/15 px-2 py-0.5 text-[11px] font-semibold text-st-cancelled">⏰ Întârziere {fmtDurata(intarziere)}</span>
          )}
          {task.category && (
            <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-2 py-0.5 text-[11px] text-ink-soft">
              <span className="size-1.5 rounded-full" style={{ background: task.category.color }} />
              {task.category.name}
            </span>
          )}
        </div>

        <h1 className="mb-3 break-words text-xl font-bold leading-tight">{task.title}</h1>

        {task.description && <p className="mb-3 whitespace-pre-wrap rounded-xl bg-surface-2 px-3 py-2.5 text-sm">{task.description}</p>}

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <MetaRow eticheta="Prioritate" valoare={prioritate(task.priority).label} />
          {asignati && <MetaRow eticheta="Asignat" valoare={asignati} />}
          {task.project && (
            <MetaRow eticheta="Proiect">
              <Link href={`/admin/projects/${task.project.id}`} className="text-sm font-medium text-brand hover:underline">
                {task.project.name}
              </Link>
            </MetaRow>
          )}
          {task.project?.lat != null ? (
            <MetaRow eticheta="Locație">
              <a
                href={`https://maps.google.com/maps?q=${task.project.lat},${task.project.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                📍 {task.project.address || 'Vezi pe hartă'}
              </a>
            </MetaRow>
          ) : (
            task.project?.address && (
              <MetaRow eticheta="Locație">
                <a
                  href={`https://maps.google.com/maps?q=${encodeURIComponent(task.project.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  📍 {task.project.address}
                </a>
              </MetaRow>
            )
          )}
          {task.lead && (
            <MetaRow eticheta="Lead">
              <Link href="/admin/leads" className="text-sm font-medium text-brand hover:underline">
                {task.lead.denumire}
              </Link>
              {task.lead.telefon && (
                <a href={`tel:${task.lead.telefon}`} className="block text-[11px] text-ink-soft">
                  📞 {task.lead.telefon}
                </a>
              )}
            </MetaRow>
          )}
          {task.progress > 0 && <MetaRow eticheta="Progres" valoare={`${task.progress}%`} />}
          {task.dueAt && <MetaRow eticheta="Scadent" valoare={fmtDue(task.dueAt)} alerta={intarziere > 0} />}
          {task.reminderIntervalMinutes && (
            <MetaRow
              eticheta="Reamintire"
              valoare={INTERVALE_REAMINTIRE.find((r) => r.value === task.reminderIntervalMinutes)?.label || `${task.reminderIntervalMinutes} min`}
            />
          )}
          <MetaRow eticheta="Creat" valoare={fmtDataOra(task.createdAt)} />
          <MetaRow eticheta="Creat de" valoare={`${nume[task.creatorId] || '—'}${task.createdFrom === 'VOICE' ? ' · 🎤' : task.createdFrom === 'TELEGRAM' ? ' · Telegram' : ''}`} />
        </div>

        {pot && (
          <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap gap-1.5">
              {STATUSURI_TASK.map((s) => {
                const activ = s.value === task.status
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => !activ && patch({ status: s.value }, `Status: ${s.label}`)}
                    disabled={ocupat}
                    className={[
                      'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50',
                      ST_TASK[s.value].btn,
                      activ ? ST_TASK[s.value].activ : '',
                      activ ? 'scale-105 shadow-sm' : 'opacity-70',
                    ].join(' ')}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold text-ink-soft">Progres</span>
              {PROGRES.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={ocupat}
                  onClick={() => p !== task.progress && patch({ progress: p }, `Progres: ${p}%`)}
                  className={`h-7 rounded-full border px-2.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                    task.progress === p ? 'border-brand bg-brand text-white' : 'border-line text-ink-soft hover:border-brand'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Atașamente ──────────────────────────────── */}
      <div className="mb-3">
        <Atasamente taskId={task.id} initiale={task.attachments} poateSterge={(a) => a.userId === eu || poateEdita || esteSuperAdmin} onSchimbare={incarca} />
      </div>

      {/* ── Comentarii ──────────────────────────────── */}
      <div className="lcard mb-3 p-4">
        <h2 className="mb-3 text-sm font-bold">Comentarii {task.comments.length > 0 && `(${task.comments.length})`}</h2>
        {!task.comments.length && <p className="mb-3 text-sm text-ink-soft">Niciun comentariu încă.</p>}
        <div className="mb-4 flex flex-col gap-4">
          {task.comments.map((c) => (
            <div key={c.id}>
              <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-semibold">{c.userName || nume[c.userId] || '—'}</span>
                <span className="text-[11px] text-ink-soft">
                  {fmtDataOra(c.createdAt)}
                  {c.source === 'TELEGRAM' ? ' · via Telegram' : ''}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{c.body}</p>
            </div>
          ))}
        </div>
        <form onSubmit={trimiteComentariu} className="flex flex-col gap-2">
          <textarea value={ciorna} onChange={(e) => setCiorna(e.target.value)} placeholder="Scrie un comentariu…" rows={3} className={`${dlgTextarea} resize-none`} />
          <button
            type="submit"
            disabled={trimit || !ciorna.trim()}
            className="tap h-10 rounded-xl bg-brand font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
          >
            {trimit ? 'Se trimite…' : 'Adaugă comentariu'}
          </button>
        </form>
      </div>

      {/* ── Istoric ─────────────────────────────────── */}
      <div className="lcard mb-3 p-4">
        <h2 className="mb-4 text-sm font-bold">📋 Istoric complet</h2>
        <ol className="flex flex-col">
          {ev.map((e, i) => {
            const ultim = i === ev.length - 1
            return (
              <li key={e.key} className="flex gap-3">
                <div className="flex flex-col items-center pt-1">
                  <span className={`size-2.5 shrink-0 rounded-full ${e.dot}`} />
                  {!ultim && <span className="my-1.5 w-0.5 flex-1 bg-line" />}
                </div>
                <div className={`min-w-0 flex-1 ${!ultim ? 'pb-5' : ''}`}>
                  <p className={`text-sm font-semibold ${e.action === 'ATTACHMENT_DELETED' ? 'text-st-cancelled' : ''}`}>
                    {e.action === 'CREATED' && '🆕 Creat'}
                    {e.action === 'STATUS_CHANGED' && (
                      <>
                        🔄 {e.fromStatus ? `${statusTask(e.fromStatus).label} → ` : ''}
                        {statusTask(e.toStatus).label}
                      </>
                    )}
                    {e.action === 'PROGRESS' && `📈 Progres ${e.meta?.de ?? 0}% → ${e.meta?.la ?? 0}%`}
                    {e.action === 'EDITED' && '✏️ Editat'}
                    {e.action === 'COMMENTED' && '💬 Comentariu adăugat'}
                    {e.action === 'ATTACHMENT_ADDED' && '📎 Atașament adăugat'}
                    {e.action === 'ATTACHMENT_DELETED' && '🗑 Atașament șters'}
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    {e.userName} · {fmtDataOra(e.at)}
                    {e.meta?.sursa === 'TELEGRAM' && ' · via Telegram'}
                  </p>
                  {e.action === 'EDITED' && e.note && <p className="mt-0.5 text-[11px] text-ink-soft">{e.note}</p>}
                  {e.action === 'EDITED' && e.meta?.termenNou !== undefined && (
                    <p className="mt-0.5 text-[11px]">
                      📅 <span className="font-medium">Deadline:</span>{' '}
                      <span className="text-ink-soft line-through">{e.meta.termenVechi || '—'}</span> →{' '}
                      <span className="font-medium">{e.meta.termenNou || 'șters'}</span>
                    </p>
                  )}
                  {e.action === 'COMMENTED' && e.note && <p className="mt-1 truncate text-[11px] italic text-ink-soft">«{e.note}»</p>}
                  {e.action?.startsWith('ATTACHMENT') && e.note && <p className="mt-0.5 text-[11px] text-ink-soft">{e.note}</p>}
                  {e.durata > 0 && <p className="mt-0.5 text-[10px] text-ink-soft/60">⏱ {fmtDurata(e.durata)} de la evenimentul anterior</p>}
                </div>
              </li>
            )
          })}
        </ol>
        {ev.length > 1 && (
          <div className="mt-3 border-t border-line pt-3 text-[11px] text-ink-soft">
            Durată totală de la creare:{' '}
            <span className="font-semibold text-ink">{fmtDurata(new Date(ev[ev.length - 1].at) - new Date(ev[0].at))}</span>
          </div>
        )}
      </div>

      {editez && (
        <FormularTask task={task} echipa={echipa} categorii={categorii} proiecte={proiecte} eu={eu} onInchide={() => setEditez(false)} onSalvat={incarca} />
      )}
    </div>
  )
}
