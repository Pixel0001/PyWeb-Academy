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
} from '@heroicons/react/24/outline'

// ============================================================
// ETICHETE ȘI CULORI
// ============================================================

const CALITATE = {
  LIPSA: { eticheta: 'Fără site', culoare: 'bg-red-100 text-red-800', puncte: 50 },
  MORT: { eticheta: 'Site mort', culoare: 'bg-orange-100 text-orange-800', puncte: 45 },
  DOAR_SOCIAL: { eticheta: 'Doar social', culoare: 'bg-amber-100 text-amber-800', puncte: 40 },
  FARA_HTTPS: { eticheta: 'Fără HTTPS', culoare: 'bg-yellow-100 text-yellow-800', puncte: 25 },
  NEADAPTAT_MOBIL: { eticheta: 'Nemobil', culoare: 'bg-lime-100 text-lime-800', puncte: 20 },
  LENT: { eticheta: 'Lent', culoare: 'bg-sky-100 text-sky-800', puncte: 15 },
  OK: { eticheta: 'Site OK', culoare: 'bg-gray-100 text-gray-600', puncte: 0 },
}

const STATUS = {
  DE_SUNAT: { eticheta: '📞 De sunat', culoare: 'bg-blue-100 text-blue-800' },
  SUNAT: { eticheta: '☎️ Sunat', culoare: 'bg-yellow-100 text-yellow-800' },
  INTERESAT: { eticheta: '🟢 Interesat', culoare: 'bg-green-100 text-green-800' },
  REFUZ: { eticheta: '🔴 Refuz', culoare: 'bg-red-100 text-red-800' },
  NU_MA_SUNA: { eticheta: '⛔ Nu mă suna', culoare: 'bg-gray-200 text-gray-700' },
}

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
// Lista trebuie să rămână în pas cu `verificareSite.domeniiSociale` din config.
const RETELE = [
  { potrivire: /facebook\.com/i, nume: 'Facebook' },
  { potrivire: /instagram\.com/i, nume: 'Instagram' },
  { potrivire: /ok\.ru/i, nume: 'OK' },
  { potrivire: /vk\.com/i, nume: 'VK' },
  { potrivire: /linktr\.ee/i, nume: 'Linktree' },
]

