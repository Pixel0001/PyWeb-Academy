'use client'

/**
 * Taskurile echipei, grupate pe status (ca în StefanPWA).
 * Clic pe un task → pagina lui (comentarii, fișiere, istoric).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PlusIcon, ChevronDownIcon, ChatBubbleLeftIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import { STATUSURI_TASK, ORDINE_PRIORITATE, statusTask } from '@/lib/lucru/constante'
import { dataOra, stareTermen } from '@/lib/lucru/timp'
import {
  cere,
  clsBtn,
  clsBtnAlb,
  InsignaPrioritate,
  InsignaCategorie,
  Ref,
  Avatare,
  Gol,
} from '@/components/admin/lucru/ui'
import FiltreTaskuri, { useFiltreTaskuri } from '@/components/admin/lucru/FiltreTaskuri'
import FormularTask from '@/components/admin/lucru/FormularTask'
import Categorii from '@/components/admin/lucru/Categorii'

const CULORI_TERMEN = {
  intarziat: 'bg-red-50 text-red-700 border-red-200',
  azi: 'bg-orange-50 text-orange-700 border-orange-200',
  maine: 'bg-amber-50 text-amber-700 border-amber-200',
  viitor: 'bg-gray-50 text-gray-600 border-gray-200',
}

export function Termen({ dueAt, status }) {
  if (!dueAt) return null
  const inchis = ['DONE', 'CANCELLED'].includes(status)
  const stare = inchis ? 'viitor' : stareTermen(dueAt)
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-1.5 py-0 text-[10px] font-semibold ${CULORI_TERMEN[stare]}`}>
      {stare === 'intarziat' ? '⚠️' : '📅'} {dataOra(dueAt)}
    </span>
  )
}

function RandTask({ t, nume, onStatus }) {
  return (
    <li className="group flex items-start gap-2 px-3 py-2.5 hover:bg-gray-50">
      <select
        value={t.status}
        onChange={(e) => onStatus(t, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        title="Schimbă statusul"
        className="mt-0.5 w-8 shrink-0 cursor-pointer appearance-none rounded-md border border-gray-200 bg-white p-0 text-center text-base leading-7 hover:border-indigo-300"
      >
        {STATUSURI_TASK.map((s) => (
          <option key={s.value} value={s.value}>
            {s.emoji} {s.label}
          </option>
        ))}
      </select>
      <Link href={`/admin/tasks/${t.id}`} className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Ref seq={t.seq} />
          <span className={`text-sm font-medium ${t.status === 'DONE' ? 'text-gray-400 line-through' : t.status === 'CANCELLED' ? 'text-gray-400' : 'text-gray-900'} group-hover:text-indigo-700`}>
            {t.title}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {t.priority !== 'MEDIUM' && <InsignaPrioritate valoare={t.priority} mic />}
          <Termen dueAt={t.dueAt} status={t.status} />
          <InsignaCategorie categorie={t.category} />
          {t.project && <span className="truncate text-[11px] text-gray-500">📁 {t.project.name}</span>}
          {t.lead && <span className="truncate text-[11px] text-gray-500">🎯 {t.lead.denumire}</span>}
          {t.reminderIntervalMinutes && !['DONE', 'CANCELLED'].includes(t.status) && (
            <span className="text-[11px]" title="Are reamintire periodică pe Telegram">🔔</span>
          )}
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
        </div>
        {t.progress > 0 && t.status !== 'DONE' && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 w-24 rounded bg-gray-100">
              <div className="h-1 rounded bg-indigo-500" style={{ width: `${t.progress}%` }} />
            </div>
            <span className="text-[10px] text-gray-500">{t.progress}%</span>
          </div>
        )}
      </Link>
      <div className="shrink-0 pt-0.5">
        <Avatare ids={t.assigneeIds} nume={nume} />
      </div>
    </li>
  )
}

export default function TasksClient({ eu, echipa, categoriiInitiale, proiecte, poateCrea, filtreUrl }) {
  const router = useRouter()
  const f = useFiltreTaskuri('pyweb.taskuri.filtre', filtreUrl)
  const [date, setDate] = useState({ taskuri: [], total: 0, statistici: {} })
  const [incarc, setIncarc] = useState(true)
  const [categorii, setCategorii] = useState(categoriiInitiale)
  const [formular, setFormular] = useState(filtreUrl.nou && poateCrea ? { implicit: {} } : null)
  const [arataCategorii, setArataCategorii] = useState(false)
  const [restranse, setRestranse] = useState({ CANCELLED: true })

  const nume = useMemo(() => Object.fromEntries(echipa.map((o) => [o.id, o.name])), [echipa])

  const incarca = useCallback(async () => {
    if (!f.gata) return
    setIncarc(true)
    try {
      setDate(await cere(`/api/admin/tasks?${f.query}`))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setIncarc(false)
    }
  }, [f.query, f.gata])

  useEffect(() => {
    incarca()
  }, [incarca])

  async function schimbaStatus(t, status) {
    const vechi = date.taskuri
    setDate((d) => ({ ...d, taskuri: d.taskuri.map((x) => (x.id === t.id ? { ...x, status } : x)) }))
    try {
      await cere(`/api/admin/tasks/${t.id}`, { metoda: 'PATCH', corp: { status } })
      toast.success(`${statusTask(status).emoji} ${statusTask(status).label}`)
    } catch (e) {
      setDate((d) => ({ ...d, taskuri: vechi }))
      toast.error(e.message)
    }
  }

  // Grupate pe status, în ordinea fluxului; în grup: urgente și termene apropiate întâi
  const grupe = useMemo(() => {
    const pe = Object.fromEntries(STATUSURI_TASK.map((s) => [s.value, []]))
    for (const t of date.taskuri) pe[t.status]?.push(t)
    for (const lista of Object.values(pe)) {
      lista.sort(
        (a, b) =>
          (ORDINE_PRIORITATE[a.priority] ?? 2) - (ORDINE_PRIORITATE[b.priority] ?? 2) ||
          (a.dueAt ? new Date(a.dueAt).getTime() : Infinity) - (b.dueAt ? new Date(b.dueAt).getTime() : Infinity)
      )
    }
    return STATUSURI_TASK.map((s) => ({ ...s, taskuri: pe[s.value] })).filter((g) => g.taskuri.length)
  }, [date.taskuri])

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">Taskuri</h1>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{date.total}</span>
          {date.statistici.alemele > 0 && (
            <button type="button" onClick={() => f.set('scope', 'mine')} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
              👤 {date.statistici.alemele} ale mele
            </button>
          )}
          {date.statistici.intarziate > 0 && (
            <button
              type="button"
              onClick={() => {
                f.set('scope', 'all')
                f.set('due', 'overdue')
              }}
              className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              ⚠️ {date.statistici.intarziate} întârziate
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link href="/admin/kanban" className={clsBtnAlb}>
            📋 Kanban
          </Link>
          <button type="button" onClick={() => setArataCategorii(true)} className={clsBtnAlb}>
            🏷️ Categorii
          </button>
          {poateCrea && (
            <button type="button" onClick={() => setFormular({ implicit: { projectId: f.filtre.project && f.filtre.project !== 'none' ? f.filtre.project : '' } })} className={clsBtn}>
              <PlusIcon className="h-4 w-4" /> Task nou
            </button>
          )}
        </div>
      </div>

      <FiltreTaskuri f={f} echipa={echipa} categorii={categorii} proiecte={proiecte} eu={eu} />

      {incarc && !date.taskuri.length ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !grupe.length ? (
        <Gol
          emoji="✅"
          titlu={f.active || f.filtre.scope !== 'all' ? 'Niciun task pe filtrele astea' : 'Niciun task încă'}
          text={poateCrea ? 'Creează unul sau dictează-l cu 🎤.' : undefined}
        >
          {poateCrea && (
            <button type="button" onClick={() => setFormular({ implicit: {} })} className={clsBtn}>
              <PlusIcon className="h-4 w-4" /> Task nou
            </button>
          )}
        </Gol>
      ) : (
        <div className={`space-y-2.5 ${incarc ? 'opacity-60' : ''}`}>
          {grupe.map((g) => (
            <section key={g.value} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setRestranse((r) => ({ ...r, [g.value]: !r[g.value] }))}
                className="flex w-full items-center gap-2 border-b border-gray-100 bg-gray-50/70 px-3 py-2 text-left"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.punct }} />
                <span className="text-sm font-semibold text-gray-800">
                  {g.emoji} {g.label}
                </span>
                <span className="rounded-full bg-white px-1.5 text-[11px] font-semibold text-gray-500">{g.taskuri.length}</span>
                <ChevronDownIcon className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${restranse[g.value] ? '-rotate-90' : ''}`} />
              </button>
              {!restranse[g.value] && (
                <ul className="divide-y divide-gray-100">
                  {g.taskuri.map((t) => (
                    <RandTask key={t.id} t={t} nume={nume} onStatus={schimbaStatus} />
                  ))}
                </ul>
              )}
            </section>
          ))}
          {date.total > date.taskuri.length && (
            <p className="text-center text-xs text-gray-500">
              Arăt primele {date.taskuri.length} din {date.total}. Restrânge filtrele ca să vezi restul.
            </p>
          )}
        </div>
      )}

      {formular && (
        <FormularTask
          implicit={formular.implicit}
          echipa={echipa}
          categorii={categorii}
          proiecte={proiecte}
          eu={eu}
          onInchide={() => setFormular(null)}
          onSalvat={(t) => {
            incarca()
            if (filtreUrl.nou) router.replace('/admin/tasks')
            return t
          }}
        />
      )}
      {arataCategorii && <Categorii categorii={categorii} onSchimbare={setCategorii} onInchide={() => setArataCategorii(false)} />}
    </div>
  )
}
