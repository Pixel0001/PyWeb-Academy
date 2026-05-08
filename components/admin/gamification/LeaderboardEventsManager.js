'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon, TrophyIcon } from '@heroicons/react/24/outline'
import { LEADERBOARD_TYPES } from './shared'

export default function LeaderboardEventsManager() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [rewardsFor, setRewardsFor] = useState(null)
  const [viewingEntries, setViewingEntries] = useState(null)

  async function load() {
    setLoading(true)
    const e = await fetch('/api/admin/leaderboard-events', { cache: 'no-store' }).then(r => r.json())
    setEvents(e)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function save(data) {
    const isNew = !data.id
    const url = isNew ? '/api/admin/leaderboard-events' : `/api/admin/leaderboard-events/${data.id}`
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { toast.success('OK'); setEditing(null); load() }
    else toast.error((await res.json()).error || 'Eroare')
  }
  async function remove(id) {
    if (!confirm('Ștergi acest event? (toate scorurile și recompensele dispar)')) return
    const res = await fetch(`/api/admin/leaderboard-events/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Șters'); load() }
  }
  async function reset(id) {
    if (!confirm('Resetezi toate scorurile la 0 pentru acest event?')) return
    const res = await fetch(`/api/admin/leaderboard-events/${id}/reset`, { method: 'POST' })
    if (res.ok) { toast.success('Scoruri resetate'); load() }
  }

  function statusOf(ev) {
    const now = Date.now()
    const s = new Date(ev.startsAt).getTime()
    const e = new Date(ev.endsAt).getTime()
    if (now < s) return { label: 'Programat', cls: 'bg-blue-100 text-blue-700' }
    if (now > e) return { label: 'Încheiat',  cls: 'bg-slate-200 text-slate-600' }
    return { label: 'Activ', cls: 'bg-emerald-100 text-emerald-700 animate-pulse' }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Leaderboard Events</h2>
          <p className="text-sm text-slate-500">Competiții temporare cu recompense — fiecare începe de la 0.</p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/30"
        >
          <PlusIcon className="w-4 h-4" /> Event nou
        </button>
      </div>

      {loading && <div className="text-center py-12 text-slate-400">Se încarcă...</div>}

      {!loading && events.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
          <TrophyIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500">Niciun event încă. Creează primul!</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-3">
          {events.map(ev => {
            const st = statusOf(ev)
            const tp = LEADERBOARD_TYPES.find(t => t.value === ev.type)
            return (
              <div key={ev.id} className="bg-slate-900 rounded-2xl ring-1 ring-slate-700 overflow-hidden">
                <div
                  className="p-4 flex flex-wrap items-start gap-4"
                  style={{ background: ev.themeColor ? `linear-gradient(135deg, ${ev.themeColor}, transparent)` : undefined }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${st.cls}`}>{st.label}</span>
                      <span className="text-xs text-slate-400">{tp?.icon} {tp?.label}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{ev.name}</h3>
                    {ev.description && <p className="text-sm text-slate-300 mt-0.5">{ev.description}</p>}
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(ev.startsAt).toLocaleString('ro-RO')} → {new Date(ev.endsAt).toLocaleString('ro-RO')}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => setRewardsFor(ev)} className="px-3 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded-lg text-xs font-semibold">
                      🏆 Recompense ({ev.rewards?.length || 0})
                    </button>
                    <button onClick={() => setViewingEntries(ev)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold">
                      📊 Clasament ({ev._count?.entries || 0})
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => reset(ev.id)} className="flex-1 px-2 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs flex items-center justify-center gap-1">
                        <ArrowPathIcon className="w-3 h-3" /> Reset
                      </button>
                      <button onClick={() => setEditing(ev)} className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg">
                        <PencilIcon className="w-3 h-3" />
                      </button>
                      <button onClick={() => remove(ev.id)} className="px-2 py-1.5 bg-red-900/60 hover:bg-red-900 text-red-300 rounded-lg">
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing !== null && <EventModal item={editing} onClose={() => setEditing(null)} onSave={save} />}
      {rewardsFor && <RewardsModal event={rewardsFor} onClose={() => setRewardsFor(null)} />}
      {viewingEntries && <EntriesModal event={viewingEntries} onClose={() => setViewingEntries(null)} />}
    </div>
  )
}