/** Dacă firma n-are telefon, dar are pagină de social, întoarce linkul și rețeaua. */
function contactSocial(lead) {
  if (!lead.siteUrl) return null
  const retea = RETELE.find((r) => r.potrivire.test(lead.siteUrl))
  return retea ? { url: lead.siteUrl, nume: retea.nume } : null
}

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

  // ── Filtre tabel ──────────────────────────────────────────────────
  const [cautare, setCautare] = useState('')
  const [filtruOras, setFiltruOras] = useState('')
  const [filtruCalitate, setFiltruCalitate] = useState('')
  const [filtruStatus, setFiltruStatus] = useState('')
  const [scorMin, setScorMin] = useState(0)

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
  // ESTIMAREA COSTULUI (înainte de a cheltui ceva)
  // ============================================================
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

  // ============================================================
  // BUCLA DE EXECUȚIE — cere pas după pas până se termină
  // ============================================================
  const ruleazaPasi = useCallback(async (id) => {
    opresteRef.current = false
    setRuleaza(true)

    while (!opresteRef.current) {
      let raspuns
      try {
        raspuns = await fetch(`/api/admin/leads/runs/${id}/step`, { method: 'POST' })
      } catch {
        toast.error('Conexiune pierdută. Rularea rămâne salvată — reia-o oricând.')
        break
      }

      // 202 = un alt pas rulează deja (altă filă deschisă). Așteptăm puțin.
      if (raspuns.status === 202) {
        await new Promise((r) => setTimeout(r, 3000))
        continue
      }

      const date = await raspuns.json().catch(() => ({}))

      if (!raspuns.ok) {
        toast.error(date.error || 'Pasul a eșuat')
        break
      }

      setProgres({ ...date.progres, faza: date.faza, rezumat: date.rezumat })
      if (date.loguri?.length) setLoguri(date.loguri)

      if (date.avertisment) {
        toast(date.avertisment, { icon: '⚠️', duration: 8000 })
      }

      if (date.terminat) {
        if (date.eroare) toast.error(`Rulare oprită: ${date.eroare}`)
        else toast.success('Rulare încheiată. Lead-urile sunt în tabel.')
        break
      }
    }

    setRuleaza(false)
    await reincarca()
  }, [])

  // Dacă intru pe pagină și o rulare era în curs, o continui automat.
  useEffect(() => {
    if (rulareActiva?.id) ruleazaPasi(rulareActiva.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    if (runId) {
      await fetch(`/api/admin/leads/runs/${runId}`, { method: 'DELETE' })
    }
    setRuleaza(false)
    toast('Rulare oprită', { icon: '🛑' })
    reincarca()
  }

  async function reincarca() {
    try {
      const raspuns = await fetch('/api/admin/leads?limita=500')
      if (!raspuns.ok) return
      const date = await raspuns.json()
      setLeaduri(date.leaduri)
      setStats((s) => ({
        ...s,
        total: date.total,
        faraSite: date.leaduri.filter((l) => ['LIPSA', 'DOAR_SOCIAL'].includes(l.calitateSite)).length,
      }))

      const r = await fetch('/api/admin/leads/runs')
      if (r.ok) {
        const d = await r.json()
        setIstoric(d.rulari)
        setStats((s) => ({ ...s, apeluriLunaCurenta: d.apeluriLunaCurenta }))
      }
    } catch {
      /* reîncărcarea e opțională — tabelul rămâne cum era */
    }
  }

  // ============================================================
  // ACȚIUNI PE LEAD
  // ============================================================

  async function schimbaStatus(lead, status) {
    setLeaduri((l) => l.map((x) => (x.id === lead.id ? { ...x, status } : x)))
    const raspuns = await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!raspuns.ok) {
      toast.error('Nu am putut salva statusul')
      setLeaduri((l) => l.map((x) => (x.id === lead.id ? { ...x, status: lead.status } : x)))
    }
  }

  async function salveazaNotite(lead, notite) {
    if (notite === (lead.notite || '')) return
    setLeaduri((l) => l.map((x) => (x.id === lead.id ? { ...x, notite } : x)))
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notite }),
    })
  }

  function copiazaPitch(pitch) {
    navigator.clipboard?.writeText(pitch)
    toast.success('Pitch copiat')
  }

  // ============================================================
  // FILTRARE
  // ============================================================
  const leaduriFiltrate = useMemo(() => {
    let rezultat = leaduri

    if (filtruOras) rezultat = rezultat.filter((l) => l.oras === filtruOras)
    if (filtruCalitate) rezultat = rezultat.filter((l) => l.calitateSite === filtruCalitate)
    if (filtruStatus) rezultat = rezultat.filter((l) => l.status === filtruStatus)
    if (scorMin > 0) rezultat = rezultat.filter((l) => (l.scor || 0) >= scorMin)

    if (cautare.trim()) {
      const q = cautare.toLowerCase().trim()
      rezultat = rezultat.filter(
        (l) =>
          l.denumire?.toLowerCase().includes(q) ||
          l.telefon?.includes(q) ||
          l.adresa?.toLowerCase().includes(q)
      )
    }

    return rezultat
  }, [leaduri, filtruOras, filtruCalitate, filtruStatus, scorMin, cautare])

  const parametriExport = useMemo(() => {
    const p = new URLSearchParams()
    if (filtruOras) p.set('oras', filtruOras)
    if (filtruCalitate) p.set('calitate', filtruCalitate)
    if (filtruStatus) p.set('status', filtruStatus)
    if (scorMin > 0) p.set('scorMin', String(scorMin))
    return p.toString()
  }, [filtruOras, filtruCalitate, filtruStatus, scorMin])

  const oraseleDinDate = useMemo(
    () => [...new Set(leaduri.map((l) => l.oras).filter(Boolean))].sort(),
    [leaduri]
  )

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
            href={`/api/admin/leads/export?format=xlsx&${parametriExport}`}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Excel
          </a>
          <a
            href={`/api/admin/leads/export?format=csv&${parametriExport}`}
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

      {/* ── Avertisment lipsă cheie ────────────────────────────── */}
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

      {/* ── Cartonașe cu cifre ─────────────────────────────────── */}
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
            furnizorPitch === 'openai'
              ? 'validat: fără cifre inventate'
              : 'fără cheie OpenAI — gratis'
          }
        />
      </div>

      {/* ── Panoul de rulare nouă ──────────────────────────────── */}
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

      {/* ── Progresul rulării ──────────────────────────────────── */}
      {ruleaza && <PanouProgres progres={progres} loguri={loguri} />}

      {/* ── Filtre ─────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={cautare}
              onChange={(e) => setCautare(e.target.value)}
              placeholder="Caută după nume, telefon, adresă..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filtruOras}
            onChange={(e) => setFiltruOras(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Toate orașele</option>
            {oraseleDinDate.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select
            value={filtruCalitate}
            onChange={(e) => setFiltruCalitate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Orice calitate site</option>
            {Object.entries(CALITATE).map(([cheie, v]) => (
              <option key={cheie} value={cheie}>
                {v.eticheta} (+{v.puncte})
              </option>
            ))}
          </select>

          <select
            value={filtruStatus}
            onChange={(e) => setFiltruStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Orice status</option>
            {Object.entries(STATUS).map(([cheie, v]) => (
              <option key={cheie} value={cheie}>{v.eticheta}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-gray-600">Scor minim: <b>{scorMin}</b></label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={scorMin}
            onChange={(e) => setScorMin(Number(e.target.value))}
            className="h-2 flex-1 max-w-xs cursor-pointer accent-indigo-600"
          />
          <span className="text-sm text-gray-500">
            {leaduriFiltrate.length} din {leaduri.length}
          </span>
        </div>
      </div>

      {/* ── Tabelul ────────────────────────────────────────────── */}
      {leaduriFiltrate.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <GlobeAltIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-900">Niciun lead</p>
          <p className="mt-1 text-sm text-gray-500">
            {leaduri.length === 0
              ? 'Apasă „Caută firme noi" ca să pornești prima rulare.'
              : 'Niciun lead nu se potrivește cu filtrele.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaduriFiltrate.map((lead) => (
            <RandLead
              key={lead.id}
              lead={lead}
              onStatus={schimbaStatus}
              onNotite={salveazaNotite}
              onCopiaza={copiazaPitch}
            />
          ))}
        </div>
      )}

      {/* ── Istoricul rulărilor ────────────────────────────────── */}
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
        sărite automat — nu plătești de două ori pentru aceleași firme.
      </p>

      {/* Orașe */}
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

      {/* Categorii */}
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

      {/* Estimarea costului */}
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
        <p className="font-medium text-gray-900">
          {faze[progres?.faza] || 'Pregătesc rularea'}
        </p>
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
            <span>
              Interogări: <b>{progres.interogariFacute}/{progres.totalInterogari}</b>
            </span>
            <span>
              Apeluri API: <b>{progres.rezumat?.apeluriApi ?? 0}</b>
            </span>
            <span>
              Cost: <b>{progres.rezumat?.costEstimatUsd ?? 0} $</b>
            </span>
            <span>
              Firme: <b>{progres.rezumat?.firmeUnice ?? 0}</b>
            </span>
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

