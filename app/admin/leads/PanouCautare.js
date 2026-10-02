'use client'

/**
 * „Caută firme noi" — alegi țara, orașele și ce fel de firme vrei.
 *
 * Tot ce scrii de mână (un oraș, o țară, „magazin de rochii de mireasă") se
 * verifică ÎNAINTE să intre în căutare: orașele pe OpenStreetMap, termenii cu
 * AI-ul. O interogare Google costă bani și când nu găsește nimic, așa că nu
 * lăsăm să plece greșeli de scriere sau locuri care nu există.
 */

import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  PlayIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const CHEIE_SALVARE = 'pyweb:leaduri:cautare'

/** Interogarea, exact cum o construiește serverul — pentru previzualizare. */
function textInterogare(categorie, oras, tara) {
  const termen = categorie.query || (tara.limba === 'ro' ? categorie.ro : categorie.en || categorie.ro)
  return tara.limba === 'ro' ? `${termen} în ${oras}` : `${termen} in ${oras}`
}

async function valideaza(tip, text, tara) {
  const raspuns = await fetch('/api/admin/leads/valideaza', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tip,
      text,
      tara: tara ? { cod: tara.cod, nume: tara.nume, limba: tara.limba, orase: tara.orase } : null,
    }),
  })
  const date = await raspuns.json().catch(() => ({}))
  if (!raspuns.ok && date.error) return { valid: false, mesaj: date.error }
  return date
}