function EventModal({ item, onClose, onSave }) {
  const fmt = d => d ? new Date(d).toISOString().slice(0,16) : ''
  const [form, setForm] = useState({
    id: item.id,
    name: item.name || '',
    description: item.description || '',
    type: item.type || 'XP',
    startsAt: fmt(item.startsAt) || fmt(new Date()),
    endsAt: fmt(item.endsAt) || fmt(new Date(Date.now() + 7 * 86400000)),
    active: item.active ?? true,
    themeColor: item.themeColor || '#6366f1',
  })
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-bold text-slate-900">{form.id ? 'Editează event' : 'Event nou'}</h3>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Nume"><input className={inp} value={form.name} onChange={e=>set('name', e.target.value)} /></Field>
          <Field label="Descriere"><textarea rows={2} className={inp} value={form.description} onChange={e=>set('description', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tip">
              <select className={inp} value={form.type} onChange={e=>set('type', e.target.value)}>
                {LEADERBOARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </Field>
            <Field label="Culoare temă">
              <input type="color" className="w-full h-10 rounded-lg" value={form.themeColor} onChange={e=>set('themeColor', e.target.value)} />
            </Field>
            <Field label="Start"><input type="datetime-local" className={inp} value={form.startsAt} onChange={e=>set('startsAt', e.target.value)} /></Field>
            <Field label="Sfârșit"><input type="datetime-local" className={inp} value={form.endsAt} onChange={e=>set('endsAt', e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={e=>set('active', e.target.checked)} /> Activ
          </label>
          {!form.id && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              ⚠️ La crearea event-ului, scorurile pornesc de la 0 pentru toți elevii.
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg">Anulează</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-semibold shadow">Salvează</button>
        </div>
      </div>
    </div>
  )
}

function RewardsModal({ event, onClose }) {
  const [rewards, setRewards] = useState([])
  const [cosmetics, setCosmetics] = useState([])
  const [chests, setChests] = useState([])
  const [form, setForm] = useState({ rank: 1, rankTo: '', coins: '', gems: '', cosmeticId: '', chestId: '', title: '' })

  async function load() {
    const [r, c, ch] = await Promise.all([
      fetch(`/api/admin/leaderboard-rewards?eventId=${event.id}`).then(r => r.json()),
      fetch('/api/admin/cosmetics').then(r => r.json()),
      fetch('/api/admin/chests').then(r => r.json()),
    ])
    setRewards(r); setCosmetics(c); setChests(ch)
  }
  useEffect(() => { load() }, [event.id])

  async function add() {
    const body = { eventId: event.id, ...form }
    const res = await fetch('/api/admin/leaderboard-rewards', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success('Recompensă adăugată')
      setForm({ rank: form.rank + 1, rankTo: '', coins: '', gems: '', cosmeticId: '', chestId: '', title: '' })
      load()
    } else toast.error('Eroare')
  }
  async function remove(id) {
    const res = await fetch(`/api/admin/leaderboard-rewards?id=${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-bold text-slate-900">🏆 Recompense — {event.name}</h3>
        </div>
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {rewards.length === 0 && <div className="text-center py-6 text-slate-400 text-sm">Nicio recompensă încă.</div>}
          {rewards.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg ring-1 ring-violet-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow">
                #{r.rank}{r.rankTo ? `-${r.rankTo}` : ''}
              </div>
              <div className="flex-1 text-sm space-y-0.5">
                {r.title && <div className="font-bold">{r.title}</div>}
                <div className="flex flex-wrap gap-2">
                  {r.coins && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">🪙 {r.coins}</span>}
                  {r.gems && <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-bold">💎 {r.gems}</span>}
                  {r.cosmeticId && <span className="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 rounded-full text-xs font-bold">✨ {cosmetics.find(c=>c.id===r.cosmeticId)?.name || 'Cosmetic'}</span>}
                  {r.chestId && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">🎁 {chests.find(c=>c.id===r.chestId)?.name || 'Cufăr'}</span>}
                </div>
              </div>
              <button onClick={() => remove(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div className="border-t pt-4 space-y-2">
            <h4 className="text-sm font-bold text-slate-700">Adaugă recompensă</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loc (rank)"><input type="number" className={inp} value={form.rank} onChange={e=>setForm({...form, rank: Number(e.target.value)})} /></Field>
              <Field label="Până la (opțional)"><input type="number" className={inp} value={form.rankTo} onChange={e=>setForm({...form, rankTo: e.target.value})} placeholder="ex: 10" /></Field>
              <Field label="Coins"><input type="number" className={inp} value={form.coins} onChange={e=>setForm({...form, coins: e.target.value})} /></Field>
              <Field label="Gems"><input type="number" className={inp} value={form.gems} onChange={e=>setForm({...form, gems: e.target.value})} /></Field>
              <Field label="Cosmetic">
                <select className={inp} value={form.cosmeticId} onChange={e=>setForm({...form, cosmeticId: e.target.value})}>
                  <option value="">— niciunul —</option>
                  {cosmetics.map(c => <option key={c.id} value={c.id}>{c.rarity} · {c.name}</option>)}
                </select>
              </Field>
              <Field label="Cufăr">
                <select className={inp} value={form.chestId} onChange={e=>setForm({...form, chestId: e.target.value})}>
                  <option value="">— niciunul —</option>
                  {chests.map(c => <option key={c.id} value={c.id}>{c.tier} · {c.name}</option>)}
                </select>
              </Field>
              <Field label="Titlu (opțional)">
                <input className={inp} value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="ex: Champion" />
              </Field>
            </div>
            <button onClick={add} className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold">
              + Adaugă recompensă
            </button>
          </div>
        </div>
        <div className="px-5 py-3 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg">Închide</button>
        </div>
      </div>
    </div>
  )
}

function EntriesModal({ event, onClose }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch(`/api/admin/leaderboard-events/${event.id}`).then(r => r.json()).then(setData)
  }, [event.id])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-bold text-slate-900">📊 Clasament — {event.name}</h3>
        </div>
        <div className="p-5 flex-1 overflow-y-auto">
          {!data && <div className="text-slate-400">Se încarcă...</div>}
          {data && data.entries?.length === 0 && <div className="text-center py-6 text-slate-400 text-sm">Niciun scor încă.</div>}
          {data && data.entries?.map((e, i) => (
            <div key={e.id} className="flex items-center gap-3 py-2 border-b border-slate-100">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${
                i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
              }`}>{i+1}</span>
              <span className="flex-1 truncate font-medium text-sm">{e.student?.fullName}</span>
              <span className="font-bold text-violet-700">{e.score}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg">Închide</button>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}
