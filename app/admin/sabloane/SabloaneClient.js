'use client'

/**
 * Șabloanele de mesaj pentru WhatsApp.
 *
 * Scrii textul o dată, cu variabile de tipul {{firma}}, iar din lista de
 * lead-uri îl trimiți oricărei firme cu un clic — numele, orașul, ratingul se
 * pun singure. Previzualizarea arată exact cum va citi omul mesajul.
 *
 * Biblioteca de jos are șabloane gata scrise, pe domenii și etape, care se
 * adaugă în listă dintr-un clic.
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
  BookOpenIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import {
  VARIABILE,
  ETAPE,
  LIMBI,
  SITUATII,
  completeaza,
  valoriExemplu,
  problemeSablon,
} from '@/lib/leads/sabloane'
import { SABLOANE_GATA } from '@/lib/leads/sabloane-gata'

const input =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

const GOL = {
  nume: '',
  text: '',
  categorie: 'Orice firmă',
  etapa: 'PRIMUL_CONTACT',
  limba: 'ro',
  situatii: [],
  cuvinte: '',
}

const ETICHETE_SITUATII = Object.fromEntries(SITUATII.map((s) => [s.value, s.label]))

/** Ce trimitem la server din formular. */
function dinFormular(f) {
  return {
    nume: f.nume,
    text: f.text,
    categorie: f.categorie,
    etapa: f.etapa,
    limba: f.limba,
    situatii: f.situatii,
    cuvinte: f.cuvinte,
  }
}

function inFormular(s) {
  return {
    nume: s.nume,
    text: s.text,
    categorie: s.categorie || 'Orice firmă',
    etapa: s.etapa || 'PRIMUL_CONTACT',
    limba: s.limba || 'ro',
    situatii: s.situatii || [],
    cuvinte: (s.cuvinte || []).join(', '),
  }
}

