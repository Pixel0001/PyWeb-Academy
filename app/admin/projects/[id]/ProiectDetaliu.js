'use client'

/** Pagina unui proiect: detalii, hartă, taskuri, fișiere și programări. */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { STATUSURI_PROIECT, marimeFisier } from '@/lib/lucru/constante'
import { dataOra, eticheta, oraLocala } from '@/lib/lucru/timp'
import {
  cere,
  clsBtn,
  clsBtnAlb,
  InsignaStatusProiect,
  InsignaStatusTask,
  InsignaStatusProgramare,
  InsignaPrioritate,
  Ref,
  Avatare,
  Avatar,
} from '@/components/admin/lucru/ui'
import FormularProiect from '@/components/admin/lucru/FormularProiect'
import FormularTask from '@/components/admin/lucru/FormularTask'
import FormularProgramare from '@/components/admin/lucru/FormularProgramare'
import { HartaPunct, LinkuriNavigare } from '@/components/admin/lucru/Harti'
import { Termen } from '../../tasks/TasksClient'

export default function ProiectDetaliu({
  id,
  eu,
  echipa,
  categorii,
  proiecte,
  poateEdita,
  poateSterge,
  poateCreaTask,
  poateCreaProgramare,
}) {
  const router = useRouter()
  const [date, setDate] = useState(null)
  const [eroare, setEroare] = useState(null)
  const [fereastra, setFereastra] = useState(null) // editare | task | programare
  const [tab, setTab] = useState('taskuri')
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {eroare} ·{' '}
        <Link href="/admin/projects" className="font-semibold underline">
          Înapoi la proiecte
        </Link>
      </div>
    )
  }
  if (!date) return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />

  const { proiect: p, taskuri, fisiere, programari } = date
  const gata = taskuri.filter((t) => t.status === 'DONE').length
  const deschise = taskuri.filter((t) => !['DONE', 'CANCELLED'].includes(t.status))

  async function schimbaStatus(status) {
    try {
      await cere(`/api/admin/projects/${id}`, { metoda: 'PATCH', corp: { status } })
      await incarca()
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function sterge() {
    if (!confirm(`Ștergi proiectul „${p.name}"? Taskurile și programările lui rămân, doar fără proiect.`)) return
    try {
      await cere(`/api/admin/projects/${id}`, { metoda: 'DELETE' })
      toast.success('Proiect șters')
      router.push('/admin/projects')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const TABURI = [
    ['taskuri', `✅ Taskuri (${deschise.length}/${taskuri.length})`],
    ['fisiere', `📎 Fișiere (${fisiere.length})`],
    ['programari', `📅 Programări (${programari.length})`],
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/projects" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-700">
          <ArrowLeftIcon className="h-4 w-4" /> Proiecte
        </Link>
        <div className="flex gap-1.5">
          {poateEdita && (
            <button type="button" onClick={() => setFereastra('editare')} className={clsBtnAlb}>
              <PencilSquareIcon className="h-4 w-4" /> Editează
            </button>
          )}
          {poateSterge && (
            <button type="button" onClick={sterge} className={`${clsBtnAlb} text-red-600 hover:bg-red-50`}>
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <Ref seq={p.seq} />
            <InsignaStatusProiect status={p.status} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{p.name}</h1>
          {p.description && <p className="whitespace-pre-wrap text-sm text-gray-700">{p.description}</p>}

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {(p.clientName || p.clientPhone) && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Client</div>
                <div className="text-gray-800">{p.clientName || '—'}</div>
                {p.clientPhone && (
                  <a href={`tel:${p.clientPhone}`} className="text-xs text-indigo-700 hover:underline">
                    📞 {p.clientPhone}
                  </a>
                )}
              </div>
            )}
            {p.lead && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Lead</div>
                <Link href="/admin/leads" className="font-medium text-indigo-700 hover:underline">
                  🎯 {p.lead.denumire}
                </Link>
              </div>
            )}
            {p.responsabilId && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Responsabil</div>
                <div className="flex items-center gap-1.5 text-gray-800">
                  <Avatar nume={nume[p.responsabilId] || '?'} mic /> {nume[p.responsabilId] || '—'}
                </div>
              </div>
            )}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Progres</div>
              <div className="text-gray-800">
                {gata}/{taskuri.length} taskuri gata
              </div>
              <div className="mt-1 h-1.5 rounded bg-gray-100">
                <div className="h-1.5 rounded bg-green-500" style={{ width: `${taskuri.length ? (gata / taskuri.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          {poateEdita && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
              {STATUSURI_PROIECT.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={p.status === s.value}
                  onClick={() => schimbaStatus(s.value)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    p.status === s.value ? `${s.culoare} ring-2 ring-indigo-300` : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.punct }} /> {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Locație</div>
          {p.address && <p className="text-sm text-gray-800">📍 {p.address}</p>}
          {p.lat != null && p.lng != null ? (
            <HartaPunct lat={p.lat} lng={p.lng} address={p.address} inaltime="h-52" />
          ) : (
            <p className="text-xs text-gray-400">
              {p.address ? 'Fără pin pe hartă — ' : 'Fără adresă — '}
              {poateEdita ? (
                <button type="button" className="text-indigo-600 underline" onClick={() => setFereastra('editare')}>
                  adaugă din Editează
                </button>
              ) : (
                'nimic de arătat'
              )}
            </p>
          )}
          <LinkuriNavigare lat={p.lat} lng={p.lng} address={p.address} mic />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 p-2">
          {TABURI.map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setTab(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === v ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {l}
            </button>
          ))}
          <div className="ml-auto flex gap-1.5">
            {tab === 'taskuri' && poateCreaTask && (
              <button type="button" onClick={() => setFereastra('task')} className={`${clsBtn} px-2.5 py-1.5 text-xs`}>
                <PlusIcon className="h-3.5 w-3.5" /> Task
              </button>
            )}
            {tab === 'programari' && poateCreaProgramare && (
              <button type="button" onClick={() => setFereastra('programare')} className={`${clsBtn} px-2.5 py-1.5 text-xs`}>
                <PlusIcon className="h-3.5 w-3.5" /> Programare
              </button>
            )}
          </div>
        </div>

        {tab === 'taskuri' &&
          (taskuri.length ? (
            <ul className="divide-y divide-gray-100">
              {taskuri.map((t) => (
                <li key={t.id}>
                  <Link href={`/admin/tasks/${t.id}`} className="flex flex-wrap items-center gap-2 px-3 py-2.5 hover:bg-gray-50">
                    <Ref seq={t.seq} />
                    <span className={`min-w-0 flex-1 truncate text-sm ${t.status === 'DONE' ? 'text-gray-400 line-through' : 'font-medium text-gray-900'}`}>
                      {t.title}
                    </span>
                    {t.priority !== 'MEDIUM' && <InsignaPrioritate valoare={t.priority} mic />}
                    <Termen dueAt={t.dueAt} status={t.status} />
                    {t.nrAtasamente > 0 && <span className="text-[11px] text-gray-500">📎{t.nrAtasamente}</span>}
                    <InsignaStatusTask status={t.status} mic />
                    <Avatare ids={t.assigneeIds} nume={nume} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-center text-sm text-gray-500">Niciun task în proiect.</p>
          ))}

        {tab === 'fisiere' &&
          (fisiere.length ? (
            <ul className="grid gap-2 p-3 sm:grid-cols-2">
              {fisiere.map((a) => (
                <li key={a.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                  {/^image\//.test(a.mimeType || '') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded bg-gray-100">📄</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs font-medium text-gray-900 hover:text-indigo-700">
                      {a.name}
                    </a>
                    <Link href={`/admin/tasks/${a.taskId}`} className="block truncate text-[11px] text-gray-500 hover:text-indigo-700">
                      {marimeFisier(a.size)} · din „{a.taskTitle}”
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-center text-sm text-gray-500">Fișierele se adaugă pe taskurile proiectului și apar toate aici.</p>
          ))}

        {tab === 'programari' &&
          (programari.length ? (
            <ul className="divide-y divide-gray-100">
              {programari.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/programari?zi=${a.dateKey}`} className="flex flex-wrap items-center gap-2 px-3 py-2.5 hover:bg-gray-50">
                    <span className="w-40 shrink-0 text-xs font-semibold text-gray-700">
                      {eticheta(a.dateKey)}, {oraLocala(a.startAt)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                      {a.title} · {a.contactName}
                      {a.company && <span className="text-gray-500"> ({a.company})</span>}
                    </span>
                    <InsignaStatusProgramare status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-center text-sm text-gray-500">Nicio programare legată de proiect.</p>
          ))}
      </div>

      <p className="text-center text-[11px] text-gray-400">
        Creat {dataOra(p.createdAt)} · actualizat {dataOra(p.updatedAt)}
      </p>

      {fereastra === 'editare' && (
        <FormularProiect proiect={p} echipa={echipa} eu={eu} onInchide={() => setFereastra(null)} onSalvat={incarca} />
      )}
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
        <FormularProgramare
          implicit={{ proiect: p }}
          echipa={echipa}
          categorii={categorii}
          eu={eu}
          onInchide={() => setFereastra(null)}
          onSalvat={incarca}
        />
      )}
    </div>
  )
}
