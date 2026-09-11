'use client'

/**
 * Șabloanele de mesaj pentru WhatsApp.
 *
 * Scrii textul o dată, cu variabile de tipul {{firma}}, iar din lista de
 * lead-uri îl trimiți oricărei firme cu un clic — numele, orașul, ratingul se
 * pun singure. Previzualizarea arată exact cum va citi omul mesajul.
 */

import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeSlashIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import {
  VARIABILE,
  completeaza,
  valoriExemplu,
  variabileNecunoscute,
} from '@/lib/leads/sabloane'

const input =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

const GOL = { nume: '', text: '', categorie: '' }

const EXEMPLE = [
  {
    nume: 'Primul contact — fără site',
    categorie: 'Primul contact',
    text:
      'Bună ziua! Am văzut {{firma}} pe Google Maps — {{rating}} stele din {{recenzii}} de recenzii în {{oras}}, felicitări.\n\n' +
      'Am observat însă că {{problema}}. Facem site-uri pentru firme din {{oras}} și m-am gândit că v-ar putea aduce clienți în plus.\n\n' +
      'Aveți 5 minute să vă arăt câteva exemple?\n\n{{numele_meu}}, PyWeb',
  },
  {
    nume: 'Revenire după apel',
    categorie: 'Follow-up',
    text:
      'Bună ziua! Revin după discuția noastră de la telefon despre site-ul pentru {{firma}}.\n\n' +
      'V-am pregătit câteva variante. Când vă convine să le vedem împreună?\n\n{{numele_meu}}',
  },
]