export default function SabloaneClient({
  sabloaneInitiale,
  numeleMeu: numeleInitial,
  poateCrea,
  poateEdita,
  poateSterge,
  grupuri = [],
}) {
  // Numele cu care se semnează mesajele — se poate schimba chiar de aici
  const [numeleMeu, setNumeleMeu] = useState(numeleInitial || '')
  const [sabloane, setSabloane] = useState(sabloaneInitiale)
  const [editat, setEditat] = useState(null) // null | 'nou' | id
  const [formular, setFormular] = useState(GOL)
  const [salveaza, setSalveaza] = useState(false)
  const [cursor, setCursor] = useState(null) // unde inserăm variabila
  const [varianta, setVarianta] = useState(0)
  const [bibliotecaDeschisa, setBibliotecaDeschisa] = useState(sabloaneInitiale.length === 0)
  const [adaug, setAdaug] = useState(false)

  const exemplu = useMemo(() => valoriExemplu(numeleMeu, formular.limba), [numeleMeu, formular.limba])
  const previzualizare = useMemo(
    () => completeaza(formular.text, exemplu, { samanta: varianta ? `v${varianta}` : '' }),
    [formular.text, exemplu, varianta]
  )
  const probleme = useMemo(() => problemeSablon(formular.text), [formular.text])
  const domenii = useMemo(() => ['Orice firmă', ...grupuri], [grupuri])

  // ── Biblioteca ────────────────────────────────────────────────────
  const adaugate = useMemo(() => new Set(sabloane.map((s) => s.cheie).filter(Boolean)), [sabloane])
  const deAdaugat = SABLOANE_GATA.filter((s) => !adaugate.has(s.cheie))

  async function adaugaDinBiblioteca(chei) {
    if (!chei.length || adaug) return
    setAdaug(true)
    try {
      const r = await fetch('/api/admin/sabloane/biblioteca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chei }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Nu am putut adăuga')
      setSabloane((lista) => [...lista, ...d.sabloane])
      toast.success(
        d.sabloane.length === 1 ? 'Șablon adăugat' : `${d.sabloane.length} șabloane adăugate în listă`
      )
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAdaug(false)
    }
  }

  // ── Editorul ──────────────────────────────────────────────────────
  function deschideNou(pornire = GOL) {
    setFormular({ ...GOL, ...pornire })
    setVarianta(0)
    setEditat('nou')
  }

  function deschideEditare(s) {
    setFormular(inFormular(s))
    setVarianta(0)
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

  function comutaSituatie(valoare) {
    setFormular((f) => ({
      ...f,
      situatii: f.situatii.includes(valoare) ? f.situatii.filter((s) => s !== valoare) : [...f.situatii, valoare],
    }))
  }

  async function salveazaSablon() {
    if (!formular.nume.trim()) return toast.error('Dă-i un nume șablonului')
    if (!formular.text.trim()) return toast.error('Șablonul e gol')
    if (probleme.length) return toast.error(probleme[0])

    setSalveaza(true)
    try {
      const esteNou = editat === 'nou'
      const r = await fetch(esteNou ? '/api/admin/sabloane' : `/api/admin/sabloane/${editat}`, {
        method: esteNou ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dinFormular(formular)),
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

  // Lista, pe etape — în ordinea în care se folosesc
  const peEtape = useMemo(
    () =>
      ETAPE.map((e) => ({
        ...e,
        sabloane: sabloane.filter((s) => (s.etapa || 'PRIMUL_CONTACT') === e.value),
      })).filter((e) => e.sabloane.length),
    [sabloane]
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Șabloane mesaje</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Texte gata scrise pe care le trimiți pe WhatsApp dintr-un clic, din lista de leaduri.
            Numele firmei și restul datelor se pun singure.
          </p>
          <Semnatura nume={numeleMeu} onSalvat={setNumeleMeu} />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {poateCrea && deAdaugat.length > 0 && (
            <button
              onClick={() => setBibliotecaDeschisa(true)}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
            >
              <BookOpenIcon className="h-4 w-4" />
              {deAdaugat.length} șabloane gata scrise
            </button>
          )}
          {poateCrea && !editat && (
            <button
              onClick={() => deschideNou()}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4" />
              Șablon nou
            </button>
          )}
        </div>
      </div>

      {/* ── Editorul ──────────────────────────────────────────── */}
      {editat && (
        <div className="grid gap-4 rounded-xl border border-indigo-200 bg-white p-4 shadow-sm lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Camp eticheta="Nume">
                <input
                  className={input}
                  value={formular.nume}
                  onChange={(e) => setFormular((f) => ({ ...f, nume: e.target.value }))}
                  placeholder="ex. Primul contact · cofetărie"
                />
              </Camp>
              <Camp eticheta="Domeniul firmei">
                <input
                  className={input}
                  list="domenii-sablon"
                  value={formular.categorie}
                  onChange={(e) => setFormular((f) => ({ ...f, categorie: e.target.value }))}
                />
                <datalist id="domenii-sablon">
                  {domenii.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Camp>
              <Camp eticheta="Când se trimite">
                <select
                  className={input}
                  value={formular.etapa}
                  onChange={(e) => setFormular((f) => ({ ...f, etapa: e.target.value }))}
                >
                  {ETAPE.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.emoji} {e.label}
                    </option>
                  ))}
                </select>
              </Camp>
              <Camp eticheta="Limba">
                <select
                  className={input}
                  value={formular.limba}
                  onChange={(e) => setFormular((f) => ({ ...f, limba: e.target.value }))}
                >
                  {LIMBI.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Camp>
            </div>

            <Camp eticheta="Pentru ce fel de site (nimic bifat = orice)">
              <div className="flex flex-wrap gap-1">
                {SITUATII.map((s) => {
                  const ales = formular.situatii.includes(s.value)
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => comutaSituatie(s.value)}
                      className={`rounded-full px-2.5 py-0.5 text-xs transition ${
                        ales ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </Camp>

            <Camp eticheta="Cuvinte cheie ale nișei (opțional) — urcă șablonul primul la firmele potrivite">
              <input
                className={input}
                value={formular.cuvinte}
                onChange={(e) => setFormular((f) => ({ ...f, cuvinte: e.target.value }))}
                placeholder="ex. cofet, tort, patiser"
              />
            </Camp>

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
              <p className="mt-1 text-[11px] leading-snug text-gray-500">
                <code className="rounded bg-gray-100 px-1">[[ ... ]]</code> = frază care dispare dacă îi lipsesc
                datele (ex. <code className="rounded bg-gray-100 px-1">[[ (aveți {'{{nota_google}}'})]]</code>) ·{' '}
                <code className="rounded bg-gray-100 px-1">((Sunt|Mă numesc))</code> = variante, una aleasă la
                fiecare firmă, ca mesajele să nu fie identice
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Textul mesajului</label>
              <textarea
                id="text-sablon"
                className={input}
                rows={10}
                value={formular.text}
                onChange={(e) => setFormular((f) => ({ ...f, text: e.target.value }))}
                onSelect={(e) => setCursor({ start: e.target.selectionStart, sfarsit: e.target.selectionEnd })}
                placeholder="{{salut}}! Am văzut {{firma}} pe Google Maps..."
              />
              {probleme.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-red-600">
                  {probleme.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
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
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-700">Așa arată pe WhatsApp (cu date de exemplu)</p>
              {/\(\(/.test(formular.text) && (
                <button
                  type="button"
                  onClick={() => setVarianta((v) => v + 1)}
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  🎲 altă variantă
                </button>
              )}
            </div>
            <BulaWhatsApp text={previzualizare} />
            <p className="mt-2 text-[11px] text-gray-400">
              Dacă o firmă n-are o valoare (de ex. rating), variabila dispare curat din text. Pune lauda
              din recenzii în [[ ]], ca să dispară cu totul la firmele cu puține recenzii.
            </p>
          </div>
        </div>
      )}

      {/* ── Lista, pe etape ───────────────────────────────────── */}
      {sabloane.length === 0 && !editat ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-900">Niciun șablon încă</p>
          <p className="mt-1 text-sm text-gray-500">
            Adaugă-le pe cele gata scrise din biblioteca de mai jos, sau scrie unul de la zero.
          </p>
        </div>
      ) : (
        peEtape.map((e) => (
          <div key={e.value}>
            <h2 className="mb-1.5 text-sm font-semibold text-gray-700">
              {e.emoji} {e.label} <span className="font-normal text-gray-400">({e.sabloane.length})</span>
            </h2>
            <div className="space-y-1.5">
              {e.sabloane.map((s) => (
                <div key={s.id} className={`rounded-xl bg-white p-3 shadow-sm ${s.activ ? '' : 'opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-semibold text-gray-900">{s.nume}</h3>
                        <Etichete sablon={s} />
                        {!s.activ && (
                          <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[11px] text-gray-600">ascuns</span>
                        )}
                        <span className="text-[11px] text-gray-400">trimis de {s.folosit} ori</span>
                      </div>
                      <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-gray-500">{s.text}</p>
                    </div>

                    {(poateEdita || poateSterge) && (
                      <div className="flex shrink-0 gap-1">
                        {poateEdita && (
                          <>
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
                          </>
                        )}
                        {poateSterge && (
                          <button
                            onClick={() => sterge(s)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                            title="Șterge"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ── Biblioteca de șabloane gata scrise ───────────────── */}
      {poateCrea && (
        <Biblioteca
          deschisa={bibliotecaDeschisa}
          onComuta={() => setBibliotecaDeschisa((v) => !v)}
          adaugate={adaugate}
          deAdaugat={deAdaugat}
          adaug={adaug}
          onAdauga={adaugaDinBiblioteca}
          onPersonalizeaza={(s) => {
            deschideNou({ ...inFormular(s), nume: `${s.nume} (copie)` })
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          numeleMeu={numeleMeu}
        />
      )}
    </div>
  )
}

// ============================================================
// SUBCOMPONENTE
// ============================================================

/**
 * „Mesajele se semnează cu numele: …" — numele tău din cont, pus în
 * {{numele_meu}}. Se schimbă de aici, fără să umbli în baza de date.
 */
function Semnatura({ nume, onSalvat }) {
  const [editez, setEditez] = useState(false)
  const [text, setText] = useState(nume)
  const [salvez, setSalvez] = useState(false)

  async function salveaza() {
    const curat = text.trim().replace(/\s+/g, ' ')
    if (curat === nume) return setEditez(false)
    setSalvez(true)
    try {
      const r = await fetch('/api/admin/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: curat }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Nu am putut salva numele')
      onSalvat(d.name)
      setEditez(false)
      toast.success(`Gata — mesajele se semnează acum „${d.name}"`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalvez(false)
    }
  }

  if (!editez) {
    return (
      <p className="mt-1.5 text-xs text-gray-600">
        ✍️ Mesajele se semnează cu numele: <b>{nume || '—'}</b>{' '}
        <button
          type="button"
          onClick={() => {
            setText(nume)
            setEditez(true)
          }}
          className="font-medium text-indigo-600 hover:underline"
        >
          schimbă
        </button>
      </p>
    )
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-gray-600">✍️ Numele tău în mesaje:</span>
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') salveaza()
          if (e.key === 'Escape') setEditez(false)
        }}
        placeholder="ex. Ștefan Racu"
        className="w-48 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
      <button
        type="button"
        onClick={salveaza}
        disabled={salvez || text.trim().length < 2}
        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {salvez ? 'Salvez…' : 'Salvează'}
      </button>
      <button type="button" onClick={() => setEditez(false)} className="text-xs text-gray-500 hover:underline">
        renunță
      </button>
    </div>
  )
}

function Camp({ eticheta, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">{eticheta}</label>
      {children}
    </div>
  )
}

function BulaWhatsApp({ text, mic = false }) {
  return (
    <div className={`rounded-xl bg-[#e5ddd5] ${mic ? 'p-2' : 'p-4'}`}>
      <div className="ml-auto max-w-[92%] rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2 shadow-sm">
        <p className={`whitespace-pre-wrap leading-relaxed text-gray-900 ${mic ? 'text-xs' : 'text-sm'}`}>
          {text || <span className="text-gray-400">Scrie textul în stânga...</span>}
        </p>
      </div>
    </div>
  )
}

function Etichete({ sablon }) {
  return (
    <>
      {sablon.categorie && sablon.categorie !== 'Orice firmă' && (
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{sablon.categorie}</span>
      )}
      {sablon.limba && sablon.limba !== 'ro' && (
        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-sky-700">
          {sablon.limba}
        </span>
      )}
      {(sablon.situatii || []).length > 0 && (
        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-800">
          {sablon.situatii.map((s) => ETICHETE_SITUATII[s] || s).join(' / ')}
        </span>
      )}
    </>
  )
}

function Biblioteca({ deschisa, onComuta, adaugate, deAdaugat, adaug, onAdauga, onPersonalizeaza, numeleMeu }) {
  const [deschis, setDeschis] = useState(null) // cheia șablonului cu previzualizarea deschisă

  // Pe etape, apoi pe domenii — cum le cauți când lucrezi
  const grupe = useMemo(() => {
    const rez = []
    for (const e of ETAPE) {
      const dinEtapa = SABLOANE_GATA.filter((s) => (s.etapa || 'PRIMUL_CONTACT') === e.value)
      if (!dinEtapa.length) continue
      const domenii = [...new Set(dinEtapa.map((s) => s.categorie))]
      rez.push({ etapa: e, domenii: domenii.map((d) => ({ nume: d, sabloane: dinEtapa.filter((s) => s.categorie === d) })) })
    }
    return rez
  }, [])

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
      <button onClick={onComuta} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <BookOpenIcon className="h-5 w-5 text-emerald-600" />
            Șabloane gata scrise ({SABLOANE_GATA.length})
          </h2>
          <p className="mt-0.5 text-xs text-gray-600">
            Pe domenii și etape: primul mesaj, nu răspunde, revenire, după răspuns — în română, rusă și
            engleză. Scrise scurt și natural, cu o singură întrebare, ca să primești răspuns.
          </p>
        </div>
        <ChevronDownIcon className={`h-5 w-5 shrink-0 text-gray-400 transition ${deschisa ? 'rotate-180' : ''}`} />
      </button>

      {deschisa && (
        <div className="space-y-4 border-t border-emerald-200 p-4">
          {deAdaugat.length > 0 ? (
            <button
              onClick={() => onAdauga(deAdaugat.map((s) => s.cheie))}
              disabled={adaug}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <PlusIcon className="h-4 w-4" />
              {adaug ? 'Adaug...' : `Adaugă-le pe toate (${deAdaugat.length})`}
            </button>
          ) : (
            <p className="text-sm font-medium text-emerald-700">✓ Le ai pe toate în listă.</p>
          )}

          {grupe.map(({ etapa, domenii }) => (
            <div key={etapa.value}>
              <h3 className="mb-1.5 text-sm font-semibold text-gray-800">
                {etapa.emoji} {etapa.label}
              </h3>
              <div className="space-y-2">
                {domenii.map((d) => (
                  <div key={d.nume}>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">{d.nume}</p>
                    <div className="grid gap-1.5 md:grid-cols-2">
                      {d.sabloane.map((s) => {
                        const are = adaugate.has(s.cheie)
                        const arata = deschis === s.cheie
                        return (
                          <div key={s.cheie} className="rounded-lg bg-white p-2 shadow-sm">
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => setDeschis(arata ? null : s.cheie)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <p className="flex flex-wrap items-center gap-1 text-sm font-medium text-gray-900">
                                  {s.nume}
                                  {s.limba && (
                                    <span className="rounded bg-sky-100 px-1 text-[10px] font-semibold uppercase text-sky-700">
                                      {s.limba}
                                    </span>
                                  )}
                                </p>
                                {s.nota && <p className="text-[11px] text-gray-500">{s.nota}</p>}
                              </button>
                              {are ? (
                                <span className="shrink-0 text-[11px] font-medium text-emerald-700">✓ în listă</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onAdauga([s.cheie])}
                                  disabled={adaug}
                                  className="shrink-0 rounded border border-emerald-300 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                                >
                                  + Adaugă
                                </button>
                              )}
                            </div>
                            {arata && (
                              <div className="mt-2 space-y-1.5">
                                <BulaWhatsApp
                                  mic
                                  text={completeaza(s.text, valoriExemplu(numeleMeu, s.limba || 'ro'), {
                                    samanta: s.cheie,
                                  })}
                                />
                                <button
                                  type="button"
                                  onClick={() => onPersonalizeaza(s)}
                                  className="text-[11px] font-medium text-indigo-600 hover:underline"
                                >
                                  Fă-ți o copie și modific-o
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
