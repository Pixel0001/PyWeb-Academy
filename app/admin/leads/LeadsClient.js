'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  PhoneIcon,
  ArrowDownTrayIcon,
  PlayIcon,
  StopIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  MapPinIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import {
  STATUSURI,
  getStatus,
  getCalitate,
  FILTRE_FOLLOWUP,
  PERIOADE,
  SORTARI,
  stareFollowUp,
  formateazaFollowUp,
  STILURI_FOLLOWUP,
} from '@/lib/leads/statusuri'
import FollowUpPicker from './FollowUpPicker'

/** Verde peste 70, galben 40–70, gri sub 40 — la fel ca în Excel. */
function culoareScor(scor) {
  if (scor > 70) return 'bg-green-600 text-white'
  if (scor >= 40) return 'bg-yellow-400 text-yellow-950'
  return 'bg-gray-200 text-gray-600'
}

function ratingRo(rating) {
  return typeof rating === 'number' ? String(rating).replace('.', ',') : '—'
}

// Rețelele pe care pot scrie unei firme care nu și-a lăsat numărul în Maps.
const RETELE = [
  { potrivire: /facebook\.com/i, nume: 'Facebook' },
  { potrivire: /instagram\.com/i, nume: 'Instagram' },
  { potrivire: /ok\.ru/i, nume: 'OK' },
  { potrivire: /vk\.com/i, nume: 'VK' },
  { potrivire: /linktr\.ee/i, nume: 'Linktree' },
]

function contactSocial(lead) {
  if (!lead.siteUrl) return null
  const retea = RETELE.find((r) => r.potrivire.test(lead.siteUrl))
  return retea ? { url: lead.siteUrl, nume: retea.nume } : null
}

const selectClass =
  'rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

// ============================================================
// COMPONENTA PRINCIPALĂ
// ============================================================

