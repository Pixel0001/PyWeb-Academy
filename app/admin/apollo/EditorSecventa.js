'use client'

/**
 * Editorul de secvențe — scrii emailurile aici, nu în Apollo.
 *
 * O secvență = primul email + follow-up-urile. Fiecare pas are un text și o
 * așteptare față de pasul dinainte. Apollo trimite follow-up-urile în ACELAȘI
 * fir de discuție, ca destinatarul să vadă contextul, și se oprește singur
 * când cineva răspunde.
 */

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'

const input =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

const PAS_NOU = { subiect: '', corp: '', asteapta: 3, unitate: 'day' }

const UNITATI = [
  { valoare: 'day', eticheta: 'zile' },
  { valoare: 'hour', eticheta: 'ore' },
  { valoare: 'minute', eticheta: 'minute' },
]

export default function EditorSecventa({ onInchide, onCreata }) {
  const [nume, setNume] = useState('')
  const [programareId, setProgramareId] = useState('')
  const [programari, setProgramari] = useState([])
  const [variabile, setVariabile] = useState([])
  const [pasi, setPasi] = useState([
    { subiect: '', corp: '' },
    { ...PAS_NOU },
  ])
  const [salveaza, setSalveaza] = useState(false)
  const [campActiv, setCampActiv] = useState(null) // unde inserăm variabila

  useEffect(() => {
    fetch('/api/admin/apollo/secvente')
      .then((r) => r.json())
      .then((d) => {
        setProgramari(d.programari || [])
        setVariabile(d.variabile || [])
        const implicit = (d.programari || []).find((p) => p.implicit)
        if (implicit) setProgramareId(implicit.id)
      })
      .catch(() => toast.error('Nu am putut citi programele de trimitere'))
  }, [])

  function schimbaPas(index, camp, valoare) {
    setPasi((p) => p.map((x, i) => (i === index ? { ...x, [camp]: valoare } : x)))
  }

  function inserVariabila(cod) {
    if (!campActiv) {
      toast('Pune întâi cursorul în câmpul unde vrei variabila', { icon: '👆' })
      return
    }
    const { index, camp } = campActiv
    schimbaPas(index, camp, (pasi[index][camp] || '') + cod)
  }

  async function salveazaSecventa(porneste) {
    if (!nume.trim()) return toast.error('Dă-i un nume secvenței')
    if (!programareId) return toast.error('Alege programul de trimitere')

    for (const [i, p] of pasi.entries()) {
      if (!p.subiect.trim()) return toast.error(`Pasul ${i + 1} nu are subiect`)
      if (!p.corp.trim()) return toast.error(`Pasul ${i + 1} nu are text`)
    }

    setSalveaza(true)
    try {
      const r = await fetch('/api/admin/apollo/secvente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nume, programareId, pasi, activa: porneste }),
      })
      const d = await r.json()

      if (!r.ok) {
        toast.error(d.error || 'Crearea a eșuat')
        return
      }

      toast.success(
        porneste
          ? `„${d.nume}" e creată și PORNITĂ.`
          : `„${d.nume}" e creată, dar oprită. O pornești când ești gata.`
      )
      onCreata?.(d)
      onInchide()
    } finally {
      setSalveaza(false)
    }
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <div>
          <h2 className="font-semibold text-gray-900">Secvență nouă</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Primul email pleacă imediat ce adaugi contactul. Follow-up-urile continuă același fir
            și se opresc automat dacă omul răspunde.
          </p>
        </div>
        <button onClick={onInchide} className="rounded p-1 text-gray-400 hover:bg-gray-100">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Numele secvenței</label>
            <input
              className={input}
              value={nume}
              onChange={(e) => setNume(e.target.value)}
              placeholder="ex. HR Outsourcing — Irlanda, firme mici"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Când pleacă emailurile
            </label>
            <select
              className={input}
              value={programareId}
              onChange={(e) => setProgramareId(e.target.value)}
            >
              {programari.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nume} {p.implicit ? '(implicit)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Variabilele */}
        {variabile.length > 0 && (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-700">
              Variabile — Apollo le înlocuiește la trimitere
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {variabile.map((v) => (
                <button
                  key={v.cod}
                  onClick={() => inserVariabila(v.cod)}
                  title={v.descriere}
                  className="rounded bg-white px-2 py-0.5 font-mono text-[11px] text-indigo-700 ring-1 ring-gray-300 hover:bg-indigo-50"
                >
                  {v.cod}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pașii */}
        {pasi.map((pas, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                  Pas {i + 1}
                </span>
                {i === 0 ? (
                  <span className="text-xs text-gray-500">pleacă imediat</span>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <ClockIcon className="h-3.5 w-3.5" />
                    după
                    <input
                      type="number"
                      min="1"
                      value={pas.asteapta}
                      onChange={(e) => schimbaPas(i, 'asteapta', Number(e.target.value))}
                      className="w-14 rounded border border-gray-300 px-1.5 py-0.5 text-xs"
                    />
                    <select
                      value={pas.unitate}
                      onChange={(e) => schimbaPas(i, 'unitate', e.target.value)}
                      className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                    >
                      {UNITATI.map((u) => (
                        <option key={u.valoare} value={u.valoare}>
                          {u.eticheta}
                        </option>
                      ))}
                    </select>
                    de la pasul anterior
                  </div>
                )}
              </div>

              {pasi.length > 1 && (
                <button
                  onClick={() => setPasi((p) => p.filter((_, x) => x !== i))}
                  className="rounded p-1 text-gray-300 hover:text-red-600"
                  title="Șterge pasul"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            <input
              className={`${input} mb-2`}
              value={pas.subiect}
              onFocus={() => setCampActiv({ index: i, camp: 'subiect' })}
              onChange={(e) => schimbaPas(i, 'subiect', e.target.value)}
              placeholder={i === 0 ? 'Subiect — ex. Întrebare despre {{company}}' : 'Subiect follow-up'}
            />

            <textarea
              className={input}
              rows={i === 0 ? 6 : 4}
              value={pas.corp}
              onFocus={() => setCampActiv({ index: i, camp: 'corp' })}
              onChange={(e) => schimbaPas(i, 'corp', e.target.value)}
              placeholder={
                i === 0
                  ? 'Bună {{first_name}},\n\n...\n\nO zi bună,\n{{sender_first_name}}'
                  : 'Revin la mesajul de mai jos, în caz că s-a pierdut.'
              }
            />

            {i > 0 && (
              <p className="mt-1 text-[11px] text-gray-400">
                Merge ca răspuns în același fir — destinatarul vede mesajul dinainte.
              </p>
            )}
          </div>
        ))}

        <button
          onClick={() => setPasi((p) => [...p, { ...PAS_NOU }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
        >
          <PlusIcon className="h-4 w-4" />
          Mai adaugă un follow-up
        </button>

        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          <button
            onClick={() => salveazaSecventa(false)}
            disabled={salveaza}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300"
          >
            {salveaza ? 'Salvez...' : 'Salvează (oprită)'}
          </button>
          <button
            onClick={() => salveazaSecventa(true)}
            disabled={salveaza}
            className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            Salvează și pornește
          </button>
          <button
            onClick={onInchide}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Renunță
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Recomandat: salveaz-o oprită, recitește textele în Apollo, apoi pornește-o. Un email
          plecat nu mai poate fi luat înapoi.
        </p>
      </div>
    </div>
  )
}
