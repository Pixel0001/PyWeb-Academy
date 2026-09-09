'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  XMarkIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import EditorSecventa from './EditorSecventa'

// ============================================================
// AJUTOARE
// ============================================================

const STARI_MAILBOX = {
  bun: { eticheta: 'Sănătos', culoare: 'bg-green-100 text-green-800 border-green-300', emoji: '🟢' },
  atentie: { eticheta: 'Atenție', culoare: 'bg-amber-100 text-amber-800 border-amber-300', emoji: '🟠' },
  periculos: { eticheta: 'Periculos', culoare: 'bg-red-100 text-red-800 border-red-300', emoji: '🔴' },
}

const TABURI = [
  { id: 'campanii', eticheta: 'Campanii & răspunsuri', icon: EnvelopeIcon },
  { id: 'cautare', eticheta: 'Caută contacte', icon: MagnifyingGlassIcon },
  { id: 'contacte', eticheta: 'Contactele mele', icon: ChatBubbleLeftRightIcon },
  { id: 'sanatate', eticheta: 'Sănătate email', icon: CheckCircleIcon },
]

const input =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'

/** „3 day" → „3 zile" */
function traduUnitate(n, unitate) {
  const u = { minute: ['minut', 'minute'], hour: ['oră', 'ore'], day: ['zi', 'zile'] }[unitate]
  if (!u) return `${n} ${unitate}`
  return `${n} ${n === 1 ? u[0] : u[1]}`
}

function procent(v) {
  return v == null ? '—' : `${v}%`
}

// ============================================================
// COMPONENTA PRINCIPALĂ
// ============================================================