export default function LeadsClient({
  leaduriInitiale,
  statistici,
  rulari,
  rulareActiva,
  optiuni,
  areCheieGoogle,
  furnizorPitch,
  modelPitch,
  poateRula,
}) {
  const [leaduri, setLeaduri] = useState(leaduriInitiale)
  const [stats, setStats] = useState(statistici)
  const [istoric, setIstoric] = useState(rulari)
  const [seIncarca, setSeIncarca] = useState(false)

  // ── Filtre (se aplică pe server) ──────────────────────────────────
  const [cautare, setCautare] = useState('')
  const [filtre, setFiltre] = useState({
    status: '',
    oras: '',
    calitate: '',
    categorie: '',
    perioada: '',
    followUp: '',
    sortare: 'scor',
    scorMin: 0,
    doarNoi: false,
  })

  // ── Rulare ────────────────────────────────────────────────────────
  const [panouRulare, setPanouRulare] = useState(false)
  const [oraseAlese, setOraseAlese] = useState(optiuni.oraseImplicite)
  const [categoriiAlese, setCategoriiAlese] = useState(optiuni.categorii)
  const [ruleaza, setRuleaza] = useState(Boolean(rulareActiva))
  const [runId, setRunId] = useState(rulareActiva?.id || null)
  const [progres, setProgres] = useState(null)
  const [loguri, setLoguri] = useState([])
  const opresteRef = useRef(false)

  // ============================================================
  // ÎNCĂRCAREA LISTEI (filtrarea se face pe server)
  // ============================================================
  const parametri = useMemo(() => {
    const p = new URLSearchParams()
    if (cautare.trim()) p.set('q', cautare.trim())
    if (filtre.status) p.set('status', filtre.status)
    if (filtre.oras) p.set('oras', filtre.oras)
    if (filtre.calitate) p.set('calitate', filtre.calitate)
    if (filtre.categorie) p.set('categorie', filtre.categorie)
    if (filtre.perioada) p.set('perioada', filtre.perioada)
    if (filtre.followUp) p.set('followUp', filtre.followUp)
    if (filtre.sortare) p.set('sortare', filtre.sortare)
    if (filtre.scorMin > 0) p.set('scorMin', String(filtre.scorMin))
    if (filtre.doarNoi) p.set('doarNoi', '1')
    return p
  }, [cautare, filtre])

  const incarca = useCallback(async () => {
    setSeIncarca(true)
    try {
      const raspuns = await fetch(`/api/admin/leads?${parametri.toString()}&limita=300`)
      if (!raspuns.ok) return
      const date = await raspuns.json()
      setLeaduri(date.leaduri)
      setStats((s) => ({ ...s, afisate: date.total }))
    } catch {
      /* rețeaua a picat — lista rămâne cum era */
    } finally {
      setSeIncarca(false)
    }
  }, [parametri])

  // Reîncărcăm la schimbarea filtrelor, cu o pauză scurtă pentru scris.
  const primaRandare = useRef(true)
  useEffect(() => {
    if (primaRandare.current) {
      primaRandare.current = false
      return
    }
    const t = setTimeout(incarca, 300)
    return () => clearTimeout(t)
  }, [incarca])

  // ============================================================
  // BUCLA DE EXECUȚIE A RULĂRII
  // ============================================================
  const ruleazaPasi = useCallback(
    async (id) => {
      opresteRef.current = false
      setRuleaza(true)

      let esecuriLaRand = 0

      while (!opresteRef.current) {
        let raspuns
        try {
          raspuns = await fetch(`/api/admin/leads/runs/${id}/step`, { method: 'POST' })
        } catch {
          // Rețeaua a picat — reîncercăm de câteva ori înainte să renunțăm.
          if (++esecuriLaRand > 5) {
            toast.error('Conexiune pierdută. Rularea rămâne salvată — reia-o oricând.')
            break
          }
          await new Promise((r) => setTimeout(r, 4000))
          continue
        }

        if (raspuns.status === 202) {
          await new Promise((r) => setTimeout(r, 3000))
          continue
        }

        // 504 = pasul a depășit limita funcției. Progresul e salvat în baza de
        // date, deci pur și simplu cerem pasul din nou de unde a rămas.
        if (raspuns.status >= 500) {
          if (++esecuriLaRand > 5) {
            toast.error('Serverul nu răspunde. Rularea rămâne salvată — reia-o de pe pagină.')
            break
          }
          await new Promise((r) => setTimeout(r, 5000))
          continue
        }

        esecuriLaRand = 0
        const date = await raspuns.json().catch(() => ({}))

        if (!raspuns.ok) {
          toast.error(date.error || 'Pasul a eșuat')
          break
        }

        setProgres({ ...date.progres, faza: date.faza, rezumat: date.rezumat })
        if (date.loguri?.length) setLoguri(date.loguri)
        if (date.avertisment) toast(date.avertisment, { icon: '⚠️', duration: 8000 })

        if (date.terminat) {
          if (date.eroare) toast.error(`Rulare oprită: ${date.eroare}`)
          else toast.success('Rulare încheiată. Vezi firmele noi în listă.')
          break
        }
      }

      setRuleaza(false)
      // După o rulare, arătăm implicit doar firmele noi.
      setFiltre((f) => ({ ...f, doarNoi: true }))
      await incarca()
      await reincarcaRulari()
    },
    [incarca]
  )

  useEffect(() => {
    if (rulareActiva?.id) ruleazaPasi(rulareActiva.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function reincarcaRulari() {
    try {
      const r = await fetch('/api/admin/leads/runs')
      if (!r.ok) return
      const d = await r.json()
      setIstoric(d.rulari)
      setStats((s) => ({ ...s, apeluriLunaCurenta: d.apeluriLunaCurenta }))
    } catch {
      /* opțional */
    }
  }

  const estimare = useMemo(() => {
    const interogari = oraseAlese.length * categoriiAlese.length
    const apeluriMax = interogari * optiuni.paginiMax
    return {
      interogari,
      apeluriMin: interogari,
      apeluriMax,
      costMin: (interogari * optiuni.buget.costPerApelUsd).toFixed(2),
      costMax: (apeluriMax * optiuni.buget.costPerApelUsd).toFixed(2),
      firmeMax: interogari * optiuni.paginiMax * optiuni.marimePagina,
      depaseste: apeluriMax > optiuni.buget.maxApeluriPeRulare,
    }
  }, [oraseAlese, categoriiAlese, optiuni])

  async function porneste() {
    if (!areCheieGoogle) {
      toast.error('Lipsește GOOGLE_API_KEY. Vezi README-LEADURI.md.')
      return
    }
    if (!oraseAlese.length || !categoriiAlese.length) {
      toast.error('Alege cel puțin un oraș și o categorie')
      return
    }

    const raspuns = await fetch('/api/admin/leads/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orase: oraseAlese, categorii: categoriiAlese }),
    })
    const date = await raspuns.json()

    if (!raspuns.ok) {
      toast.error(date.error || 'Nu am putut porni rularea')
      return
    }

    setRunId(date.rulare.id)
    setLoguri([])
    setProgres(null)
    setPanouRulare(false)
    toast.success(`Rulare pornită: ${date.estimare.interogari} interogări`)
    ruleazaPasi(date.rulare.id)
  }

  async function opreste() {
    opresteRef.current = true
    if (runId) await fetch(`/api/admin/leads/runs/${runId}`, { method: 'DELETE' })
    setRuleaza(false)
    toast('Rulare oprită', { icon: '🛑' })
    incarca()
  }

  // ============================================================
  // ACȚIUNI PE LEAD
  // ============================================================

  function actualizeazaLocal(id, schimbari) {
    setLeaduri((l) => l.map((x) => (x.id === id ? { ...x, ...schimbari } : x)))
  }

  async function salveaza(lead, date, mesajEroare) {
    const raspuns = await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(date),
    })
    if (!raspuns.ok) {
      toast.error(mesajEroare)
      return null
    }
    return (await raspuns.json()).lead
  }

  async function schimbaStatus(lead, status) {
    const anterior = lead.status
    actualizeazaLocal(lead.id, { status })
    const salvat = await salveaza(lead, { status }, 'Nu am putut salva statusul')
    if (!salvat) actualizeazaLocal(lead.id, { status: anterior })
    else actualizeazaLocal(lead.id, { dataApel: salvat.dataApel })
  }

  async function schimbaFollowUp(lead, nextFollowUpAt) {
    const anterior = lead.nextFollowUpAt
    actualizeazaLocal(lead.id, { nextFollowUpAt })
    const salvat = await salveaza(lead, { nextFollowUpAt }, 'Nu am putut salva recontactarea')
    if (!salvat) actualizeazaLocal(lead.id, { nextFollowUpAt: anterior })
    else toast.success(nextFollowUpAt ? `Recontactare: ${formateazaFollowUp(nextFollowUpAt)}` : 'Recontactare ștearsă')
  }

  async function adaugaNota(lead, continut) {
    const raspuns = await fetch(`/api/admin/leads/${lead.id}/notite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ continut }),
    })
    if (!raspuns.ok) {
      toast.error('Nu am putut salva notița')
      return false
    }
    const { nota } = await raspuns.json()
    actualizeazaLocal(lead.id, { notiteIstoric: [nota, ...(lead.notiteIstoric || [])] })
    return true
  }

  async function stergeNota(lead, notaId) {
    const raspuns = await fetch(`/api/admin/leads/notite/${notaId}`, { method: 'DELETE' })
    if (!raspuns.ok) {
      toast.error('Nu am putut șterge notița')
      return
    }
    actualizeazaLocal(lead.id, {
      notiteIstoric: (lead.notiteIstoric || []).filter((n) => n.id !== notaId),
    })
  }

  function copiazaPitch(pitch) {
    navigator.clipboard?.writeText(pitch)
    toast.success('Pitch copiat')
  }

  // ── Numărătoarea de follow-up din lista curentă ──────────────────
  const contorFollowUp = useMemo(() => {
    const c = { restant: 0, azi: 0, urmeaza: 0 }
    for (const l of leaduri) {
      const s = stareFollowUp(l.nextFollowUpAt)
      if (s) c[s]++
    }
    return c
  }, [leaduri])

  const oraseleDinDate = useMemo(
    () => [...new Set(leaduri.map((l) => l.oras).filter(Boolean))].sort(),
    [leaduri]
  )

  const setFiltru = (cheie, valoare) => setFiltre((f) => ({ ...f, [cheie]: valoare }))

  // ============================================================
  // RANDARE
  // ============================================================

  return (
    <div className="space-y-5">
      {/* ── Antet ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Leaduri Web</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Firme din Moldova cu prezență online slabă — sortate după cât de mult au nevoie de un site.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/leads/export?format=xlsx&${parametri.toString()}`}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Excel
          </a>
          <a
            href={`/api/admin/leads/export?format=csv&${parametri.toString()}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            CSV
          </a>
          {poateRula && !ruleaza && (
            <button
              onClick={() => setPanouRulare((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <PlayIcon className="h-4 w-4" />
              Caută firme noi
            </button>
          )}
          {ruleaza && (
            <button
              onClick={opreste}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <StopIcon className="h-4 w-4" />
              Oprește
            </button>
          )}
        </div>
      </div>

      {!areCheieGoogle && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Lipsește GOOGLE_API_KEY</p>
            <p className="mt-0.5">
              Fără ea nu pot căuta firme noi. Tabelul și exportul funcționează normal cu ce e deja
              salvat. Instrucțiuni în <code className="font-mono">README-LEADURI.md</code>.
            </p>
          </div>
        </div>
      )}

      {/* ── Cartonașe ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cartonas titlu="Total lead-uri" valoare={stats.total} />
        <Cartonas
          titlu="Fără site propriu"
          valoare={stats.faraSite}
          accent="text-red-600"
          subtitlu="LIPSA + DOAR_SOCIAL"
        />
        <Cartonas
          titlu="Apeluri API luna asta"
          valoare={`${stats.apeluriLunaCurenta} / 1000`}
          accent={stats.apeluriLunaCurenta > 800 ? 'text-red-600' : 'text-gray-900'}
          subtitlu="limita gratuită Google"
        />
        <Cartonas
          titlu="Pitch generat de"
          valoare={furnizorPitch === 'openai' ? modelPitch || 'OpenAI' : 'Șabloane'}
          subtitlu={
            furnizorPitch === 'openai' ? 'validat: fără cifre inventate' : 'fără cheie OpenAI — gratis'
          }
        />
      </div>

      {/* ── Bara de recontactare ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          De recontactat
        </span>
        {[
          { cheie: 'restante', stare: 'restant', eticheta: 'Restante' },
          { cheie: 'azi', stare: 'azi', eticheta: 'Azi' },
          { cheie: 'urmeaza', stare: 'urmeaza', eticheta: 'Urmează' },
        ].map(({ cheie, stare, eticheta }) => {
          const stil = STILURI_FOLLOWUP[stare]
          const activ = filtre.followUp === cheie
          return (
            <button
              key={cheie}
              onClick={() => setFiltru('followUp', activ ? '' : cheie)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
                activ ? `${stil.color} ring-2 ring-offset-1 ring-indigo-400` : stil.color
              }`}
            >
              {stil.emoji} {eticheta}
              <span className="font-bold">{contorFollowUp[stare]}</span>
            </button>
          )
        })}
        {filtre.followUp && (
          <button
            onClick={() => setFiltru('followUp', '')}
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            arată tot
          </button>
        )}
      </div>

      {panouRulare && poateRula && !ruleaza && (
        <PanouRulare
          optiuni={optiuni}
          oraseAlese={oraseAlese}
          setOraseAlese={setOraseAlese}
          categoriiAlese={categoriiAlese}
          setCategoriiAlese={setCategoriiAlese}
          estimare={estimare}
          onPornire={porneste}
          onAnulare={() => setPanouRulare(false)}
        />
      )}

      {ruleaza && <PanouProgres progres={progres} loguri={loguri} />}

      {/* ── Filtre ─────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={cautare}
              onChange={(e) => setCautare(e.target.value)}
              placeholder="Caută după nume, telefon, adresă..."
              className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-3 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select value={filtre.status} onChange={(e) => setFiltru('status', e.target.value)} className={selectClass}>
            <option value="">Orice status</option>
            {STATUSURI.map((s) => (
              <option key={s.value} value={s.value}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>

          <select value={filtre.sortare} onChange={(e) => setFiltru('sortare', e.target.value)} className={selectClass}>
            {SORTARI.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select value={filtre.oras} onChange={(e) => setFiltru('oras', e.target.value)} className={selectClass}>
            <option value="">Toate orașele</option>
            {oraseleDinDate.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select value={filtre.calitate} onChange={(e) => setFiltru('calitate', e.target.value)} className={selectClass}>
            <option value="">Orice calitate site</option>
            {['LIPSA', 'MORT', 'DOAR_SOCIAL', 'FARA_HTTPS', 'NEADAPTAT_MOBIL', 'LENT', 'OK'].map((c) => {
              const info = getCalitate(c)
              return (
                <option key={c} value={c}>
                  {info.emoji} {info.label} (+{info.puncte})
                </option>
              )
            })}
          </select>

          <select value={filtre.categorie} onChange={(e) => setFiltru('categorie', e.target.value)} className={selectClass}>
            <option value="">Orice categorie</option>
            {optiuni.categorii.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={filtre.perioada} onChange={(e) => setFiltru('perioada', e.target.value)} className={selectClass}>
            {PERIOADE.map((p) => (
              <option key={p.value} value={p.value}>
                {p.value ? `Găsite: ${p.label.toLowerCase()}` : 'Găsite: oricând'}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={filtre.doarNoi}
              onChange={(e) => setFiltru('doarNoi', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
              <SparklesIcon className="h-3.5 w-3.5 text-indigo-500" />
              Doar firme noi
            </span>
            <span className="text-[11px] text-gray-400">(din ultima rulare)</span>
          </label>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">
              Scor minim: <b>{filtre.scorMin}</b>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filtre.scorMin}
              onChange={(e) => setFiltru('scorMin', Number(e.target.value))}
              className="h-2 w-32 cursor-pointer accent-indigo-600"
            />
          </div>

          <span className="ml-auto text-xs text-gray-500">
            {seIncarca ? 'se încarcă...' : `${leaduri.length} afișate`}
          </span>
        </div>
      </div>

      {/* ── Lista ──────────────────────────────────────────────── */}
      {leaduri.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <GlobeAltIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-900">Niciun lead</p>
          <p className="mt-1 text-sm text-gray-500">
            {stats.total === 0
              ? 'Apasă „Caută firme noi" ca să pornești prima rulare.'
              : 'Niciun lead nu se potrivește cu filtrele.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaduri.map((lead) => (
            <RandLead
              key={lead.id}
              lead={lead}
              onStatus={schimbaStatus}
              onFollowUp={schimbaFollowUp}
              onAdaugaNota={adaugaNota}
              onStergeNota={stergeNota}
              onCopiaza={copiazaPitch}
            />
          ))}
        </div>
      )}

      {istoric.length > 0 && <IstoricRulari rulari={istoric} />}
    </div>
  )
}

