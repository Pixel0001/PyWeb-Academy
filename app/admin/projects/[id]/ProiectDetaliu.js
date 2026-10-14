'use client'

/**
 * Pagina unui proiect — ca în StefanPWA: informații, locație cu navigare și
 * hartă, task-urile (active, apoi finalizate/anulate). În plus: programările
 * proiectului.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ST_TASK, ST_PROGRAMARE, PRIO_BADGE, statusTask, statusProiect, prioritate, statusProgramare, linkuriHarta } from '@/lib/lucru/constante'
import { fmtDue, eticheta, oraLocala } from '@/lib/lucru/timp'
import { cere } from '@/components/admin/lucru/ui'
import FormularProiect from '@/components/admin/lucru/FormularProiect'
import FormularTask from '@/components/admin/lucru/FormularTask'
import FormularProgramare from '@/components/admin/lucru/FormularProgramare'
import { HartaPunct } from '@/components/admin/lucru/Harti'

const btnNav = 'tap inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold hover:bg-surface'

export default function ProiectDetaliu({ id, eu, echipa, categorii, proiecte, poateEdita, poateSterge, poateCreaTask, poateCreaProgramare }) {
  const router = useRouter()
  const [date, setDate] = useState(null)
  const [eroare, setEroare] = useState(null)
  const [fereastra, setFereastra] = useState(null)
  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])

  const incarca = useCallback(async () => {
    try {
      const r = await cere(`/api/admin/projects/${id}`)
      setDate(r)
    } catch (e) {
      setEroare(e.message)
    }
  }, [id])

  useEffect(() => {
    let viu = true
    cere(`/api/admin/projects/${id}`)
      .then((r) => viu && setDate(r))
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
          <Link href="/admin/projects" className="font-semibold underline">
            Înapoi la proiecte
          </Link>
        </div>
      </div>
    )
  }
  if (!date) return <div className="lucru mx-auto h-64 w-full max-w-2xl animate-pulse rounded-2xl bg-surface-2" />

  const { proiect: p, taskuri, programari } = date
  const active = taskuri.filter((t) => !['DONE', 'CANCELLED'].includes(t.status))
  const inchise = taskuri.filter((t) => ['DONE', 'CANCELLED'].includes(t.status))
  const areLocatie = p.lat != null && p.lng != null
  const nav = linkuriHarta(p)

  async function sterge() {
    if (!confirm(`Ștergi proiectul „${p.name}"? Task-urile și programările rămân, fără proiect.`)) return
    try {
      await cere(`/api/admin/projects/${id}`, { metoda: 'DELETE' })
      toast.success('Proiect șters')
      router.push('/admin/projects')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="lucru mx-auto w-full max-w-2xl text-ink">
      <Link href="/admin/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        ← Proiecte
      </Link>

      {/* ── Info proiect ── */}
      <div className="lcard mb-4 p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {p.seq != null && (
              <span className="mb-1 inline-block rounded bg-brand/10 px-2 py-0.5 font-mono text-xs font-bold text-brand">#{String(p.seq).padStart(3, '0')}</span>
            )}
            <h1 className="break-words text-xl font-bold">{p.name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-soft">{statusProiect(p.status).label}</span>
            {poateEdita && (
              <button
                type="button"
                onClick={() => setFereastra('editare')}
                className="tap grid size-9 place-items-center rounded-lg border border-line text-ink-soft hover:bg-surface-2"
                title="Editează"
              >
                <PencilIcon className="size-4" />
              </button>
            )}
            {poateSterge && (
              <button type="button" onClick={sterge} className="tap grid size-9 place-items-center rounded-lg border border-line text-st-cancelled hover:bg-surface-2" title="Șterge">
                <TrashIcon className="size-4" />
              </button>
            )}
          </div>
        </div>

        {p.description && <p className="mb-3 whitespace-pre-wrap text-sm text-ink-soft">{p.description}</p>}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
          {(p.clientName || p.lead) && (
            <span>
              Client: <span className="font-medium text-ink">{p.clientName || p.lead.denumire}</span>
            </span>
          )}
          {p.clientPhone && (
            <a href={`tel:${p.clientPhone}`} className="hover:text-brand">
              📞 <span className="font-medium text-ink">{p.clientPhone}</span>
            </a>
          )}
          {p.lead && (
            <span>
              Lead:{' '}
              <Link href="/admin/leads" className="font-medium text-brand hover:underline">
                {p.lead.denumire}
              </Link>
            </span>
          )}
          {p.responsabilId && nume[p.responsabilId] && (
            <span>
              Responsabil: <span className="font-medium text-ink">{nume[p.responsabilId]}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Locație ── */}
      {(areLocatie || p.address) && (
        <div className="lcard mb-4 p-5">
          <h2 className="mb-3 text-sm font-semibold">Locație</h2>
          {p.address && <p className="mb-2 text-sm text-ink-soft">📍 {p.address}</p>}
          <div className="mb-3 flex flex-wrap gap-2">
            {areLocatie ? (
              <>
                <a href={nav.waze} target="_blank" rel="noopener noreferrer" className={btnNav}>
                  🚗 Waze
                </a>
                <a href={nav.google} target="_blank" rel="noopener noreferrer" className={btnNav}>
                  🗺️ Google Maps
                </a>
                <a href={nav.apple} target="_blank" rel="noopener noreferrer" className={btnNav}>
                  🍎 Apple Maps
                </a>
              </>
            ) : (
              <a href={nav.google} target="_blank" rel="noopener noreferrer" className={btnNav}>
                🗺️ Google Maps
              </a>
            )}
          </div>
          {areLocatie && <HartaPunct lat={p.lat} lng={p.lng} address={p.address} />}
        </div>
      )}

      {/* ── Task-uri ── */}
      <div className="lcard mb-4 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">
            Task-uri
            {taskuri.length > 0 && <span className="ml-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink-soft">{taskuri.length}</span>}
          </h2>
          {poateCreaTask && (
            <button
              type="button"
              onClick={() => setFereastra('task')}
              className="tap inline-flex h-8 items-center gap-1 rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-strong"
            >
              ＋ Task nou
            </button>
          )}
        </div>

        {!taskuri.length ? (
          <p className="py-4 text-center text-sm text-ink-soft">Niciun task în acest proiect.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {active.map((t) => {
              const intarziat = t.dueAt && new Date(t.dueAt) < new Date()
              return (
                <Link key={t.id} href={`/admin/tasks/${t.id}`} className="tap flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-surface-2">
                  <span className={`size-2 shrink-0 rounded-full ${ST_TASK[t.status].dot}`} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                  {t.priority !== 'LOW' && (
                    <span className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold sm:inline ${PRIO_BADGE[t.priority]}`}>
                      {prioritate(t.priority).label}
                    </span>
                  )}
                  {t.assigneeIds.length > 0 && (
                    <span className="hidden shrink-0 text-[11px] text-ink-soft sm:inline">{t.assigneeIds.map((x) => nume[x]).filter(Boolean).join(', ')}</span>
                  )}
                  {t.dueAt && (
                    <span className={`shrink-0 font-mono text-[11px] ${intarziat ? 'font-semibold text-st-cancelled' : 'text-ink-soft'}`}>{fmtDue(t.dueAt)}</span>
                  )}
                  <span className="hidden shrink-0 text-[11px] text-ink-soft sm:inline">{statusTask(t.status).label}</span>
                </Link>
              )
            })}
            {inchise.length > 0 && (
              <>
                <p className="mt-2 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Finalizate și anulate ({inchise.length})</p>
                {inchise.map((t) => (
                  <Link
                    key={t.id}
                    href={`/admin/tasks/${t.id}`}
                    className="tap flex items-center gap-2.5 rounded-xl px-2.5 py-2 opacity-50 hover:bg-surface-2 hover:opacity-100"
                  >
                    <span className={`size-2 shrink-0 rounded-full ${ST_TASK[t.status].dot}`} />
                    <span className="min-w-0 flex-1 truncate text-sm line-through">{t.title}</span>
                    <span className="shrink-0 text-[11px] text-ink-soft">{statusTask(t.status).label}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Programări ── */}
      <div className="lcard mb-4 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">
            Programări
            {programari.length > 0 && <span className="ml-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink-soft">{programari.length}</span>}
          </h2>
          {poateCreaProgramare && (
            <button
              type="button"
              onClick={() => setFereastra('programare')}
              className="tap inline-flex h-8 items-center gap-1 rounded-lg bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-strong"
            >
              ＋ Programare
            </button>
          )}
        </div>
        {!programari.length ? (
          <p className="py-4 text-center text-sm text-ink-soft">Nicio programare legată de proiect.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {programari.map((a) => (
              <Link key={a.id} href={`/admin/programari?zi=${a.dateKey}`} className="tap flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-surface-2">
                <span className={`size-2 shrink-0 rounded-full ${ST_PROGRAMARE[a.status].dot}`} />
                <span className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand">{oraLocala(a.startAt)}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {a.contactName}
                  {a.title && <span className="font-normal text-ink-soft"> · {a.title}</span>}
                </span>
                <span className="hidden shrink-0 text-[11px] text-ink-soft sm:inline">{eticheta(a.dateKey)}</span>
                <span className="shrink-0 text-[11px] text-ink-soft">{statusProgramare(a.status).label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {fereastra === 'editare' && <FormularProiect proiect={p} echipa={echipa} eu={eu} onInchide={() => setFereastra(null)} onSalvat={incarca} />}
      {fereastra === 'task' && (
        <FormularTask
          implicit={{ projectId: p.id, assigneeIds: p.responsabilId ? [p.responsabilId] : undefined }}
          echipa={echipa}
          categorii={categorii}
          proiecte={proiecte.some((x) => x.id === p.id) ? proiecte : [{ id: p.id, name: p.name }, ...proiecte]}
          eu={eu}
          onInchide={() => setFereastra(null)}
          onSalvat={incarca}
        />
      )}
      {fereastra === 'programare' && (
        <FormularProgramare implicit={{ proiect: p }} echipa={echipa} categorii={categorii} eu={eu} onInchide={() => setFereastra(null)} onSalvat={incarca} />
      )}
    </div>
  )
}