export default function ApolloClient({
  persoaneInitiale,
  areCheie,
  credite: crediteInitiale,
  statistici,
  config,
  poateGestiona,
}) {
  const [tab, setTab] = useState('campanii')
  const [stare, setStare] = useState(null) // mailboxuri + secvente, de la API
  const [seIncarca, setSeIncarca] = useState(true)
  const [credite, setCredite] = useState(crediteInitiale)

  // ── Căutare ───────────────────────────────────────────────────────
  const [filtre, setFiltre] = useState({
    person_titles: [],
    person_seniorities: [],
    organization_locations: [],
    organization_num_employees_ranges: [],
    q_keywords: '',
  })
  const [rezultate, setRezultate] = useState([])
  const [paginare, setPaginare] = useState(null)
  const [cauta, setCauta] = useState(false)
  const [alese, setAlese] = useState(new Set())
  const [ascundeCunoscute, setAscundeCunoscute] = useState(true)
  const [rezumatCautare, setRezumatCautare] = useState(null)

  // ── Contacte salvate ──────────────────────────────────────────────
  const [persoane, setPersoane] = useState(persoaneInitiale)
  const [aleseContacte, setAleseContacte] = useState(new Set())

  // ── Trimitere ─────────────────────────────────────────────────────
  const [secventaAleasa, setSecventaAleasa] = useState('')
  const [mailboxuriAlese, setMailboxuriAlese] = useState([])
  const [trimite, setTrimite] = useState(false)
  const [editorDeschis, setEditorDeschis] = useState(false)

  const incarcaStarea = useCallback(async () => {
    setSeIncarca(true)
    try {
      const r = await fetch('/api/admin/apollo')
      const d = await r.json()
      if (!r.ok) {
        toast.error(d.error || 'Apollo indisponibil')
        return
      }
      setStare(d)
      if (d.credite) setCredite((c) => ({ ...c, ...d.credite }))
      // Preselectăm mailbox-ul implicit sănătos
      const bun = (d.mailboxuri || []).find((m) => m.implicit && m.poateTrimite)
      if (bun) setMailboxuriAlese((v) => (v.length ? v : [bun.id]))
    } catch {
      toast.error('Nu am putut contacta Apollo')
    } finally {
      setSeIncarca(false)
    }
  }, [])

  useEffect(() => {
    if (areCheie) incarcaStarea()
    else setSeIncarca(false)
  }, [areCheie, incarcaStarea])

  // ============================================================
  // ACȚIUNI
  // ============================================================

  async function ruleazaCautarea(pagina = 1) {
    const areFiltru = Object.values(filtre).some((v) =>
      Array.isArray(v) ? v.length : String(v).trim()
    )
    if (!areFiltru) {
      toast.error('Alege cel puțin un filtru')
      return
    }

    setCauta(true)
    try {
      const r = await fetch('/api/admin/apollo/cautare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filtre, pagina, ascundeCunoscute }),
      })
      const d = await r.json()
      if (!r.ok) {
        toast.error(d.error || 'Căutarea a eșuat')
        return
      }
      setRezultate(d.persoane)
      setPaginare(d.paginare)
      setRezumatCautare({ noi: d.noi, cunoscute: d.cunoscute })
      setAlese(new Set())

      if (!d.persoane.length) {
        toast(
          d.cunoscute
            ? `Toate cele ${d.cunoscute} rezultate le aveai deja salvate`
            : 'Niciun rezultat pentru filtrele astea',
          { icon: '🔍' }
        )
      } else if (d.noi) {
        toast.success(`${d.noi} contacte noi, salvate automat`)
      }
    } finally {
      setCauta(false)
    }
  }

  async function faEnrich() {
    const deLucru = rezultate.filter((p) => alese.has(p.apolloPersonId))
    if (!deLucru.length) {
      toast.error('Bifează pe cine vrei să îmbogățești')
      return
    }

    const cuEmail = deLucru.filter((p) => p.areEmail).length
    if (
      !confirm(
        `Cauți emailurile pentru ${deLucru.length} persoane.\n\n` +
          `${cuEmail} au email la Apollo → cam ${cuEmail} credite.\n` +
          `Ai ${credite.ramase} credite rămase.\n\nContinui?`
      )
    ) {
      return
    }

    const t = toast.loading('Caut emailurile...')
    try {
      const r = await fetch('/api/admin/apollo/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persoane: deLucru }),
      })
      const d = await r.json()
      toast.dismiss(t)

      if (!r.ok) {
        toast.error(d.error || 'Enrich eșuat')
        return
      }

      toast.success(
        `${d.cuEmail} emailuri găsite din ${d.imbogatite} verificate. ` +
          `${d.crediteFolosite} credite folosite, ${d.crediteRamase} rămase.`
      )
      setCredite((c) => ({
        ...c,
        folosite: c.folosite + d.crediteFolosite,
        ramase: d.crediteRamase,
        procent: Math.round(((c.folosite + d.crediteFolosite) / c.total) * 100),
      }))
      await reincarcaContacte()
      setTab('contacte')
    } catch {
      toast.dismiss(t)
      toast.error('Enrich eșuat')
    }
  }

  async function reincarcaContacte() {
    // Pagina server ține lista; o reîmprospătăm printr-un refetch simplu.
    try {
      const r = await fetch('/api/admin/apollo?statistici=0')
      if (r.ok) await r.json()
    } catch {
      /* opțional */
    }
    // Reîncărcăm pagina ca să vină lista actualizată din server component
    if (typeof window !== 'undefined') window.location.reload()
  }

  async function bagaInSecventa(ignoraAvertismente = false) {
    if (!secventaAleasa) {
      toast.error('Alege secvența în care intră contactele')
      return
    }
    if (!mailboxuriAlese.length) {
      toast.error('Alege de pe ce adresă pleacă emailurile')
      return
    }

    const ids = [...aleseContacte]
    if (!ids.length) {
      toast.error('Bifează contactele pe care le bagi în secvență')
      return
    }

    setTrimite(true)
    try {
      const r = await fetch(`/api/admin/apollo/secvente/${secventaAleasa}/adauga`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persoaneIds: ids, mailboxIds: mailboxuriAlese, ignoraAvertismente }),
      })
      const d = await r.json()

      if (r.status === 409 && d.potiIgnora) {
        const probleme = d.mailboxuriProblema
          .map((m) => `${m.email}: ${m.probleme.join(', ')}`)
          .join('\n')
        if (
          confirm(
            `Mailbox în stare proastă:\n\n${probleme}\n\n` +
              'Dacă trimiți acum, rate mari de bounce pot duce la blocarea domeniului.\n\nTrimiți totuși?'
          )
        ) {
          setTrimite(false)
          return bagaInSecventa(true)
        }
        return
      }

      if (!r.ok) {
        toast.error(d.error || 'Adăugarea a eșuat')
        return
      }

      toast.success(`${d.adaugate} contacte adăugate. Apollo începe să trimită.`)
      setAleseContacte(new Set())
      await incarcaStarea()
    } finally {
      setTrimite(false)
    }
  }

  // ============================================================
  // RANDARE
  // ============================================================

  if (!areCheie) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
          <div>
            <h1 className="text-lg font-semibold text-amber-900">Lipsește APOLLO_API_KEY</h1>
            <p className="mt-1 text-sm text-amber-800">
              Pune cheia Apollo în <code className="font-mono">.env.local</code> (local) și în
              Vercel → Settings → Environment Variables (producție), apoi redeploy.
            </p>
            <pre className="mt-3 rounded-lg bg-amber-100 p-3 text-xs text-amber-900">
              APOLLO_API_KEY=cheia_ta
            </pre>
          </div>
        </div>
      </div>
    )
  }

  const mailboxuri = stare?.mailboxuri || []
  const secvente = stare?.secvente || []

  return (
    <div className="space-y-5">
      {/* ── Antet ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Apollo &amp; Email</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Caută contacte oriunde în lume, află-le emailul și lasă Apollo să trimită campania cu
            follow-up automat.
          </p>
        </div>
        <button
          onClick={incarcaStarea}
          disabled={seIncarca}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${seIncarca ? 'animate-spin' : ''}`} />
          Reîmprospătează
        </button>
      </div>

      {/* ── Cartonașe ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cartonas
          titlu="Credite luna asta"
          valoare={`${credite.folosite} / ${credite.total}`}
          accent={credite.procent > 80 ? 'text-red-600' : 'text-gray-900'}
          subtitlu={`${credite.ramase} rămase · plan ${credite.planUsd} $`}
        />
        <Cartonas titlu="Contacte salvate" valoare={statistici.totalPersoane} />
        <Cartonas
          titlu="Cu email găsit"
          valoare={statistici.cuEmail}
          accent="text-green-600"
          subtitlu={`${statistici.inSecventa} în secvențe`}
        />
        <Cartonas
          titlu="Mailbox-uri"
          valoare={mailboxuri.length}
          subtitlu={
            mailboxuri.filter((m) => m.poateTrimite).length === mailboxuri.length
              ? 'toate sănătoase'
              : 'unul are probleme'
          }
          accent={mailboxuri.some((m) => !m.poateTrimite) ? 'text-red-600' : 'text-gray-900'}
        />
      </div>

      {/* ── Bara de credite ───────────────────────────────────── */}
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-gray-700">Credite Apollo</span>
          <span className="text-gray-500">
            {credite.folosite} folosite · {credite.ramase} rămase
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${
              credite.procent > 90 ? 'bg-red-500' : credite.procent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(100, credite.procent)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400">
          Căutarea e gratuită. Se consumă 1 credit doar când Apollo chiar găsește un email.
        </p>
      </div>

      {/* ── Taburi ────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABURI.map((t) => {
          const Icon = t.icon
          const activ = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${
                activ
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.eticheta}
            </button>
          )
        })}
      </div>

      {seIncarca && !stare && (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Se încarcă datele din Apollo...
        </div>
      )}

      {/* ── CAMPANII ──────────────────────────────────────────── */}
      {tab === 'campanii' && stare && (
        <div className="space-y-4">
          {poateGestiona && !editorDeschis && (
            <button
              onClick={() => setEditorDeschis(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4" />
              Scrie o secvență nouă
            </button>
          )}

          {editorDeschis && (
            <EditorSecventa
              onInchide={() => setEditorDeschis(false)}
              onCreata={() => incarcaStarea()}
            />
          )}

          <TabCampanii
            secvente={secvente}
            poateGestiona={poateGestiona}
            onReimprospateaza={incarcaStarea}
          />
        </div>
      )}

      {/* ── CĂUTARE ───────────────────────────────────────────── */}
      {tab === 'cautare' && (
        <TabCautare
          filtre={filtre}
          setFiltre={setFiltre}
          config={config}
          rezultate={rezultate}
          paginare={paginare}
          cauta={cauta}
          alese={alese}
          setAlese={setAlese}
          ascundeCunoscute={ascundeCunoscute}
          setAscundeCunoscute={setAscundeCunoscute}
          rezumat={rezumatCautare}
          onCauta={ruleazaCautarea}
          onEnrich={faEnrich}
          poateGestiona={poateGestiona}
        />
      )}

      {/* ── CONTACTE ──────────────────────────────────────────── */}
      {tab === 'contacte' && (
        <TabContacte
          persoane={persoane}
          alese={aleseContacte}
          setAlese={setAleseContacte}
          secvente={secvente}
          secventaAleasa={secventaAleasa}
          setSecventaAleasa={setSecventaAleasa}
          mailboxuri={mailboxuri}
          mailboxuriAlese={mailboxuriAlese}
          setMailboxuriAlese={setMailboxuriAlese}
          onTrimite={() => bagaInSecventa(false)}
          trimite={trimite}
          poateGestiona={poateGestiona}
          onReincarca={reincarcaContacte}
        />
      )}

      {/* ── SĂNĂTATE ──────────────────────────────────────────── */}
      {tab === 'sanatate' && <TabSanatate mailboxuri={mailboxuri} secvente={secvente} />}
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

function TabCampanii({ secvente, poateGestiona, onReimprospateaza }) {
  const [deschis, setDeschis] = useState(null)

  if (!secvente.length) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <EnvelopeIcon className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-3 font-medium text-gray-900">Nicio secvență în Apollo</p>
        <p className="mt-1 text-sm text-gray-500">
          Creează una în Apollo (Sequences), apoi apare aici cu toate statisticile.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {secvente.map((s) => {
        const st = s.statistici
        const esteDeschis = deschis === s.id
        const avertismente = st?.avertismente || []

        return (
          <div key={s.id} className="rounded-xl bg-white shadow-sm">
            <button
              onClick={() => setDeschis(esteDeschis ? null : s.id)}
              className="flex w-full items-start gap-3 p-4 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{s.nume}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.activa ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.activa ? 'activă' : 'oprită'}
                  </span>
                  {avertismente.map((a, i) => (
                    <span
                      key={i}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.nivel === 'periculos'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {a.nivel === 'periculos' ? '🔴' : '🟠'} atenție
                    </span>
                  ))}
                </div>

                {st && (
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <Cifra eticheta="livrate" valoare={st.livrate} />
                    <Cifra eticheta="deschise" valoare={st.deschise} sub={procent(st.rate.deschidere)} />
                    <Cifra
                      eticheta="RĂSPUNSURI"
                      valoare={st.raspunsuri}
                      sub={procent(st.rate.raspuns)}
                      accent="text-green-700"
                    />
                    <Cifra
                      eticheta="bounce"
                      valoare={st.bounce}
                      sub={procent(st.rate.bounce)}
                      accent={st.rate.bounce > 4 ? 'text-red-600' : 'text-gray-900'}
                    />
                    <Cifra eticheta="spam" valoare={st.spam} sub={procent(st.rate.spam)} />
                  </div>
                )}
              </div>
              {esteDeschis ? (
                <ChevronUpIcon className="h-5 w-5 shrink-0 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 shrink-0 text-gray-400" />
              )}
            </button>

            {esteDeschis && st && (
              <div className="space-y-3 border-t border-gray-100 p-4">
                {avertismente.map((a, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                      a.nivel === 'periculos'
                        ? 'bg-red-50 text-red-900'
                        : 'bg-amber-50 text-amber-900'
                    }`}
                  >
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    {a.text}
                  </div>
                ))}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Emailurile din secvență
                  </p>
                  <div className="mt-2 space-y-2">
                    {st.pasi.map((p, i) => (
                      <PasSecventa
                        key={p.id}
                        pas={p}
                        index={i}
                        poateGestiona={poateGestiona}
                        onSalvat={onReimprospateaza}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Unde sunt contactele
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {Object.entries(st.stariContacte).map(([k, v]) => (
                      <span key={k} className="rounded bg-gray-100 px-2 py-1 text-gray-700">
                        {k}: <b>{v}</b>
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  Apollo oprește singur secvența dacă bounce-ul trece de{' '}
                  {st.autoPause.pragOprire}% (avertisment la {st.autoPause.pragAvertisment}%).
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Un pas al secvenței: cât așteaptă, ce scrie în email, cum s-a descurcat.
 * Textul se poate schimba direct de aici.
 */
function PasSecventa({ pas, index, poateGestiona, onSalvat }) {
  const [editez, setEditez] = useState(false)
  const [subiect, setSubiect] = useState(pas.subiect || '')
  const [corp, setCorp] = useState(pas.corpText || '')
  const [salveaza, setSalveaza] = useState(false)

  async function salveaza_() {
    if (!subiect.trim() || !corp.trim()) {
      toast.error('Subiectul și textul nu pot fi goale')
      return
    }

    setSalveaza(true)
    try {
      const r = await fetch(`/api/admin/apollo/emailuri/${pas.templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subiect, corp }),
      })
      const d = await r.json()

      if (!r.ok) {
        toast.error(d.error || 'Nu am putut salva')
        return
      }

      toast.success('Salvat. Se aplică la emailurile care pleacă de acum înainte.')
      setEditez(false)
      onSalvat?.()
    } finally {
      setSalveaza(false)
    }
  }

  const st = pas.statistici

  return (
    <div className="rounded-lg border border-gray-200">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
          Pas {pas.pozitie}
        </span>
        <span className="text-xs text-gray-600">
          {index === 0 ? 'pleacă imediat' : `după ${traduUnitate(pas.asteapta, pas.unitate)}`}
        </span>

        {st && st.livrate > 0 && (
          <span className="text-xs text-gray-500">
            · {st.livrate} livrate · {st.rataDeschidere}% deschise ·{' '}
            <b className="text-green-700">{st.raspunsuri} răspunsuri</b>
          </span>
        )}

        {poateGestiona && pas.templateId && !editez && (
          <button
            onClick={() => setEditez(true)}
            className="ml-auto inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-indigo-600 hover:bg-indigo-50"
          >
            <PencilSquareIcon className="h-3.5 w-3.5" />
            Editează
          </button>
        )}
      </div>

      <div className="p-3">
        {editez ? (
          <div className="space-y-2">
            <input
              className={input}
              value={subiect}
              onChange={(e) => setSubiect(e.target.value)}
              placeholder="Subiect"
            />
            <textarea
              className={input}
              rows={8}
              value={corp}
              onChange={(e) => setCorp(e.target.value)}
            />
            <p className="text-[11px] text-amber-700">
              Modificarea se aplică doar emailurilor care pleacă de acum înainte. Cele deja
              trimise rămân cum au fost.
            </p>
            <div className="flex gap-2">
              <button
                onClick={salveaza_}
                disabled={salveaza}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300"
              >
                {salveaza ? 'Salvez...' : 'Salvează'}
              </button>
              <button
                onClick={() => {
                  setSubiect(pas.subiect || '')
                  setCorp(pas.corpText || '')
                  setEditez(false)
                }}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Renunță
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-900">
              {pas.subiect || <span className="text-gray-400">(fără subiect)</span>}
            </p>
            <pre className="mt-1.5 whitespace-pre-wrap font-sans text-xs leading-relaxed text-gray-600">
              {pas.corpText || '(fără text)'}
            </pre>
          </>
        )}
      </div>
    </div>
  )
}

function Cifra({ eticheta, valoare, sub, accent = 'text-gray-900' }) {
  return (
    <div>
      <span className={`text-lg font-bold ${accent}`}>{valoare}</span>
      <span className="ml-1 text-xs text-gray-500">{eticheta}</span>
      {sub && <span className="ml-1 text-xs text-gray-400">({sub})</span>}
    </div>
  )
}

function TabCautare({
  filtre,
  setFiltre,
  config,
  rezultate,
  paginare,
  cauta,
  alese,
  setAlese,
  ascundeCunoscute,
  setAscundeCunoscute,
  rezumat,
  onCauta,
  onEnrich,
  poateGestiona,
}) {
  const setLista = (cheie, text) =>
    setFiltre((f) => ({
      ...f,
      [cheie]: text.split(',').map((s) => s.trim()).filter(Boolean),
    }))

  // Costă doar cei care au email la Apollo ȘI pe care nu i-am plătit deja.
  const cuEmail = useMemo(
    () =>
      rezultate.filter((p) => alese.has(p.apolloPersonId) && p.areEmail && !p.dejaEnriched).length,
    [rezultate, alese]
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="text-xs font-medium text-gray-500">Pornește de la:</span>
          {config.sabloaneCautare.map((s) => (
            <button
              key={s.nume}
              onClick={() => setFiltre((f) => ({ ...f, ...s.filtre }))}
              className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              {s.nume}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Camp eticheta="Funcții (separate prin virgulă)">
            <input
              className={input}
              placeholder="HR Manager, Head of People"
              value={filtre.person_titles.join(', ')}
              onChange={(e) => setLista('person_titles', e.target.value)}
            />
          </Camp>

          <Camp eticheta="Țări / orașe ale firmei">
            <input
              className={input}
              placeholder="Ireland, United Kingdom"
              value={filtre.organization_locations.join(', ')}
              onChange={(e) => setLista('organization_locations', e.target.value)}
            />
          </Camp>

          <Camp eticheta="Nivel în firmă">
            <div className="flex flex-wrap gap-1">
              {config.seniorityDisponibile.map((s) => {
                const activ = filtre.person_seniorities.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() =>
                      setFiltre((f) => ({
                        ...f,
                        person_seniorities: activ
                          ? f.person_seniorities.filter((x) => x !== s)
                          : [...f.person_seniorities, s],
                      }))
                    }
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      activ ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </Camp>

          <Camp eticheta="Mărimea firmei">
            <div className="flex flex-wrap gap-1">
              {config.marimiCompanie.map((m) => {
                const activ = filtre.organization_num_employees_ranges.includes(m.valoare)
                return (
                  <button
                    key={m.valoare}
                    onClick={() =>
                      setFiltre((f) => ({
                        ...f,
                        organization_num_employees_ranges: activ
                          ? f.organization_num_employees_ranges.filter((x) => x !== m.valoare)
                          : [...f.organization_num_employees_ranges, m.valoare],
                      }))
                    }
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      activ ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {m.eticheta}
                  </button>
                )
              })}
            </div>
          </Camp>

          <Camp eticheta="Cuvinte cheie" latime="sm:col-span-2">
            <input
              className={input}
              placeholder="recruitment, staffing..."
              value={filtre.q_keywords}
              onChange={(e) => setFiltre((f) => ({ ...f, q_keywords: e.target.value }))}
            />
          </Camp>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={ascundeCunoscute}
              onChange={(e) => setAscundeCunoscute(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            Ascunde contactele pe care le am deja
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => onCauta(1)}
            disabled={cauta}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            {cauta ? 'Caut...' : 'Caută'}
          </button>
          <span className="text-xs text-gray-400">Căutarea nu consumă credite</span>
        </div>
      </div>

      {rezumat && (
        <div className="rounded-lg bg-white p-3 text-xs shadow-sm">
          <span className="font-medium text-green-700">{rezumat.noi} noi</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="text-gray-600">{rezumat.cunoscute} îi aveam deja</span>
          {ascundeCunoscute && rezumat.cunoscute > 0 && (
            <span className="ml-2 text-gray-400">(ascunși)</span>
          )}
          <span className="ml-2 text-gray-400">
            — cei noi s-au salvat automat, nu se pierd la refresh
          </span>
        </div>
      )}

      {rezultate.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 p-3">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={alese.size === rezultate.length && rezultate.length > 0}
                  onChange={(e) =>
                    setAlese(e.target.checked ? new Set(rezultate.map((p) => p.apolloPersonId)) : new Set())
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <span className="font-medium text-gray-700">Toate</span>
              </label>
              <span className="text-xs text-gray-500">
                {alese.size} alese · {cuEmail} de plătit
              </span>
            </div>

            {poateGestiona && (
              <button
                onClick={onEnrich}
                disabled={!alese.size}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:bg-gray-300"
              >
                <SparklesIcon className="h-4 w-4" />
                Află emailurile ({cuEmail} credite)
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {rezultate.map((p) => (
              <label
                key={p.apolloPersonId}
                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-gray-50 ${
                  p.eNou === false ? 'bg-gray-50/60' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={alese.has(p.apolloPersonId)}
                  onChange={(e) => {
                    const s = new Set(alese)
                    e.target.checked ? s.add(p.apolloPersonId) : s.delete(p.apolloPersonId)
                    setAlese(s)
                  }}
                  className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600"
                />

                <div className="min-w-0 flex-1 truncate">
                  <span className="text-sm font-medium text-gray-900">
                    {p.prenume} {p.numeFamilie}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">{p.titlu}</span>
                  <span className="ml-1.5 text-xs text-gray-400">· {p.companie}</span>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {/* Ce am deja despre el — ca să nu reiei munca sau plata */}
                  {p.inSecventa && (
                    <span
                      className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-800"
                      title="E deja într-o secvență de email"
                    >
                      în secvență
                    </span>
                  )}
                  {p.dejaEnriched && !p.inSecventa && (
                    <span
                      className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800"
                      title={p.emailStiut || 'Email deja plătit'}
                    >
                      {p.emailStiut ? 'email știut' : 'verificat'}
                    </span>
                  )}
                  {p.eNou === false && !p.dejaEnriched && (
                    <span
                      className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                      title="L-ai mai găsit la o căutare anterioară"
                    >
                      îl am
                    </span>
                  )}

                  {p.areEmail && !p.dejaEnriched && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-800">
                      email
                    </span>
                  )}
                  {p.areTelefon && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800">
                      tel
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>

          {paginare && (
            <div className="flex items-center justify-between border-t border-gray-100 p-3 text-xs">
              <span className="text-gray-500">
                Pagina {paginare.pagina}
                {paginare.totalEsteExact ? ` · ${paginare.total} rezultate` : ''}
              </span>
              <div className="flex gap-2">
                {paginare.pagina > 1 && (
                  <button
                    onClick={() => onCauta(paginare.pagina - 1)}
                    className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                  >
                    Înapoi
                  </button>
                )}
                {paginare.maiSuntPagini && (
                  <button
                    onClick={() => onCauta(paginare.pagina + 1)}
                    className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                  >
                    Mai departe
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Apollo ascunde intenționat numele complet și emailul la căutare — vezi doar dacă datele
        există. Apar după ce apeși „Află emailurile&rdquo;.
      </p>
    </div>
  )
}

function Camp({ eticheta, children, latime = '' }) {
  return (
    <div className={latime}>
      <label className="mb-1 block text-xs font-medium text-gray-700">{eticheta}</label>
      {children}
    </div>
  )
}

/**
 * Adaugă o adresă de mână — de obicei a ta, ca să vezi cum arată campania
 * înainte s-o trimiți unor oameni adevărați.
 */
function AdaugaContactTest({ onAdaugat }) {
  const [deschis, setDeschis] = useState(false)
  const [date, setDate] = useState({ email: '', prenume: '', numeFamilie: '', titlu: '', companie: '' })
  const [salveaza, setSalveaza] = useState(false)

  async function trimite() {
    if (!date.email.trim()) return toast.error('Pune o adresă de email')

    setSalveaza(true)
    try {
      const r = await fetch('/api/admin/apollo/contacte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(date),
      })
      const d = await r.json()

      if (!r.ok) {
        toast.error(d.error || 'Nu am putut adăuga contactul')
        return
      }

      toast.success(`${date.email} adăugat. Îl poți băga în secvență ca pe oricare altul.`)
      setDate({ email: '', prenume: '', numeFamilie: '', titlu: '', companie: '' })
      setDeschis(false)
      onAdaugat?.()
    } finally {
      setSalveaza(false)
    }
  }

  if (!deschis) {
    return (
      <button
        onClick={() => setDeschis(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
      >
        <PlusIcon className="h-4 w-4" />
        Adaugă o adresă de test
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Adresă de test</h3>
          <p className="mt-0.5 text-xs text-gray-600">
            Pune-ți propria adresă și bag-o într-o secvență: vezi exact ce primește destinatarul,
            cum arată follow-up-ul și cum se oprește când răspunzi. Nu consumă credite.
          </p>
        </div>
        <button
          onClick={() => setDeschis(false)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">Email *</label>
          <input
            className={input}
            type="email"
            value={date.email}
            onChange={(e) => setDate((d) => ({ ...d, email: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && trimite()}
            placeholder="tu@exemplu.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Prenume</label>
          <input
            className={input}
            value={date.prenume}
            onChange={(e) => setDate((d) => ({ ...d, prenume: e.target.value }))}
            placeholder="pentru {{first_name}}"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nume</label>
          <input
            className={input}
            value={date.numeFamilie}
            onChange={(e) => setDate((d) => ({ ...d, numeFamilie: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Funcție</label>
          <input
            className={input}
            value={date.titlu}
            onChange={(e) => setDate((d) => ({ ...d, titlu: e.target.value }))}
            placeholder="pentru {{title}}"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Companie</label>
          <input
            className={input}
            value={date.companie}
            onChange={(e) => setDate((d) => ({ ...d, companie: e.target.value }))}
            placeholder="pentru {{company}}"
          />
        </div>
      </div>

      <p className="mt-2 text-[11px] text-gray-500">
        Completează numele și compania dacă vrei să vezi cum se înlocuiesc variabilele din email.
      </p>

      <button
        onClick={trimite}
        disabled={salveaza || !date.email.trim()}
        className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-gray-300"
      >
        {salveaza ? 'Adaug...' : 'Adaugă în lista mea'}
      </button>
    </div>
  )
}

function TabContacte({
  persoane,
  alese,
  setAlese,
  secvente,
  secventaAleasa,
  setSecventaAleasa,
  mailboxuri,
  mailboxuriAlese,
  setMailboxuriAlese,
  onTrimite,
  trimite,
  poateGestiona,
  onReincarca,
}) {
  const cuEmail = persoane.filter((p) => p.email)

  if (!persoane.length) {
    return (
      <div className="space-y-4">
        {poateGestiona && <AdaugaContactTest onAdaugat={onReincarca} />}
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-900">Niciun contact salvat</p>
          <p className="mt-1 text-sm text-gray-500">
            Caută oameni în tabul „Caută contacte&rdquo;, sau adaugă-ți propria adresă ca să testezi
            întâi campania.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {poateGestiona && <AdaugaContactTest onAdaugat={onReincarca} />}

      {/* Panoul de trimitere */}
      {poateGestiona && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <h3 className="font-semibold text-gray-900">Trimite campanie</h3>
          <p className="mt-0.5 text-sm text-gray-600">
            Contactele bifate intră în secvența aleasă. De acolo, Apollo trimite primul email și
            follow-up-urile, singur.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Camp eticheta="Secvența (cu follow-up)">
              <select
                value={secventaAleasa}
                onChange={(e) => setSecventaAleasa(e.target.value)}
                className={input}
              >
                <option value="">— alege secvența —</option>
                {secvente.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nume} {s.activa ? '' : '(oprită)'}
                  </option>
                ))}
              </select>
            </Camp>

            <Camp eticheta="De pe ce adresă pleacă (poți bifa mai multe — Apollo le rotește)">
              <div className="space-y-1">
                {mailboxuri.map((m) => {
                  const stil = STARI_MAILBOX[m.stare] || STARI_MAILBOX.bun
                  return (
                    <label key={m.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={mailboxuriAlese.includes(m.id)}
                        onChange={(e) =>
                          setMailboxuriAlese((v) =>
                            e.target.checked ? [...v, m.id] : v.filter((x) => x !== m.id)
                          )
                        }
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                      />
                      <span className="font-medium text-gray-800">{m.email}</span>
                      <span className={`rounded-full border px-1.5 py-0.5 ${stil.culoare}`}>
                        {stil.emoji} {stil.eticheta}
                      </span>
                      <span className="text-gray-400">
                        {m.trimiseZilnicMediu}/{m.limitaZilnica} pe zi
                      </span>
                    </label>
                  )
                })}
                {!mailboxuri.length && (
                  <p className="text-xs text-red-600">
                    Niciun mailbox conectat în Apollo. Conectează unul din Apollo → Settings →
                    Mailboxes.
                  </p>
                )}
              </div>
            </Camp>
          </div>

          <button
            onClick={onTrimite}
            disabled={trimite || !alese.size || !secventaAleasa || !mailboxuriAlese.length}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            {trimite ? 'Adaug...' : `Bagă ${alese.size} contacte în secvență`}
          </button>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 p-3">
          <label className="inline-flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={alese.size === cuEmail.length && cuEmail.length > 0}
              onChange={(e) => setAlese(e.target.checked ? new Set(cuEmail.map((p) => p.id)) : new Set())}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="font-medium text-gray-700">Toate cu email</span>
          </label>
          <span className="text-xs text-gray-500">
            {alese.size} alese din {cuEmail.length} cu email ({persoane.length} total)
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {persoane.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-2 px-3 py-1.5 ${
                p.email ? 'hover:bg-gray-50' : 'opacity-60'
              }`}
            >
              <input
                type="checkbox"
                disabled={!p.email}
                checked={alese.has(p.id)}
                onChange={(e) => {
                  const s = new Set(alese)
                  e.target.checked ? s.add(p.id) : s.delete(p.id)
                  setAlese(s)
                }}
                className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600"
              />
              <Link href={`/admin/apollo/${p.id}`} className="min-w-0 flex-1 truncate">
                <span className="text-sm font-medium text-gray-900 hover:text-indigo-700">
                  {p.prenume} {p.numeFamilie}
                </span>
                <span className="ml-2 text-xs text-gray-500">{p.titlu}</span>
                <span className="ml-1.5 text-xs text-gray-400">
                  · {p.email || 'fără email'}
                  {p.companie ? ` · ${p.companie}` : ''}
                </span>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                {p.esteTest && (
                  <span
                    className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800"
                    title="Adresă adăugată de tine — nu e prospect din Apollo"
                  >
                    TEST
                  </span>
                )}
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    p.status === 'IN_SECVENTA'
                      ? 'bg-indigo-100 text-indigo-800'
                      : p.status === 'ENRICHED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {p.status}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabSanatate({ mailboxuri, secvente }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">De ce contează asta</p>
        <p className="mt-1">
          Dacă emailurile dau bounce sau ajung în spam, furnizorii încep să blocheze tot ce pleacă
          de pe domeniul acela — inclusiv corespondența normală. Un domeniu ars se repară greu și
          lent, așa că trimiterea se oprește automat când cifrele o iau razna.
        </p>
      </div>

      {mailboxuri.map((m) => {
        const stil = STARI_MAILBOX[m.stare] || STARI_MAILBOX.bun
        return (
          <div key={m.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">{m.email}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${stil.culoare}`}>
                {stil.emoji} {stil.eticheta}
              </span>
              {m.implicit && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                  implicit
                </span>
              )}
              <span className="text-xs text-gray-400">{m.furnizor}</span>
            </div>

            {m.probleme.map((p, i) => (
              <p key={i} className="mt-2 flex items-start gap-1.5 text-sm text-red-700">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {p}
              </p>
            ))}
            {m.atentionari.map((p, i) => (
              <p key={i} className="mt-2 text-sm text-amber-700">
                ⚠ {p}
              </p>
            ))}

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metrica eticheta="Livrare" valoare={procent(m.rate.livrare)} bun={m.rate.livrare >= 90} />
              <Metrica eticheta="Deschidere" valoare={procent(m.rate.deschidere)} />
              <Metrica eticheta="Răspuns" valoare={procent(m.rate.raspuns)} />
              <Metrica
                eticheta="Bounce"
                valoare={procent(m.rate.bounce)}
                bun={m.rate.bounce != null && m.rate.bounce < 5}
              />
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Trimite ~{m.trimiseZilnicMediu} din {m.limitaZilnica} permise pe zi
              {m.utilizareProcent != null ? ` (${m.utilizareProcent}%)` : ''} · pauză{' '}
              {m.pauzaIntreEmailuri}s între emailuri
            </div>
          </div>
        )
      })}

      {secvente.some((s) => s.statistici?.avertismente?.length) && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900">Secvențe cu probleme</h3>
          <div className="mt-2 space-y-2">
            {secvente
              .filter((s) => s.statistici?.avertismente?.length)
              .map((s) => (
                <div key={s.id} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-900">{s.nume}</p>
                  {s.statistici.avertismente.map((a, i) => (
                    <p
                      key={i}
                      className={`mt-1 text-xs ${
                        a.nivel === 'periculos' ? 'text-red-700' : 'text-amber-700'
                      }`}
                    >
                      {a.nivel === 'periculos' ? '🔴' : '🟠'} {a.text}
                    </p>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Metrica({ eticheta, valoare, bun }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{eticheta}</p>
      <p className={`text-lg font-bold ${bun === false ? 'text-red-600' : 'text-gray-900'}`}>
        {valoare}
      </p>
    </div>
  )
}