function RandLead({ lead, onStatus, onNotite, onCopiaza }) {
  const [deschis, setDeschis] = useState(false)
  const calitate = CALITATE[lead.calitateSite] || {
    eticheta: 'Neverificat',
    culoare: 'bg-gray-100 text-gray-500',
  }
  const social = contactSocial(lead)

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        {/* Scorul */}
        <div
          className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg font-bold ${culoareScor(lead.scor)}`}
          title="Scor 0–100: site + rating + recenzii"
        >
          <span className="text-lg leading-none">{lead.scor}</span>
        </div>

        {/* Datele firmei */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900">{lead.denumire}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${calitate.culoare}`}>
              {calitate.eticheta}
            </span>
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

          {/* Pitch-ul — asta citesc la telefon */}
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

        {/* Acțiuni */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          {/* Are telefon → îl sun. N-are, dar are social → îi scriu acolo. */}
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
            className={`rounded-lg border-0 px-2 py-1 text-xs font-medium ${STATUS[lead.status]?.culoare || ''}`}
          >
            {Object.entries(STATUS).map(([cheie, v]) => (
              <option key={cheie} value={cheie}>{v.eticheta}</option>
            ))}
          </select>

          <button
            onClick={() => setDeschis((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            {deschis ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
            Notițe
          </button>
        </div>
      </div>

      {/* Detalii */}
      {deschis && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <textarea
            defaultValue={lead.notite || ''}
            onBlur={(e) => onNotite(lead, e.target.value)}
            rows={2}
            placeholder="Notițe din timpul apelului..."
            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
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

function IstoricRulari({ rulari }) {
  const [deschis, setDeschis] = useState(false)

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <button
        onClick={() => setDeschis((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
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
                <th className="pb-2 pr-3">Firme</th>
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
                    {r.firmeTotal} <span className="text-xs text-gray-400">({r.firmeNoi} noi)</span>
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