// ============================================================
// SUBCOMPONENTE
// ============================================================

function Cartonas({ titlu, valoare, subtitlu, accent = 'text-gray-900' }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{titlu}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{valoare}</p>
      {subtitlu && <p className="mt-0.5 text-xs text-gray-400">{subtitlu}</p>}
    </div>
  )
}

function RandLead({ lead, onStatus, onFollowUp, onAdaugaNota, onStergeNota, onCopiaza }) {
  const [deschis, setDeschis] = useState(false)
  const [notaNoua, setNotaNoua] = useState('')
  const [salveaza, setSalveaza] = useState(false)

  const calitate = getCalitate(lead.calitateSite)
  const status = getStatus(lead.status)
  const social = contactSocial(lead)
  const stareFU = stareFollowUp(lead.nextFollowUpAt)
  const stilFU = stareFU ? STILURI_FOLLOWUP[stareFU] : null
  const notite = lead.notiteIstoric || []

  async function trimiteNota() {
    if (!notaNoua.trim() || salveaza) return
    setSalveaza(true)
    const ok = await onAdaugaNota(lead, notaNoua.trim())
    if (ok) setNotaNoua('')
    setSalveaza(false)
  }

  return (
    <div
      className={`rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md ${
        stareFU === 'restant' ? 'ring-1 ring-red-200' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${culoareScor(lead.scor)}`}
          title="Scor 0–100: site + rating + recenzii"
        >
          {lead.scor}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900">{lead.denumire}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${calitate.color}`}>
              {calitate.emoji} {calitate.label}
            </span>
            {stilFU && (
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${stilFU.color}`}>
                {stilFU.emoji} {formateazaFollowUp(lead.nextFollowUpAt)}
              </span>
            )}
            {notite.length > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {notite.length} {notite.length === 1 ? 'notiță' : 'notițe'}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {lead.rating != null && (
              <span>⭐ {ratingRo(lead.rating)} ({lead.nrRecenzii} recenzii)</span>
            )}
            {lead.oras && (
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                {lead.oras}
              </span>
            )}
            {lead.categoriePrincipala && <span>{lead.categoriePrincipala}</span>}
          </div>

          {lead.observatiiSite && (
            <p className="mt-1 text-xs text-gray-600">
              <span className="font-medium">Site:</span> {lead.observatiiSite}
            </p>
          )}

          {lead.pitch && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-indigo-50 p-2.5">
              <p className="flex-1 text-sm italic text-indigo-900">„{lead.pitch}&rdquo;</p>
              <button
                onClick={() => onCopiaza(lead.pitch)}
                className="shrink-0 rounded p-1 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
                title="Copiază pitch-ul"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {lead.telefon ? (
            <a
              href={`tel:${lead.telefon}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <PhoneIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{lead.telefon}</span>
            </a>
          ) : (
            social && (
              <a
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                title="Firma nu are telefon în Google Maps — scrie-i pe rețea"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Scrie pe {social.nume}</span>
              </a>
            )
          )}

          <select
            value={lead.status}
            onChange={(e) => onStatus(lead, e.target.value)}
            className={`rounded-lg border px-2 py-1 text-xs font-medium ${status.color}`}
          >
            {STATUSURI.map((s) => (
              <option key={s.value} value={s.value}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setDeschis((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            {deschis ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
            Detalii
          </button>
        </div>
      </div>

      {deschis && (
        <div className="mt-3 space-y-4 border-t border-gray-100 pt-3">
          <FollowUpPicker valoare={lead.nextFollowUpAt} onChange={(v) => onFollowUp(lead, v)} />

          {/* Istoricul discuțiilor */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-700">Istoric discuții</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={notaNoua}
                onChange={(e) => setNotaNoua(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && trimiteNota()}
                placeholder="Ce s-a discutat la telefon..."
                className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={trimiteNota}
                disabled={!notaNoua.trim() || salveaza}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {salveaza ? '...' : 'Adaugă'}
              </button>
            </div>

            {notite.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {notite.map((n) => (
                  <li key={n.id} className="group flex items-start gap-2 rounded-lg bg-gray-50 p-2 text-xs">
                    <div className="flex-1">
                      <p className="text-gray-800">{n.continut}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {new Date(n.createdAt).toLocaleString('ro-RO', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {n.autorNume ? ` · ${n.autorNume}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => onStergeNota(lead, n.id)}
                      className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-red-600"
                      title="Șterge notița"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {lead.adresa && <span>{lead.adresa}</span>}
            {lead.siteUrl && (
              <a href={lead.siteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                {lead.siteUrl}
              </a>
            )}
            {lead.linkMaps && (
              <a href={lead.linkMaps} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                Vezi pe Maps
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PanouRulare({
  optiuni,
  oraseAlese,
  setOraseAlese,
  categoriiAlese,
  setCategoriiAlese,
  estimare,
  onPornire,
  onAnulare,
}) {
  function comuta(lista, setLista, valoare) {
    setLista(lista.includes(valoare) ? lista.filter((x) => x !== valoare) : [...lista, valoare])
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm">
      <h2 className="font-semibold text-gray-900">Rulare nouă</h2>
      <p className="mt-0.5 text-sm text-gray-600">
        Se caută fiecare categorie în fiecare oraș. Interogările rulate în ultimele 30 de zile sunt
        sărite automat, iar firmele deja găsite nu se salvează a doua oară.
      </p>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Orașe ({oraseAlese.length})</p>
          <div className="flex gap-2 text-xs">
            <button onClick={() => setOraseAlese(optiuni.toateOrasele)} className="text-indigo-600 hover:underline">toate</button>
            <button onClick={() => setOraseAlese(optiuni.oraseImplicite)} className="text-indigo-600 hover:underline">implicite</button>
            <button onClick={() => setOraseAlese([])} className="text-gray-500 hover:underline">niciunul</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {optiuni.toateOrasele.map((oras) => (
            <button
              key={oras}
              onClick={() => comuta(oraseAlese, setOraseAlese, oras)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                oraseAlese.includes(oras)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50'
              }`}
            >
              {oras}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Categorii ({categoriiAlese.length})</p>
          <div className="flex gap-2 text-xs">
            <button onClick={() => setCategoriiAlese(optiuni.categorii)} className="text-indigo-600 hover:underline">toate</button>
            <button onClick={() => setCategoriiAlese([])} className="text-gray-500 hover:underline">niciuna</button>
          </div>
        </div>
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg bg-white/60 p-2">
          {optiuni.categorii.map((categorie) => (
            <button
              key={categorie}
              onClick={() => comuta(categoriiAlese, setCategoriiAlese, categorie)}
              className={`rounded-full px-2.5 py-1 text-xs transition ${
                categoriiAlese.includes(categorie)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50'
              }`}
            >
              {categorie}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-white p-3 text-sm">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Interogări</p>
            <p className="font-semibold text-gray-900">{estimare.interogari}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Apeluri API</p>
            <p className="font-semibold text-gray-900">{estimare.apeluriMin}–{estimare.apeluriMax}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Cost estimat</p>
            <p className="font-semibold text-gray-900">{estimare.costMin}–{estimare.costMax} $</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Firme (maxim)</p>
            <p className="font-semibold text-gray-900">~{estimare.firmeMax}</p>
          </div>
        </div>

        {estimare.depaseste && (
          <p className="mt-2 flex items-start gap-1.5 rounded bg-red-50 p-2 text-xs text-red-700">
            <ExclamationTriangleIcon className="mt-px h-4 w-4 shrink-0" />
            Selecția depășește plafonul de {optiuni.buget.maxApeluriPeRulare} apeluri pe rulare.
            Alege mai puține orașe sau categorii.
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onPornire}
          disabled={estimare.depaseste || !estimare.interogari}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <PlayIcon className="h-4 w-4" />
          Pornește rularea
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

function PanouProgres({ progres, loguri }) {
  const faze = {
    SEARCH: 'Caut firme pe Google Maps',
    CHECK: 'Verific site-urile',
    PITCH: 'Scriu frazele de deschidere',
    DONE: 'Gata',
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-600" />
        </span>
        <p className="font-medium text-gray-900">{faze[progres?.faza] || 'Pregătesc rularea'}</p>
      </div>

      {progres && (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progres.procent || 0}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">
            <span>Interogări: <b>{progres.interogariFacute}/{progres.totalInterogari}</b></span>
            <span>Apeluri API: <b>{progres.rezumat?.apeluriApi ?? 0}</b></span>
            <span>Cost: <b>{progres.rezumat?.costEstimatUsd ?? 0} $</b></span>
            <span>Firme noi: <b>{progres.rezumat?.firmeNoi ?? 0}</b></span>
            {progres.rezumat?.interogariSarite > 0 && (
              <span className="text-green-600">
                Sărite din cache: <b>{progres.rezumat.interogariSarite}</b>
              </span>
            )}
          </div>
        </>
      )}

      {loguri.length > 0 && (
        <pre className="mt-3 max-h-44 overflow-y-auto rounded-lg bg-gray-900 p-3 text-[11px] leading-relaxed text-gray-100">
          {loguri.join('\n')}
        </pre>
      )}
    </div>
  )
}

function IstoricRulari({ rulari }) {
  const [deschis, setDeschis] = useState(false)

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <button onClick={() => setDeschis((v) => !v)} className="flex w-full items-center justify-between text-left">
        <h2 className="font-semibold text-gray-900">Istoric rulări ({rulari.length})</h2>
        {deschis ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
      </button>

      {deschis && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="pb-2 pr-3">Data</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Apeluri</th>
                <th className="pb-2 pr-3">Cost</th>
                <th className="pb-2 pr-3">Firme noi</th>
                <th className="pb-2">Fără site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rulari.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-3 text-gray-600">
                    {new Date(r.startedAt).toLocaleDateString('ro-RO', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        r.status === 'DONE'
                          ? 'bg-green-100 text-green-800'
                          : r.status === 'EROARE'
                            ? 'bg-red-100 text-red-800'
                            : r.status === 'ANULAT'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-gray-900">{r.apeluriApi}</td>
                  <td className="py-2 pr-3 text-gray-900">{(r.costUsd ?? 0).toFixed(2)} $</td>
                  <td className="py-2 pr-3 text-gray-900">
                    <b>{r.firmeNoi}</b>
                    <span className="text-xs text-gray-400"> / {r.firmeTotal} atinse</span>
                  </td>
                  <td className="py-2 text-gray-900">{r.faraSite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