export default function SabloaneClient({ sabloaneInitiale, numeleMeu, poateEdita }) {
  const [sabloane, setSabloane] = useState(sabloaneInitiale)
  const [editat, setEditat] = useState(null) // null | 'nou' | id
  const [formular, setFormular] = useState(GOL)
  const [salveaza, setSalveaza] = useState(false)
  const [cursor, setCursor] = useState(null) // unde inserăm variabila

  const exemplu = useMemo(() => valoriExemplu(numeleMeu), [numeleMeu])
  const previzualizare = useMemo(() => completeaza(formular.text, exemplu), [formular.text, exemplu])
  const gresite = useMemo(() => variabileNecunoscute(formular.text), [formular.text])

  function deschideNou(pornire = GOL) {
    setFormular({ nume: pornire.nume, text: pornire.text, categorie: pornire.categorie || '' })
    setEditat('nou')
  }

  function deschideEditare(s) {
    setFormular({ nume: s.nume, text: s.text, categorie: s.categorie || '' })
    setEditat(s.id)
  }

  function inchide() {
    setEditat(null)
    setFormular(GOL)
  }

  function insereazaVariabila(cod) {
    const zona = document.getElementById('text-sablon')
    if (!zona) return

    // Inserăm acolo unde e cursorul, nu la final.
    const start = cursor?.start ?? zona.selectionStart ?? formular.text.length
    const sfarsit = cursor?.sfarsit ?? zona.selectionEnd ?? formular.text.length
    const nou = formular.text.slice(0, start) + cod + formular.text.slice(sfarsit)

    setFormular((f) => ({ ...f, text: nou }))
    requestAnimationFrame(() => {
      zona.focus()
      const poz = start + cod.length
      zona.setSelectionRange(poz, poz)
      setCursor({ start: poz, sfarsit: poz })
    })
  }

  async function salveazaSablon() {
    if (!formular.nume.trim()) return toast.error('Dă-i un nume șablonului')
    if (!formular.text.trim()) return toast.error('Șablonul e gol')
    if (gresite.length) return toast.error('Ai variabile scrise greșit — vezi mai jos')

    setSalveaza(true)
    try {
      const esteNou = editat === 'nou'
      const r = await fetch(esteNou ? '/api/admin/sabloane' : `/api/admin/sabloane/${editat}`, {
        method: esteNou ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formular),
      })
      const d = await r.json()

      if (!r.ok) {
        toast.error(d.error || 'Nu am putut salva')
        return
      }

      setSabloane((lista) =>
        esteNou ? [...lista, d.sablon] : lista.map((s) => (s.id === d.sablon.id ? d.sablon : s))
      )
      toast.success(esteNou ? 'Șablon creat' : 'Șablon salvat')
      inchide()
    } finally {
      setSalveaza(false)
    }
  }

  async function comutaActiv(s) {
    const r = await fetch(`/api/admin/sabloane/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activ: !s.activ }),
    })
    if (!r.ok) return toast.error('Nu am putut schimba')
    const { sablon } = await r.json()
    setSabloane((lista) => lista.map((x) => (x.id === sablon.id ? sablon : x)))
  }

  async function sterge(s) {
    if (!confirm(`Ștergi șablonul „${s.nume}"?`)) return
    const r = await fetch(`/api/admin/sabloane/${s.id}`, { method: 'DELETE' })
    if (!r.ok) return toast.error('Nu am putut șterge')
    setSabloane((lista) => lista.filter((x) => x.id !== s.id))
    toast.success('Șablon șters')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Șabloane mesaje</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Texte gata scrise pe care le trimiți pe WhatsApp dintr-un clic, din lista de leaduri.
            Numele firmei și restul datelor se pun singure.
          </p>
        </div>
        {poateEdita && !editat && (
          <button
            onClick={() => deschideNou()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4" />
            Șablon nou
          </button>
        )}
      </div>

      {/* ── Editorul ──────────────────────────────────────────── */}
      {editat && (
        <div className="grid gap-4 rounded-xl border border-indigo-200 bg-white p-4 shadow-sm lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Nume</label>
                <input
                  className={input}
                  value={formular.nume}
                  onChange={(e) => setFormular((f) => ({ ...f, nume: e.target.value }))}
                  placeholder="ex. Primul contact"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Categorie (opțional)
                </label>
                <input
                  className={input}
                  value={formular.categorie}
                  onChange={(e) => setFormular((f) => ({ ...f, categorie: e.target.value }))}
                  placeholder="ex. Follow-up"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Variabile — clic ca s-o pui unde e cursorul
              </label>
              <div className="flex flex-wrap gap-1">
                {VARIABILE.map((v) => (
                  <button
                    key={v.cod}
                    type="button"
                    onClick={() => insereazaVariabila(v.cod)}
                    title={`${v.descriere} — ex. „${v.exemplu}"`}
                    className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[11px] text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100"
                  >
                    {v.cod}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Textul mesajului</label>
              <textarea
                id="text-sablon"
                className={input}
                rows={10}
                value={formular.text}
                onChange={(e) => setFormular((f) => ({ ...f, text: e.target.value }))}
                onSelect={(e) =>
                  setCursor({ start: e.target.selectionStart, sfarsit: e.target.selectionEnd })
                }
                placeholder="Bună ziua! Am văzut {{firma}} pe Google Maps..."
              />
              {gresite.length > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  Variabile necunoscute: {gresite.map((g) => `{{${g}}}`).join(', ')} — ar pleca
                  așa, literal, în mesaj.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={salveazaSablon}
                disabled={salveaza}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300"
              >
                {salveaza ? 'Salvez...' : 'Salvează'}
              </button>
              <button
                onClick={inchide}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Renunță
              </button>
            </div>
          </div>

          {/* Previzualizarea — cum arată pe telefonul omului */}
          <div>
            <p className="mb-1 text-xs font-medium text-gray-700">
              Așa arată pe WhatsApp (cu date de exemplu)
            </p>
            <div className="rounded-xl bg-[#e5ddd5] p-4">
              <div className="ml-auto max-w-[90%] rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2 shadow-sm">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
                  {previzualizare || <span className="text-gray-400">Scrie textul în stânga...</span>}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              Dacă o firmă n-are o valoare (de ex. rating), variabila dispare curat din text. Scrie
              frazele astfel încât să aibă sens și fără ea.
            </p>
          </div>
        </div>
      )}

      {/* ── Lista ─────────────────────────────────────────────── */}
      {sabloane.length === 0 && !editat ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-900">Niciun șablon încă</p>
          <p className="mt-1 text-sm text-gray-500">Pornește de la unul dintre exemplele de mai jos.</p>
          {poateEdita && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXEMPLE.map((e) => (
                <button
                  key={e.nume}
                  onClick={() => deschideNou(e)}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-100"
                >
                  {e.nume}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sabloane.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl bg-white p-3 shadow-sm ${s.activ ? '' : 'opacity-60'}`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{s.nume}</h3>
                    {s.categorie && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
                        {s.categorie}
                      </span>
                    )}
                    {!s.activ && (
                      <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[11px] text-gray-600">
                        ascuns
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">trimis de {s.folosit} ori</span>
                  </div>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-gray-500">
                    {s.text}
                  </p>
                </div>

                {poateEdita && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => deschideEditare(s)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      title="Editează"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => comutaActiv(s)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title={s.activ ? 'Ascunde din listă' : 'Arată în listă'}
                    >
                      {s.activ ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => sterge(s)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                      title="Șterge"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
