'use client'

/**
 * /admin/leads — CRM-ul lead-urilor web, construit după lista din Olla English:
 * un rând pe lead, status schimbat din rând, filtre multiple care rămân puse,
 * paginare pe server, „Lead nou" de mână. Plus ce e specific aici: extragerea
 * firmelor din Google Maps, scorul și verificarea site-ului.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowDownTrayIcon,
  PlayIcon,
  StopIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import {
  STATUSURI,
  SURSE,
  CALITATI,
  FILTRE_FOLLOWUP,
  PERIOADE,
  SORTARI,
  SCORURI_MINIME,
  formateazaFollowUp,
  steagTara,
} from '@/lib/leads/statusuri'
import RandLead from './RandLead'
import ModalWhatsApp from './ModalWhatsApp'
import FormularLead from './FormularLead'
import PanouCautare from './PanouCautare'

const MARIMI_PAGINA = [25, 50, 100, 'toate']

// Filtrele rămân puse și după ce închizi pagina
const CHEIE_FILTRE = 'pyweb:leaduri:filtre'

const FILTRE_GOALE = {
  statusuri: [],
  tara: '',
  sursa: '',
  oras: '',
  calitate: '',
  categorie: '',
  responsabil: '',
  scorMin: '',
  followUp: '',
  perioada: '',
  de: '',
  pana: '',
  sortare: 'scor',
  doarNoi: false,
  urgent: false,
}

const selectClass =
  'rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500'

// Un filtru pus se colorează, ca să nu te întrebi de ce lipsesc lead-uri din listă
const selectActivClass =
  'rounded-lg border border-indigo-400 bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-200 focus:ring-2 focus:ring-indigo-500'

const alege = (activ) => (activ ? selectActivClass : selectClass)

// ============================================================
// COMPONENTA PRINCIPALĂ
// ============================================================

export default function LeadsClient({
  statisticiInitiale,
  rulari,
  rulareActiva,
  echipa = [],
  numeleMeu = '',
  optiuni,
  areCheieGoogle,
  furnizorPitch,
  modelPitch,
  poateRula,
}) {
  const [leaduri, setLeaduri] = useState([])
  const [seIncarca, setSeIncarca] = useState(true)
  const [stats, setStats] = useState(statisticiInitiale)
  const [statServer, setStatServer] = useState(null)
  const [oraseDB, setOraseDB] = useState([])
  const [categoriiDB, setCategoriiDB] = useState([])
  const [tariDB, setTariDB] = useState([])
  const [istoric, setIstoric] = useState(rulari)

  // ── Filtre + paginare (se aplică pe server) ───────────────────────
  const [cautare, setCautare] = useState('')
  const [filtre, setFiltre] = useState(FILTRE_GOALE)
  const [pagina, setPagina] = useState(1)
  const [marime, setMarime] = useState(50)
  const [totalFiltrat, setTotalFiltrat] = useState(0)
  const [totalPagini, setTotalPagini] = useState(1)
  // Până citim filtrele salvate nu cerem nimic: altfel prima listă ar fi nefiltrată și ar clipi
  const [restaurat, setRestaurat] = useState(false)

  const [deschisId, setDeschisId] = useState(null)
  const [formular, setFormular] = useState(null) // null | 'nou' | lead
  const [leadWhatsApp, setLeadWhatsApp] = useState(null)

  // ── Rulare (extragerea din Google Maps) ───────────────────────────
  const [panouRulare, setPanouRulare] = useState(false)
  const [ruleaza, setRuleaza] = useState(Boolean(rulareActiva))
  const [runId, setRunId] = useState(rulareActiva?.id || null)
  const [progres, setProgres] = useState(null)
  const [loguri, setLoguri] = useState([])
  const [rulareBlocanta, setRulareBlocanta] = useState(null)
  const opresteRef = useRef(false)

  // ============================================================
  // ÎNCĂRCAREA LISTEI
  // ============================================================

  // Aceiași parametri merg și la export: ce vezi pe ecran e ce iese în Excel
  const parametri = useMemo(() => {
    const p = new URLSearchParams()
    if (cautare.trim()) p.set('q', cautare.trim())
    if (filtre.statusuri.length) p.set('status', filtre.statusuri.join(','))
    for (const cheie of ['tara', 'sursa', 'oras', 'calitate', 'categorie', 'responsabil', 'scorMin', 'followUp', 'sortare']) {
      if (filtre[cheie]) p.set(cheie, filtre[cheie])
    }
    if (filtre.perioada === 'interval') {
      p.set('perioada', 'interval')
      if (filtre.de) p.set('de', filtre.de)
      if (filtre.pana) p.set('pana', filtre.pana)
    } else if (filtre.perioada) {
      p.set('perioada', filtre.perioada)
    }
    if (filtre.doarNoi) p.set('doarNoi', '1')
    if (filtre.urgent) p.set('urgent', '1')
    return p
  }, [cautare, filtre])

  const incarca = useCallback(async () => {
    setSeIncarca(true)
    try {
      const p = new URLSearchParams(parametri)
      p.set('pagina', String(pagina))
      p.set('marime', String(marime))

      const raspuns = await fetch(`/api/admin/leads?${p}`)
      const date = await raspuns.json()
      if (!raspuns.ok) throw new Error(date.error || 'Nu am putut încărca lead-urile')

      setLeaduri(date.leaduri || [])
      setTotalFiltrat(date.totalFiltrat ?? 0)
      setTotalPagini(date.totalPagini ?? 1)
      setStatServer(date.statistici || null)
      setOraseDB(date.orase || [])
      setCategoriiDB(date.categorii || [])
      setTariDB(date.tari || [])
      if (date.pagina && date.pagina !== pagina) setPagina(date.pagina)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSeIncarca(false)
    }
  }, [parametri, pagina, marime])

  // Filtrele salvate se iau din browser la deschidere
  useEffect(() => {
    try {
      const salvate = JSON.parse(localStorage.getItem(CHEIE_FILTRE) || 'null')
      if (salvate?.filtre) setFiltre({ ...FILTRE_GOALE, ...salvate.filtre })
      if (MARIMI_PAGINA.includes(salvate?.marime)) setMarime(salvate.marime)
    } catch {
      /* browser fără localStorage — pornim fără filtre */
    }
    setRestaurat(true)
  }, [])

  // …și se scriu înapoi la fiecare schimbare
  useEffect(() => {
    if (!restaurat) return
    try {
      localStorage.setItem(CHEIE_FILTRE, JSON.stringify({ filtre, marime }))
    } catch {
      /* nu e grav */
    }
  }, [restaurat, filtre, marime])

  // Filtrele se aplică imediat; scrisul în căutare, după o pauză
  useEffect(() => {
    if (!restaurat) return
    const t = setTimeout(incarca, cautare ? 350 : 0)
    return () => clearTimeout(t)
  }, [restaurat, incarca, cautare])

  // Orice filtru nou readuce lista la prima pagină
  const setFiltru = (cheie, valoare) => {
    setFiltre((f) => ({ ...f, [cheie]: valoare }))
    setPagina(1)
  }

  const comutaStatus = (valoare) => {
    setFiltre((f) => ({
      ...f,
      statusuri: f.statusuri.includes(valoare)
        ? f.statusuri.filter((s) => s !== valoare)
        : [...f.statusuri, valoare],
    }))
    setPagina(1)
  }

  const reseteazaTot = () => {
    setCautare('')
    setFiltre(FILTRE_GOALE)
    setPagina(1)
    try {
      localStorage.removeItem(CHEIE_FILTRE)
    } catch {
      /* nu e grav */
    }
  }

  const nrFiltreActive =
    (cautare ? 1 : 0) +
    filtre.statusuri.length +
    ['tara', 'sursa', 'oras', 'calitate', 'categorie', 'responsabil', 'scorMin', 'followUp', 'perioada'].filter(
      (c) => filtre[c]
    ).length +
    (filtre.doarNoi ? 1 : 0) +
    (filtre.urgent ? 1 : 0)

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
      setPagina(1)
      await incarca()
      await reincarcaRulari()
    },
    [incarca]
  )

  useEffect(() => {
    if (rulareActiva?.id) ruleazaPasi(rulareActiva.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function testeazaNotificarea() {
    const t = toast.loading('Trimit pe Telegram...')
    try {
      const r = await fetch('/api/cron/leaduri-followup?forteaza=1')
      const d = await r.json()
      toast.dismiss(t)

      if (d.eroare) {
        toast.error(d.eroare, { duration: 10000 })
        return
      }
      if (!d.trimise) {
        toast(d.mesaj || 'Nimic de trimis', { icon: 'ℹ️', duration: 8000 })
        return
      }
      toast.success(`Trimis pe Telegram: ${d.firme?.slice(0, 3).join(', ')}${d.trimise > 3 ? '...' : ''}`, {
        duration: 8000,
      })
    } catch {
      toast.dismiss(t)
      toast.error('Nu am putut contacta serverul')
    }
  }

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

  // Panoul de căutare trimite țara, orașele (verificate) și categoriile
  async function porneste(cerere) {
    if (!areCheieGoogle) {
      toast.error('Lipsește GOOGLE_API_KEY. Vezi README-LEADURI.md.')
      return
    }
    if (!cerere.orase.length || !cerere.categorii.length) {
      toast.error('Alege cel puțin un oraș și o categorie')
      return
    }

    const raspuns = await fetch('/api/admin/leads/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cerere),
    })
    const date = await raspuns.json()

    if (!raspuns.ok) {
      // 409 = există o rulare neterminată. Nu doar ne plângem: îi arătăm
      // utilizatorului ce e blocat și îi dăm butoane s-o rezolve.
      if (raspuns.status === 409 && date.rulareBlocanta) {
        setRulareBlocanta(date.rulareBlocanta)
        setPanouRulare(false)
        return
      }
      toast.error(date.error || 'Nu am putut porni căutarea', { duration: 8000 })
      return
    }

    setRunId(date.rulare.id)
    setLoguri([])
    setProgres(null)
    setPanouRulare(false)
    toast.success(`Căutare pornită: ${date.estimare.interogari} interogări`)
    ruleazaPasi(date.rulare.id)
  }

  // ── Unirea dublurilor: aceeași firmă salvată de mai multe ori ──────
  // (Fornetti × 10 — o locație = un rezultat Google). Întâi arătăm ce s-ar
  // uni, abia apoi unim; notițele, statusul și responsabilul se păstrează.
  const [unire, setUnire] = useState(false)

  async function unesteDublurile() {
    if (unire) return
    setUnire(true)
    try {
      const r = await fetch('/api/admin/leads/uneste')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Nu am putut căuta dublurile')

      if (!d.grupe) {
        toast.success('Nicio dublură — fiecare firmă apare o singură dată')
        return
      }

      const exemple = d.exemple.map((e) => `• ${e.denumire} — ${e.nr} lead-uri`).join('\n')
      const intrebare =
        `Am găsit ${d.grupe} firme salvate de mai multe ori (${d.leaduri} lead-uri → ${d.grupe}).\n\n` +
        `${exemple}${d.grupe > d.exemple.length ? '\n• …' : ''}\n\n` +
        'Fiecare firmă rămâne un singur lead, cu toate locațiile în el. Se păstrează lead-ul pe care ' +
        's-a lucrat cel mai mult; notițele celorlalte se mută pe el, nimic nu se pierde.\n\nUnesc?'
      if (!confirm(intrebare)) return

      let unite = 0
      let sterse = 0
      for (let runda = 0; runda < 20; runda++) {
        const p = await fetch('/api/admin/leads/uneste', { method: 'POST' })
        const rez = await p.json()
        if (!p.ok) throw new Error(rez.error || 'Unirea a eșuat')
        unite += rez.unite
        sterse += rez.sterse
        if (!rez.ramase || !rez.unite) break
      }
      toast.success(`Gata: ${unite} firme unite, ${sterse} dubluri scoase din listă`, { duration: 8000 })
      incarca()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUnire(false)
    }
  }

  // ── Reverificarea gratuită a site-urilor „moarte" ─────────────────
  // Multe erau de fapt protejate de Cloudflare; acum le recunoaștem.
  const [reverifica, setReverifica] = useState(null)

  async function reverificaMoarte() {
    if (reverifica) return
    const inceputRunda = new Date().toISOString()
    const rezumat = {}
    let ramase = sv.moarte
    setReverifica({ facute: 0, total: ramase })
    try {
      for (let runda = 0; runda < 30 && ramase > 0; runda++) {
        const r = await fetch('/api/admin/leads/reverifica', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calitati: ['MORT', 'NEADAPTAT_MOBIL'], inceputRunda }),
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Reverificarea a eșuat')
        for (const [k, v] of Object.entries(d.schimbari || {})) rezumat[k] = (rezumat[k] || 0) + v
        ramase = d.ramase
        setReverifica((x) => ({ ...x, facute: (x?.facute || 0) + d.verificate }))
      }
      const text = Object.entries(rezumat)
        .map(([k, v]) => `${CALITATI.find((c) => c.value === k)?.label || k}: ${v}`)
        .join(', ')
      toast.success(text ? `Reverificate — ${text}` : 'Nimic de reverificat', { duration: 10000 })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setReverifica(null)
      incarca()
    }
  }

  async function reiaBlocanta() {
    if (!rulareBlocanta) return
    const id = rulareBlocanta.id
    setRulareBlocanta(null)
    setRunId(id)
    toast('Reiau rularea de unde a rămas', { icon: '▶️' })
    ruleazaPasi(id)
  }

  async function anuleazaBlocanta() {
    if (!rulareBlocanta) return
    const raspuns = await fetch(`/api/admin/leads/runs/${rulareBlocanta.id}`, { method: 'DELETE' })
    if (!raspuns.ok) {
      toast.error('Nu am putut anula rularea')
      return
    }
    setRulareBlocanta(null)
    toast.success('Rulare anulată. Poți porni una nouă.')
    reincarcaRulari()
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
      const d = await raspuns.json().catch(() => ({}))
      toast.error(d.error || mesajEroare)
      return null
    }
    return (await raspuns.json()).lead
  }

  async function schimbaStatus(lead, status) {
    const anterior = lead.status
    actualizeazaLocal(lead.id, { status })
    const salvat = await salveaza(lead, { status }, 'Nu am putut salva statusul')
    if (!salvat) actualizeazaLocal(lead.id, { status: anterior })
    else {
      actualizeazaLocal(lead.id, { dataApel: salvat.dataApel })
      // Cifrele de sus se mută odată cu statusul
      setStatServer((s) =>
        s
          ? {
              ...s,
              peStatus: {
                ...s.peStatus,
                [anterior]: Math.max((s.peStatus[anterior] || 1) - 1, 0),
                [status]: (s.peStatus[status] || 0) + 1,
              },
            }
          : s
      )
    }
  }

  async function comutaUrgent(lead) {
    const urgent = !lead.urgent
    actualizeazaLocal(lead.id, { urgent })
    setStatServer((s) => (s ? { ...s, urgente: Math.max((s.urgente || 0) + (urgent ? 1 : -1), 0) } : s))
    const salvat = await salveaza(lead, { urgent }, 'Nu am putut salva semnul de urgent')
    if (!salvat) {
      actualizeazaLocal(lead.id, { urgent: !urgent })
      setStatServer((s) => (s ? { ...s, urgente: Math.max((s.urgente || 0) + (urgent ? -1 : 1), 0) } : s))
    }
  }

  // ── Pitch-urile ieșite din șablon, refăcute cu AI ─────────────────
  const [refacPitch, setRefacPitch] = useState(false)

  async function refaPitchurile() {
    if (refacPitch) return
    setRefacPitch(true)
    try {
      const r = await fetch('/api/admin/leads/pitch-refa')
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Nu am putut număra pitch-urile')
      if (!d.areAI) throw new Error('Lipsește OPENAI_API_KEY — pitch-urile nu se pot face cu AI')
      if (!d.deRefacut) {
        toast.success('Toate pitch-urile sunt deja scrise de AI')
        return
      }
      if (!confirm(`${d.deRefacut} pitch-uri au ieșit din șablon (AI-ul nu mergea atunci). Le refac cu AI? Costă câțiva cenți.`)) return

      let refacute = 0
      let cost = 0
      for (let runda = 0; runda < 40; runda++) {
        const p = await fetch('/api/admin/leads/pitch-refa', { method: 'POST' })
        const rez = await p.json()
        if (!p.ok) throw new Error(rez.error || 'Refacerea a eșuat')
        refacute += rez.refacute
        cost += rez.cost || 0
        toast.loading(`Refac pitch-urile… ${refacute}/${d.deRefacut}`, { id: 'pitch-refa' })
        if (!rez.refacute) {
          if (rez.erori?.length) throw new Error(`AI-ul nu răspunde: ${rez.erori[0].slice(0, 160)}`)
          break
        }
        if (!rez.ramase) break
      }
      toast.success(`${refacute} pitch-uri refăcute cu AI (cost ~${cost.toFixed(2)} $)`, { id: 'pitch-refa', duration: 8000 })
      incarca()
    } catch (err) {
      toast.error(err.message, { id: 'pitch-refa', duration: 10000 })
    } finally {
      setRefacPitch(false)
    }
  }

  async function schimbaResponsabil(lead, responsabilId) {
    const anterior = { responsabilId: lead.responsabilId, responsabil: lead.responsabil }
    const om = echipa.find((o) => o.id === responsabilId)
    actualizeazaLocal(lead.id, { responsabilId, responsabil: om || null })

    const salvat = await salveaza(lead, { responsabilId }, 'Nu am putut salva responsabilul')
    if (!salvat) {
      actualizeazaLocal(lead.id, anterior)
      return
    }

    if (om && !om.telegramLegat) {
      toast(`${om.name || om.email} nu și-a legat Telegram — mementoul va merge în chat-ul comun.`, {
        icon: '⚠️',
        duration: 7000,
      })
    } else if (om) {
      toast.success(`${om.name || om.email} primește mementourile în privat`)
    } else {
      toast.success('Responsabil eliminat')
    }
  }

  async function schimbaFollowUp(lead, nextFollowUpAt) {
    const anterior = lead.nextFollowUpAt
    actualizeazaLocal(lead.id, { nextFollowUpAt })
    const salvat = await salveaza(lead, { nextFollowUpAt }, 'Nu am putut salva recontactarea')
    if (!salvat) actualizeazaLocal(lead.id, { nextFollowUpAt: anterior })
    else {
      toast.success(
        nextFollowUpAt ? `Recontactare: ${formateazaFollowUp(nextFollowUpAt)}` : 'Recontactare ștearsă'
      )
    }
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
    setLeaduri((l) =>
      l.map((x) =>
        x.id === lead.id
          ? {
              ...x,
              notiteIstoric: [nota, ...(x.notiteIstoric || [])],
              _count: { notiteIstoric: (x._count?.notiteIstoric || 0) + 1 },
            }
          : x
      )
    )
    return true
  }

  async function stergeNota(lead, notaId) {
    const raspuns = await fetch(`/api/admin/leads/notite/${notaId}`, { method: 'DELETE' })
    if (!raspuns.ok) {
      toast.error('Nu am putut șterge notița')
      return
    }
    setLeaduri((l) =>
      l.map((x) =>
        x.id === lead.id
          ? {
              ...x,
              notiteIstoric: (x.notiteIstoric || []).filter((n) => n.id !== notaId),
              _count: { notiteIstoric: Math.max((x._count?.notiteIstoric || 1) - 1, 0) },
            }
          : x
      )
    )
  }

  async function stergeLead(lead) {
    if (!confirm(`Ștergi lead-ul „${lead.denumire}"? Notițele lui se pierd definitiv.`)) return
    const raspuns = await fetch(`/api/admin/leads/${lead.id}`, { method: 'DELETE' })
    if (!raspuns.ok) {
      toast.error('Nu am putut șterge lead-ul')
      return
    }
    setLeaduri((l) => l.filter((x) => x.id !== lead.id))
    setTotalFiltrat((t) => Math.max(t - 1, 0))
    toast.success('Lead șters')
  }

  function copiaza(text, mesaj = 'Copiat') {
    navigator.clipboard?.writeText(text)
    toast.success(mesaj)
  }

  // După trimiterea pe WhatsApp: o notiță pe lead, ca să știi că i-ai scris.
  async function dupaWhatsApp(lead, numeSablon) {
    await adaugaNota(lead, `💬 WhatsApp trimis — șablonul „${numeSablon}"`)
  }

  function dupaSalvare(lead) {
    const eraEditare = formular && formular !== 'nou'
    setFormular(null)
    if (eraEditare && lead) {
      actualizeazaLocal(lead.id, lead)
    } else {
      // Lead nou: îl arătăm deschis, în capul listei
      if (lead) setDeschisId(lead.id)
      incarca()
    }
  }

  // ── Butoanele de pagină: 1 … 4 5 [6] 7 8 … 20 ───────────────────
  const numerePagini = useMemo(() => {
    if (totalPagini <= 7) return Array.from({ length: totalPagini }, (_, i) => i + 1)
    const rez = [1]
    const inceput = Math.max(2, pagina - 1)
    const sfarsit = Math.min(totalPagini - 1, pagina + 1)
    if (inceput > 2) rez.push('…')
    for (let i = inceput; i <= sfarsit; i++) rez.push(i)
    if (sfarsit < totalPagini - 1) rez.push('…')
    rez.push(totalPagini)
    return rez
  }, [pagina, totalPagini])

  // Categoriile: cele căutate în rulări + cele scrise de mână în lead-uri
  const toateCategoriile = useMemo(() => {
    const numar = new Map(categoriiDB.map((c) => [c.value, c.count]))
    const toate = new Set([...optiuni.categorii, ...categoriiDB.map((c) => c.value)])
    return [...toate]
      .sort((a, b) => a.localeCompare(b, 'ro'))
      .map((value) => ({ value, count: numar.get(value) }))
  }, [categoriiDB, optiuni.categorii])

  const sv = statServer || { total: 0, peStatus: {}, restante: 0, faraSite: 0, moarte: 0, urgente: 0, locatii: 0 }

  // ============================================================
  // RANDARE
  // ============================================================

  return (
    <div className="space-y-2.5">
      {/* ── Antet + statistici pe același rând ───────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-gray-900">Leaduri Web</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <ChipStat
            eticheta="Total"
            valoare={sv.total}
            titlu={sv.locatii > sv.total ? `${sv.total} firme = ${sv.locatii} locații pe Google (locațiile aceleiași firme sunt unite într-un lead)` : undefined}
          />
          {sv.locatii > sv.total && (
            <ChipStat
              eticheta="📍 Locații"
              valoare={sv.locatii}
              culoare="text-sky-700"
              titlu={`${sv.locatii - sv.total} locații sunt unite cu firma lor (ex. Fornetti × 10 = 1 lead)`}
            />
          )}
          <ChipStat
            eticheta="🔥 Urgente"
            valoare={sv.urgente || 0}
            culoare="text-orange-600"
            activ={filtre.urgent}
            onClick={() => setFiltru('urgent', !filtre.urgent)}
          />
          <ChipStat
            eticheta="🔵 New lead"
            valoare={sv.peStatus.DE_SUNAT || 0}
            culoare="text-blue-600"
            activ={filtre.statusuri.includes('DE_SUNAT')}
            onClick={() => comutaStatus('DE_SUNAT')}
          />
          <ChipStat
            eticheta="🟢 Interesat"
            valoare={sv.peStatus.INTERESAT || 0}
            culoare="text-green-600"
            activ={filtre.statusuri.includes('INTERESAT')}
            onClick={() => comutaStatus('INTERESAT')}
          />
          <ChipStat
            eticheta="📄 Ofertă"
            valoare={sv.peStatus.OFERTA_TRIMISA || 0}
            culoare="text-indigo-600"
            activ={filtre.statusuri.includes('OFERTA_TRIMISA')}
            onClick={() => comutaStatus('OFERTA_TRIMISA')}
          />
          <ChipStat
            eticheta="💰 A plătit"
            valoare={sv.peStatus.CLIENT || 0}
            culoare="text-emerald-600"
            activ={filtre.statusuri.includes('CLIENT')}
            onClick={() => comutaStatus('CLIENT')}
          />
          <ChipStat
            eticheta="🟣 În lucru"
            valoare={sv.peStatus.IN_LUCRU || 0}
            culoare="text-purple-600"
            activ={filtre.statusuri.includes('IN_LUCRU')}
            onClick={() => comutaStatus('IN_LUCRU')}
          />
          <ChipStat
            eticheta="🔴 Restante"
            valoare={sv.restante}
            culoare="text-red-600"
            activ={filtre.followUp === 'restante'}
            onClick={() => setFiltru('followUp', filtre.followUp === 'restante' ? '' : 'restante')}
          />
          <ChipStat eticheta="🚫 Fără site" valoare={sv.faraSite} culoare="text-red-700" />
          {poateRula && (
            <button
              type="button"
              onClick={unesteDublurile}
              disabled={unire}
              title="Aceeași firmă cu mai multe locații (ex. Fornetti) devine un singur lead. Îți arăt întâi ce unesc."
              className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-800 hover:bg-sky-100 disabled:opacity-70"
            >
              {unire ? '🔗 Caut dublurile…' : '🔗 Unește dublurile'}
            </button>
          )}
          {poateRula && (
            <button
              type="button"
              onClick={refaPitchurile}
              disabled={refacPitch}
              title="Pitch-urile care au ieșit din șablon (când AI-ul nu mergea) se rescriu cu AI"
              className="inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-70"
            >
              {refacPitch ? '✨ Refac…' : '✨ Refă pitch-urile'}
            </button>
          )}
          {poateRula && sv.moarte > 0 && (
            <button
              type="button"
              onClick={reverificaMoarte}
              disabled={Boolean(reverifica)}
              title="Deschide din nou site-urile marcate „mort” sau „nemobil” (gratuit, fără Google), cu regulile noi: cele protejate de Cloudflare trec la „Neclar”, cele cu design pentru telefon nu mai sunt „nemobile”."
              className="inline-flex items-center gap-1 rounded-lg border border-orange-300 bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-800 hover:bg-orange-100 disabled:opacity-70"
            >
              {reverifica
                ? `🔁 Reverific… ${reverifica.facute}/${reverifica.total}`
                : `🔁 Reverifică ${sv.moarte} site-uri „moarte” / „nemobile”`}
            </button>
          )}
          <ChipStat
            eticheta="🔎 API luna"
            valoare={`${stats.apeluriLunaCurenta}/1000`}
            culoare={stats.apeluriLunaCurenta > 800 ? 'text-red-600' : 'text-gray-700'}
            titlu={`Apeluri Google Places luna asta. Pitch-uri: ${
              furnizorPitch === 'openai' ? modelPitch || 'OpenAI' : 'șabloane'
            }`}
          />

          {poateRula && (
            <button
              type="button"
              onClick={() => setFormular('nou')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Lead nou
            </button>
          )}
          {poateRula && !ruleaza && (
            <button
              type="button"
              onClick={() => setPanouRulare((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
            >
              <PlayIcon className="h-3.5 w-3.5" />
              Caută firme noi
            </button>
          )}
          {ruleaza && (
            <button
              type="button"
              onClick={opreste}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              <StopIcon className="h-3.5 w-3.5" />
              Oprește căutarea
            </button>
          )}
          <a
            href={`/api/admin/leads/export?format=xlsx&${parametri}`}
            title="Exportă în Excel exact ce e filtrat acum"
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            Excel
          </a>
          <a
            href={`/api/admin/leads/export?format=csv&${parametri}`}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            CSV
          </a>
          {poateRula && (
            <button
              type="button"
              onClick={testeazaNotificarea}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              title="Trimite ACUM pe Telegram lista de recontactat, fără să aștepți cron-ul"
            >
              📨
            </button>
          )}
        </div>
      </div>

      {!areCheieGoogle && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <ExclamationTriangleIcon className="mt-px h-4 w-4 shrink-0 text-amber-600" />
          <p>
            <b>Lipsește GOOGLE_API_KEY</b> — nu pot căuta firme noi. Lista, lead-urile adăugate de
            mână și exportul funcționează normal.
          </p>
        </div>
      )}

      {/* ── Rulare neterminată ─────────────────────────────────── */}
      {rulareBlocanta && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Ai o căutare neterminată</p>
              <p className="mt-0.5 text-xs text-amber-800">
                Faza <b>{rulareBlocanta.faza}</b> · {rulareBlocanta.interogariFacute} din{' '}
                {rulareBlocanta.totalInterogari} interogări ({rulareBlocanta.procent}%) ·{' '}
                {rulareBlocanta.firmeNoi} firme noi găsite · ultima mișcare acum{' '}
                {rulareBlocanta.minuteDeLaUltimaMiscare} min. Reluarea continuă de unde a rămas — nu
                plătești din nou interogările deja făcute.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={reiaBlocanta}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
                >
                  <PlayIcon className="h-3.5 w-3.5" />
                  Reia de unde a rămas
                </button>
                <button
                  type="button"
                  onClick={anuleazaBlocanta}
                  className="rounded-lg border border-amber-400 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                >
                  Anulează căutarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {panouRulare && poateRula && !ruleaza && (
        <PanouCautare optiuni={optiuni} onPornire={porneste} onAnulare={() => setPanouRulare(false)} />
      )}

      {ruleaza && <PanouProgres progres={progres} loguri={loguri} />}

      {/* ── Bară unică de filtre ───────────────────────────────── */}
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 transition-colors ${
          nrFiltreActive > 0 ? 'border-indigo-300 bg-indigo-50/60' : 'border-gray-200 bg-white'
        }`}
      >
        <button
          type="button"
          onClick={() => setFiltru('statusuri', [])}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            filtre.statusuri.length === 0
              ? 'bg-indigo-600 text-white'
              : 'border border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-400'
          }`}
        >
          Toate
        </button>
        {STATUSURI.map((s) => {
          const activ = filtre.statusuri.includes(s.value)
          const numar = sv.peStatus[s.value] || 0
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => comutaStatus(s.value)}
              title={activ ? `${s.label} — apasă din nou ca să scoți filtrul` : s.label}
              className={`rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                activ
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                  : 'border border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-400'
              }`}
            >
              {s.emoji} {s.label}
              {numar > 0 && <span className={`ml-1 ${activ ? 'opacity-80' : 'text-gray-400'}`}>{numar}</span>}
              {activ && <span className="ml-1 opacity-80">×</span>}
            </button>
          )
        })}

        <div className="relative w-44">
          <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Caută nume, telefon, site…"
            value={cautare}
            onChange={(e) => {
              setCautare(e.target.value)
              setPagina(1)
            }}
            className="w-full rounded-lg border border-gray-300 py-1.5 pl-7 pr-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {(tariDB.length > 1 || filtre.tara) && (
          <select value={filtre.tara} onChange={(e) => setFiltru('tara', e.target.value)} className={alege(filtre.tara)} aria-label="Țară">
            <option value="">Țară: toate</option>
            {tariDB.map((t) => (
              <option key={t.value} value={t.value}>
                {steagTara(t.value)} {optiuni.tari.find((x) => x.cod === t.value)?.nume || t.value} ({t.count})
              </option>
            ))}
          </select>
        )}

        <select value={filtre.sursa} onChange={(e) => setFiltru('sursa', e.target.value)} className={alege(filtre.sursa)} aria-label="Sursă">
          <option value="">Sursă: toate</option>
          {SURSE.map((s) => (
            <option key={s.value} value={s.value}>
              {s.emoji} {s.label}
            </option>
          ))}
        </select>

        <select value={filtre.oras} onChange={(e) => setFiltru('oras', e.target.value)} className={alege(filtre.oras)} aria-label="Oraș">
          <option value="">Oraș: toate</option>
          {oraseDB.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value} ({o.count})
            </option>
          ))}
        </select>

        <select value={filtre.calitate} onChange={(e) => setFiltru('calitate', e.target.value)} className={alege(filtre.calitate)} aria-label="Calitate site">
          <option value="">Site: oricum</option>
          {CALITATI.map((c) => (
            <option key={c.value} value={c.value}>
              {c.emoji} {c.label}
            </option>
          ))}
          <option value="NEVERIFICAT">⏳ Neverificat</option>
        </select>

        <select value={filtre.categorie} onChange={(e) => setFiltru('categorie', e.target.value)} className={`${alege(filtre.categorie)} max-w-[11rem]`} aria-label="Categorie">
          <option value="">Categorie: toate</option>
          {toateCategoriile.map((c) => (
            <option key={c.value} value={c.value}>
              {c.value}
              {c.count ? ` (${c.count})` : ''}
            </option>
          ))}
        </select>

        <select value={filtre.responsabil} onChange={(e) => setFiltru('responsabil', e.target.value)} className={alege(filtre.responsabil)} aria-label="Responsabil">
          <option value="">Responsabil: oricine</option>
          {echipa.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name || o.email}
            </option>
          ))}
          <option value="fara">Fără responsabil</option>
        </select>

        <select value={filtre.scorMin} onChange={(e) => setFiltru('scorMin', e.target.value)} className={alege(filtre.scorMin)} aria-label="Scor minim">
          {SCORURI_MINIME.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select value={filtre.followUp} onChange={(e) => setFiltru('followUp', e.target.value)} className={alege(filtre.followUp)} aria-label="Follow-up">
          {FILTRE_FOLLOWUP.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select value={filtre.perioada} onChange={(e) => setFiltru('perioada', e.target.value)} className={alege(filtre.perioada)} aria-label="Perioadă">
          {PERIOADE.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        {filtre.perioada === 'interval' && (
          <span className="flex items-center gap-1">
            <input type="date" value={filtre.de} onChange={(e) => setFiltru('de', e.target.value)} className={alege(filtre.de)} aria-label="De la data" />
            <span className="text-xs text-gray-400">→</span>
            <input type="date" value={filtre.pana} onChange={(e) => setFiltru('pana', e.target.value)} className={alege(filtre.pana)} aria-label="Până la data" />
          </span>
        )}

        <select value={filtre.sortare} onChange={(e) => setFiltru('sortare', e.target.value)} className={alege(filtre.sortare !== 'scor')} aria-label="Sortare">
          {SORTARI.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setFiltru('doarNoi', !filtre.doarNoi)}
          title="Doar firmele găsite prima dată în ultima căutare"
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
            filtre.doarNoi
              ? 'bg-indigo-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:border-indigo-400'
          }`}
        >
          <SparklesIcon className="h-3.5 w-3.5" />
          Doar noi
        </button>

        <span className="ml-auto flex items-center gap-2 text-[11px] text-gray-500">
          {seIncarca
            ? 'se încarcă…'
            : totalFiltrat === sv.total
              ? `${totalFiltrat} lead-uri`
              : `${totalFiltrat} din ${sv.total}`}
          {nrFiltreActive > 0 && (
            <>
              <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 font-semibold text-white">
                {nrFiltreActive} {nrFiltreActive === 1 ? 'filtru' : 'filtre'}
              </span>
              <button
                type="button"
                onClick={reseteazaTot}
                className="inline-flex items-center gap-0.5 font-medium text-indigo-600 hover:text-indigo-800"
              >
                <XMarkIcon className="h-3 w-3" />
                Resetează
              </button>
            </>
          )}
        </span>
      </div>

      {/* ── Lista ──────────────────────────────────────────────── */}
      {seIncarca && leaduri.length === 0 ? (
        <div className="space-y-1">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg border border-gray-100 bg-white px-3 py-3">
              <div className="h-4 w-4 rounded bg-gray-100" />
              <div className="h-3 w-40 rounded bg-gray-100" />
              <div className="h-3 w-24 rounded bg-gray-100" />
              <div className="ml-auto h-3 w-16 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : leaduri.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
          <GlobeAltIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">
            {nrFiltreActive > 0
              ? 'Niciun lead nu corespunde filtrelor'
              : 'Niciun lead încă — pornește o căutare sau adaugă unul cu „Lead nou"'}
          </p>
        </div>
      ) : (
        <div className={`space-y-1 transition-opacity ${seIncarca ? 'opacity-60' : ''}`}>
          {leaduri.map((lead) => (
            <RandLead
              key={lead.id}
              lead={lead}
              deschis={deschisId === lead.id}
              onComuta={() => setDeschisId(deschisId === lead.id ? null : lead.id)}
              onStatus={schimbaStatus}
              onEditeaza={(l) => setFormular(l)}
              onSterge={stergeLead}
              onWhatsApp={setLeadWhatsApp}
              onUrgent={comutaUrgent}
              poateEdita={poateRula}
              echipa={echipa}
              onResponsabil={schimbaResponsabil}
              onFollowUp={schimbaFollowUp}
              onAdaugaNota={adaugaNota}
              onStergeNota={stergeNota}
              onCopiaza={copiaza}
            />
          ))}
        </div>
      )}

      {/* ── Paginare ───────────────────────────────────────────── */}
      {totalFiltrat > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Pe pagină:</span>
            <select
              value={String(marime)}
              onChange={(e) => {
                setMarime(e.target.value === 'toate' ? 'toate' : parseInt(e.target.value, 10))
                setPagina(1)
              }}
              className={selectClass}
              aria-label="Lead-uri pe pagină"
            >
              {MARIMI_PAGINA.map((n) => (
                <option key={n} value={n}>
                  {n === 'toate' ? 'Toate' : n}
                </option>
              ))}
            </select>
            <span>
              {marime === 'toate'
                ? `toate cele ${totalFiltrat}`
                : `${(pagina - 1) * marime + 1}–${Math.min(pagina * marime, totalFiltrat)} din ${totalFiltrat}`}
            </span>
          </div>

          {marime !== 'toate' && totalPagini > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                disabled={pagina === 1}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                ‹ Înapoi
              </button>
              {numerePagini.map((n, i) =>
                n === '…' ? (
                  <span key={`gol-${i}`} className="px-1 text-xs text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPagina(n)}
                    className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      n === pagina ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(p + 1, totalPagini))}
                disabled={pagina === totalPagini}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Înainte ›
              </button>
            </div>
          )}
        </div>
      )}

      {istoric.length > 0 && <IstoricRulari rulari={istoric} />}

      {formular && (
        <FormularLead
          lead={formular === 'nou' ? null : formular}
          echipa={echipa}
          orase={oraseDB}
          categorii={toateCategoriile}
          onInchide={() => setFormular(null)}
          onSalvat={dupaSalvare}
        />
      )}

      {leadWhatsApp && (
        <ModalWhatsApp
          lead={leadWhatsApp}
          numeleMeu={numeleMeu}
          onInchide={() => setLeadWhatsApp(null)}
          onTrimis={dupaWhatsApp}
          grupuriCategorii={optiuni.grupuriCategorii}
        />
      )}
    </div>
  )
}

// ============================================================
// SUBCOMPONENTE
// ============================================================

function ChipStat({ eticheta, valoare, culoare = 'text-gray-900', activ = false, onClick, titlu }) {
  const clasa = `inline-flex items-baseline gap-1 rounded-lg border px-2 py-1 ${
    activ ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200' : 'border-gray-200 bg-white'
  }`
  const continut = (
    <>
      <span className="text-[10px] text-gray-500">{eticheta}</span>
      <span className={`text-xs font-bold ${culoare}`}>{valoare}</span>
    </>
  )
  if (!onClick) {
    return (
      <span className={clasa} title={titlu}>
        {continut}
      </span>
    )
  }
  return (
    <button type="button" onClick={onClick} title={titlu || 'Filtrează'} className={`${clasa} hover:border-indigo-300`}>
      {continut}
    </button>
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
                    {r.tara && r.tara !== 'MD' ? `${steagTara(r.tara)} ` : ''}
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