export default function PanouCautare({ optiuni, onPornire, onAnulare }) {
  const tariConfig = optiuni.tari
  const toatePredefinite = useMemo(
    () => optiuni.grupuriCategorii.flatMap((g) => g.categorii),
    [optiuni.grupuriCategorii]
  )

  const [tariProprii, setTariProprii] = useState([])
  const [tara, setTara] = useState(tariConfig[0])
  const [oraseExtra, setOraseExtra] = useState([]) // orașe scrise de mână, verificate
  const [oraseAlese, setOraseAlese] = useState(tariConfig[0].oraseImplicite)
  const [categoriiProprii, setCategoriiProprii] = useState([])
  const [categoriiAlese, setCategoriiAlese] = useState(() => new Set(optiuni.categoriiImplicite))
  const [filtru, setFiltru] = useState('')
  const [restaurat, setRestaurat] = useState(false)
  const [pornire, setPornire] = useState(false)

  // Ultima căutare rămâne aleasă data viitoare
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(CHEIE_SALVARE) || 'null')
      if (s) {
        const proprii = Array.isArray(s.tariProprii) ? s.tariProprii : []
        setTariProprii(proprii)
        const t = [...tariConfig, ...proprii].find((x) => x.cod === s.taraCod)
        if (t) setTara(t)
        if (Array.isArray(s.oraseExtra)) setOraseExtra(s.oraseExtra)
        if (Array.isArray(s.oraseAlese)) setOraseAlese(s.oraseAlese)
        if (Array.isArray(s.categoriiProprii)) setCategoriiProprii(s.categoriiProprii)
        if (Array.isArray(s.categoriiAlese)) setCategoriiAlese(new Set(s.categoriiAlese))
      }
    } catch {
      /* fără salvare — pornim cu implicitele */
    }
    setRestaurat(true)
  }, [tariConfig])

  useEffect(() => {
    if (!restaurat) return
    try {
      localStorage.setItem(
        CHEIE_SALVARE,
        JSON.stringify({
          taraCod: tara.cod,
          tariProprii,
          oraseExtra,
          oraseAlese,
          categoriiProprii,
          categoriiAlese: [...categoriiAlese],
        })
      )
    } catch {
      /* nu e grav */
    }
  }, [restaurat, tara, tariProprii, oraseExtra, oraseAlese, categoriiProprii, categoriiAlese])

  function schimbaTara(t) {
    if (t.cod === tara.cod) return
    setTara(t)
    setOraseExtra([])
    setOraseAlese(t.oraseImplicite || [])
  }

  const toateOrasele = useMemo(() => [...(tara.orase || []), ...oraseExtra], [tara, oraseExtra])

  const comutaOras = (o) =>
    setOraseAlese((l) => (l.includes(o) ? l.filter((x) => x !== o) : [...l, o]))

  const comutaCategorie = (ro) =>
    setCategoriiAlese((s) => {
      const n = new Set(s)
      if (n.has(ro)) n.delete(ro)
      else n.add(ro)
      return n
    })

  const comutaGrup = (categorii, toate) =>
    setCategoriiAlese((s) => {
      const n = new Set(s)
      for (const c of categorii) {
        if (toate) n.add(c.ro)
        else n.delete(c.ro)
      }
      return n
    })

  // ── Ce s-a ales, ca obiecte complete ──────────────────────────────
  const definitii = useMemo(() => {
    const dupaNume = new Map([...toatePredefinite, ...categoriiProprii].map((c) => [c.ro, c]))
    return [...categoriiAlese].map((ro) => dupaNume.get(ro)).filter(Boolean)
  }, [categoriiAlese, toatePredefinite, categoriiProprii])

  const estimare = useMemo(() => {
    const interogari = oraseAlese.length * definitii.length
    const apeluriMax = interogari * optiuni.paginiMax
    return {
      interogari,
      apeluriMax,
      costMin: (interogari * optiuni.buget.costPerApelUsd).toFixed(2),
      costMax: (apeluriMax * optiuni.buget.costPerApelUsd).toFixed(2),
      firmeMax: apeluriMax * optiuni.marimePagina,
      depaseste: apeluriMax > optiuni.buget.maxApeluriPeRulare,
    }
  }, [oraseAlese, definitii, optiuni])

  const exemple = useMemo(() => {
    const rez = []
    for (const c of definitii.slice(0, 2)) {
      for (const o of oraseAlese.slice(0, 2)) rez.push(textInterogare(c, o, tara))
    }
    return rez.slice(0, 4)
  }, [definitii, oraseAlese, tara])

  const grupuriFiltrate = useMemo(() => {
    const f = filtru.trim().toLowerCase()
    const grupuri = [...optiuni.grupuriCategorii]
    if (categoriiProprii.length) {
      grupuri.unshift({ grup: 'Termenii mei', emoji: '✍️', categorii: categoriiProprii })
    }
    if (!f) return grupuri
    return grupuri
      .map((g) => ({
        ...g,
        categorii: g.categorii.filter(
          (c) => c.ro.toLowerCase().includes(f) || (c.en || c.query || '').toLowerCase().includes(f)
        ),
      }))
      .filter((g) => g.categorii.length)
  }, [filtru, optiuni.grupuriCategorii, categoriiProprii])

  async function porneste() {
    setPornire(true)
    try {
      await onPornire({
        tara: tara.personalizata ? tara : tara.cod,
        orase: oraseAlese,
        categorii: definitii.map((c) => (c.proprie ? c : c.ro)),
      })
    } finally {
      setPornire(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-violet-200 bg-violet-50/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900">Caută firme noi pe Google Maps</h2>
          <p className="text-xs text-gray-600">
            Fiecare categorie se caută în fiecare oraș. Căutările făcute în ultimele 30 de zile se
            sar (0 $), iar firmele deja găsite nu se salvează a doua oară.
          </p>
        </div>
        <button onClick={onAnulare} className="rounded p-1 text-gray-400 hover:bg-white" aria-label="Închide">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* ── 1. Țara ─────────────────────────────────────────────── */}
      <Sectiune titlu="1. Țara">
        <div className="flex flex-wrap items-center gap-1.5">
          {[...tariConfig, ...tariProprii].map((t) => (
            <button
              key={t.cod}
              type="button"
              onClick={() => schimbaTara(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                tara.cod === t.cod
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50'
              }`}
            >
              {t.steag} {t.nume}
            </button>
          ))}
          <AdaugaVerificat
            placeholder="Altă țară…"
            latime="w-36"
            onVerifica={(text) => valideaza('tara', text)}
            onValid={(r) => {
              const t = r.tara
              if (![...tariConfig, ...tariProprii].some((x) => x.cod === t.cod)) {
                setTariProprii((l) => [...l, t])
              }
              setTara(t)
              setOraseExtra([])
              setOraseAlese(t.oraseImplicite || [])
              toast.success(`${t.steag} ${t.nume} — adaugă orașele mai jos`)
            }}
          />
        </div>
        {tara.limba !== 'ro' && (
          <p className="mt-1.5 text-[11px] text-gray-500">
            În {tara.nume} căutăm în engleză (Google o înțelege peste tot), iar pitch-urile ies tot în
            engleză.
          </p>
        )}
      </Sectiune>

      {/* ── 2. Orașele ──────────────────────────────────────────── */}
      <Sectiune
        titlu={`2. Orașe (${oraseAlese.length})`}
        actiuni={
          <>
            <button onClick={() => setOraseAlese(toateOrasele)} className="text-violet-700 hover:underline">
              toate
            </button>
            {tara.oraseImplicite?.length > 0 && (
              <button onClick={() => setOraseAlese(tara.oraseImplicite)} className="text-violet-700 hover:underline">
                cele mari
              </button>
            )}
            <button onClick={() => setOraseAlese([])} className="text-gray-500 hover:underline">
              niciunul
            </button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {toateOrasele.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => comutaOras(o)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                oraseAlese.includes(o)
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50'
              }`}
            >
              {oraseExtra.includes(o) && '✓ '}
              {o}
            </button>
          ))}
          <AdaugaVerificat
            placeholder={`Alt oraș din ${tara.nume}…`}
            latime="w-48"
            onVerifica={(text) => valideaza('oras', text, tara)}
            onValid={(r) => {
              if (!toateOrasele.includes(r.nume)) setOraseExtra((l) => [...l, r.nume])
              setOraseAlese((l) => (l.includes(r.nume) ? l : [...l, r.nume]))
              if (r.avertisment) toast(r.avertisment, { icon: '⚠️' })
              else toast.success(`${r.nume} — verificat, adăugat`)
            }}
          />
        </div>
        {!toateOrasele.length && (
          <p className="mt-1.5 text-xs text-amber-700">Scrie cel puțin un oraș — îl verific înainte de căutare.</p>
        )}
      </Sectiune>

      {/* ── 3. Ce fel de firme ──────────────────────────────────── */}
      <Sectiune
        titlu={`3. Ce fel de firme (${definitii.length})`}
        actiuni={
          <button onClick={() => setCategoriiAlese(new Set())} className="text-gray-500 hover:underline">
            golește
          </button>
        }
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={filtru}
              onChange={(e) => setFiltru(e.target.value)}
              placeholder="Filtrează categoriile…"
              className="w-48 rounded-lg border border-gray-300 py-1 pl-7 pr-2 text-xs focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <AdaugaVerificat
            placeholder="Termen propriu, ex: magazin de rochii de mireasă"
            latime="w-80"
            eticheta="Verifică și adaugă"
            onVerifica={(text) => valideaza('categorie', text, tara)}
            onValid={(r) => {
              const c = r.categorie
              if (r.existaDeja) {
                setCategoriiAlese((s) => new Set(s).add(c.ro))
                toast.success(`„${c.ro}" exista deja în listă — am bifat-o`)
                return
              }
              setCategoriiProprii((l) => [...l.filter((x) => x.ro !== c.ro), c])
              setCategoriiAlese((s) => new Set(s).add(c.ro))
              if (r.avertisment) toast(r.avertisment, { icon: '⚠️', duration: 7000 })
              else toast.success(`Adăugat: „${c.ro}" → se caută „${c.query}"`)
            }}
          />
          {!optiuni.areOpenAI && (
            <span className="text-[11px] text-amber-700">
              fără cheie OpenAI: termenii proprii se verifică doar de bază
            </span>
          )}
        </div>

        <div className="max-h-80 space-y-2.5 overflow-y-auto rounded-lg bg-white/70 p-2">
          {grupuriFiltrate.map((g) => {
            const alese = g.categorii.filter((c) => categoriiAlese.has(c.ro)).length
            return (
              <div key={g.grup}>
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className="font-semibold text-gray-800">
                    {g.emoji} {g.grup}
                  </span>
                  <span className="text-gray-400">
                    {alese}/{g.categorii.length}
                  </span>
                  <button onClick={() => comutaGrup(g.categorii, true)} className="text-violet-700 hover:underline">
                    toate
                  </button>
                  <button onClick={() => comutaGrup(g.categorii, false)} className="text-gray-500 hover:underline">
                    niciuna
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {g.categorii.map((c) => {
                    const ales = categoriiAlese.has(c.ro)
                    const exemplu = textInterogare(c, '…', tara).replace(/ (în|in) …$/, '')
                    return (
                      <span key={c.ro} className="inline-flex items-center">
                        <button
                          type="button"
                          onClick={() => comutaCategorie(c.ro)}
                          title={`Se caută: „${exemplu}"${c.tip ? ` · tip Google: ${c.tip}${c.strict ? ' (doar acest tip)' : ''}` : ''}`}
                          className={`rounded-full px-2.5 py-0.5 text-xs transition ${
                            ales
                              ? 'bg-violet-600 text-white'
                              : 'bg-white text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {c.strict && <span className="mr-0.5 opacity-70">🎯</span>}
                          {c.ro}
                        </button>
                        {c.proprie && (
                          <button
                            type="button"
                            onClick={() => {
                              setCategoriiProprii((l) => l.filter((x) => x.ro !== c.ro))
                              setCategoriiAlese((s) => {
                                const n = new Set(s)
                                n.delete(c.ro)
                                return n
                              })
                            }}
                            className="ml-0.5 rounded-full p-0.5 text-gray-400 hover:text-red-600"
                            aria-label={`Șterge „${c.ro}"`}
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {!grupuriFiltrate.length && (
            <p className="p-2 text-xs text-gray-500">
              Nicio categorie nu conține „{filtru}&rdquo; — scrie-o ca termen propriu, o verific.
            </p>
          )}
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          🎯 = Google aduce DOAR firme de acel tip (ex: „magazin de haine&rdquo; → doar magazine de haine,
          fără mall-uri sau croitorii).
        </p>
      </Sectiune>

      {/* ── Estimare + pornire ─────────────────────────────────── */}
      <div className="rounded-lg bg-white p-3 text-sm">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Cifra eticheta="Interogări" valoare={estimare.interogari} />
          <Cifra eticheta="Apeluri API (max)" valoare={estimare.apeluriMax} />
          <Cifra eticheta="Cost estimat" valoare={`${estimare.costMin}–${estimare.costMax} $`} />
          <Cifra eticheta="Firme (maxim)" valoare={`~${estimare.firmeMax}`} />
        </div>

        {exemple.length > 0 && (
          <p className="mt-2 text-[11px] text-gray-500">
            Exemple de căutări: {exemple.map((e) => `„${e}"`).join(' · ')}
            {estimare.interogari > exemple.length ? ' …' : ''}
          </p>
        )}

        {estimare.depaseste && (
          <p className="mt-2 flex items-start gap-1.5 rounded bg-red-50 p-2 text-xs text-red-700">
            <ExclamationTriangleIcon className="mt-px h-4 w-4 shrink-0" />
            Selecția poate depăși plafonul de {optiuni.buget.maxApeluriPeRulare} apeluri pe căutare.
            Alege mai puține orașe sau categorii.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={porneste}
          disabled={pornire || estimare.depaseste || !estimare.interogari}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <PlayIcon className="h-4 w-4" />
          {pornire ? 'Pornesc…' : `Pornește căutarea (${estimare.interogari} interogări)`}
        </button>
        <button
          onClick={onAnulare}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Renunță
        </button>
      </div>
    </div>
  )
}

// ============================================================
// SUBCOMPONENTE
// ============================================================

function Sectiune({ titlu, actiuni, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">{titlu}</p>
        {actiuni && <div className="flex gap-2 text-xs">{actiuni}</div>}
      </div>
      {children}
    </div>
  )
}

function Cifra({ eticheta, valoare }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{eticheta}</p>
      <p className="font-semibold text-gray-900">{valoare}</p>
    </div>
  )
}

/**
 * Un câmp care verifică ce scrii înainte să-l adauge. Dacă nu e valid,
 * arată de ce și propune variante corecte, pe care le poți apăsa.
 */
function AdaugaVerificat({ placeholder, latime = 'w-48', eticheta = 'Verifică', onVerifica, onValid }) {
  const [text, setText] = useState('')
  const [seVerifica, setSeVerifica] = useState(false)
  const [eroare, setEroare] = useState(null)

  async function verifica(valoare = text) {
    const curat = valoare.trim()
    if (!curat || seVerifica) return
    setSeVerifica(true)
    setEroare(null)
    try {
      const r = await onVerifica(curat)
      if (r?.valid) {
        onValid(r)
        setText('')
      } else {
        setEroare({ mesaj: r?.mesaj || 'Nu e valid', sugestii: r?.sugestii || [] })
      }
    } catch {
      setEroare({ mesaj: 'Nu am putut verifica — încearcă din nou', sugestii: [] })
    } finally {
      setSeVerifica(false)
    }
  }

  return (
    <span className="relative inline-flex flex-col">
      <span className="inline-flex items-center gap-1">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setEroare(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              verifica()
            }
          }}
          placeholder={placeholder}
          className={`${latime} max-w-full rounded-lg border px-2 py-1 text-xs focus:ring-2 ${
            eroare
              ? 'border-red-400 focus:border-red-500 focus:ring-red-300'
              : 'border-gray-300 focus:border-violet-500 focus:ring-violet-500'
          }`}
        />
        <button
          type="button"
          onClick={() => verifica()}
          disabled={!text.trim() || seVerifica}
          className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-300 hover:bg-violet-50 disabled:opacity-50"
        >
          {seVerifica ? (
            'verific…'
          ) : (
            <>
              <PlusIcon className="h-3 w-3" />
              {eticheta}
            </>
          )}
        </button>
      </span>
      {eroare && (
        <span className="mt-1 max-w-sm text-[11px] text-red-700">
          {eroare.mesaj}
          {eroare.sugestii.length > 0 && (
            <span className="ml-1 text-gray-600">
              Poate:{' '}
              {eroare.sugestii.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setText(s)
                    verifica(s)
                  }}
                  className="font-medium text-violet-700 underline hover:text-violet-900"
                >
                  {s}
                  {i < eroare.sugestii.length - 1 ? ',' : ''}
                </button>
              ))}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
