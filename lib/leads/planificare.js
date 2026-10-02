/**
 * Decide ce se întâmplă cu firmele găsite într-un lot: lead nou sau locație
 * adăugată la o firmă deja salvată. Funcție pură — fără bază de date — ca
 * să poată fi testată pe date de exemplu.
 */

import { calculeazaScor } from './scoring.js'
import {
  cheiFirma,
  aceeasiFirma,
  locatieDin,
  locatiileLui,
  unesteLocatii,
  cifreDinLocatii,
  celMaiDes,
  numeFirma,
} from './firme.js'

/**
 * @param {object} p
 * @param {object[][]} p.grupe        firmele lotului, grupate pe firmă (grupeazaFirme)
 * @param {object[]}   p.candidati    lead-uri salvate care ar putea fi aceeași firmă
 * @param {string}     p.runId
 * @param {Date}       p.pragReverificare  site-urile verificate înainte de asta se reverifică
 * @returns {{ deCreat: object[], deActualizat: Map<string, object>, locatiiUnite: number }}
 */
export function planificaSalvare({ grupe, candidati, runId, pragReverificare }) {
  const indexCandidati = candidati.map((c) => ({
    lead: c,
    chei: cheiFirma(c),
    locuri: new Set([c.placeId, ...(c.placeIds || [])]),
  }))

  function gasesteExistent(grupa) {
    const ids = grupa.map((f) => f.placeId)
    const dupaLocatie = indexCandidati.find((c) => ids.some((id) => c.locuri.has(id)))
    if (dupaLocatie) return dupaLocatie.lead
    for (const f of grupa) {
      const k = cheiFirma(f)
      const potrivit = indexCandidati.find((c) => aceeasiFirma(k, c.chei))
      if (potrivit) return potrivit.lead
    }
    return null
  }

  const deCreat = []
  const deActualizat = new Map() // id → date; un lead poate primi mai multe grupe din lot
  let locatiiUnite = 0

  for (const grupa of grupe) {
    const vechi = gasesteExistent(grupa)
    const locatiiNoi = grupa.map(locatieDin)

    // ── Firmă nouă ──────────────────────────────────────────────
    if (!vechi) {
      // Locația principală = cea cu cele mai multe recenzii
      const principala = [...grupa].sort((a, b) => (b.nrRecenzii || 0) - (a.nrRecenzii || 0))[0]
      const cifre = cifreDinLocatii(locatiiNoi)
      const multe = grupa.length > 1

      deCreat.push({
        ...principala,
        denumire: multe ? numeFirma(grupa.map((f) => f.denumire)) : principala.denumire,
        telefon: multe ? celMaiDes(grupa.map((f) => f.telefon)) || principala.telefon : principala.telefon,
        categorii: [...new Set(grupa.flatMap((f) => f.categorii))],
        siteUrl: principala.siteUrl || grupa.find((f) => f.siteUrl)?.siteUrl || null,
        rating: cifre.rating,
        nrRecenzii: cifre.nrRecenzii,
        placeIds: grupa.map((f) => f.placeId),
        locatii: multe ? locatiiNoi : null,
        nrLocatii: multe ? cifre.nrLocatii : null,
        scor: 0,
        status: 'DE_SUNAT',
        sursa: 'GOOGLE_MAPS',
        runId,
        descoperitInRunId: runId, // rularea care a găsit-o PRIMA — rămâne fixă
        verificatLa: null,
        pitch: null,
      })
      locatiiUnite += grupa.length - 1
      continue
    }

    // ── Firmă cunoscută — îi adăugăm locațiile și refacem cifrele ──
    const precedent = deActualizat.get(vechi.id)
    const locatiiVechi = precedent?.locatii || locatiileLui(vechi)
    const locatii = unesteLocatii(locatiiVechi, locatiiNoi)
    locatiiUnite += Math.max(locatii.length - locatiiVechi.length, 0)
    const cifre = cifreDinLocatii(locatii)
    const oSinguraLocatie = locatii.length <= 1
    const aceeasiLocatie = grupa.find((f) => f.placeId === vechi.placeId)

    // Site-ul: al locației principale, dacă Google ni l-a dat acum; altfel cel știut
    const siteUrl =
      (aceeasiLocatie ? aceeasiLocatie.siteUrl : null) ||
      precedent?.siteUrl ||
      vechi.siteUrl ||
      grupa.find((f) => f.siteUrl)?.siteUrl ||
      null

    // Merită re-verificat site-ul? Doar dacă s-a schimbat adresa sau a expirat cache-ul.
    const siteSchimbat = (vechi.siteUrl || null) !== siteUrl
    const cacheExpirat = !vechi.verificatLa || vechi.verificatLa < pragReverificare
    const reverifica = siteSchimbat || cacheExpirat

    const date = {
      // O firmă cu o singură locație își ia datele direct de la Google, ca înainte.
      // La una cu mai multe, numele și adresa principale nu se mută după fiecare locație.
      ...(oSinguraLocatie && aceeasiLocatie
        ? {
            denumire: aceeasiLocatie.denumire,
            telefon: aceeasiLocatie.telefon,
            telefonLocal: aceeasiLocatie.telefonLocal,
            adresa: aceeasiLocatie.adresa,
            oras: aceeasiLocatie.oras,
            categoriePrincipala: aceeasiLocatie.categoriePrincipala,
            linkMaps: aceeasiLocatie.linkMaps,
            businessStatus: aceeasiLocatie.businessStatus,
          }
        : {}),
      categorii: [...new Set([...(precedent?.categorii || vechi.categorii || []), ...grupa.flatMap((f) => f.categorii)])],
      rating: cifre.rating,
      nrRecenzii: cifre.nrRecenzii,
      placeIds: [...new Set([vechi.placeId, ...(vechi.placeIds || []), ...locatii.map((l) => l.placeId)])].filter(
        (id) => id && !id.startsWith('manual:')
      ),
      locatii: oSinguraLocatie ? null : locatii,
      nrLocatii: oSinguraLocatie ? null : cifre.nrLocatii,
      siteUrl,
      runId,
      // Cifrele s-au putut schimba — scorul se reface acum, nu doar la verificare
      scor: calculeazaScor({ calitateSite: vechi.calitateSite, rating: cifre.rating, nrRecenzii: cifre.nrRecenzii }),
      ...(reverifica ? { verificatLa: null, pitch: null } : {}),
    }
    deActualizat.set(vechi.id, date)
  }

  return { deCreat, deActualizat, locatiiUnite }
}

// ============================================================
// UNIREA DUBLURILOR DEJA SALVATE
// ============================================================

/** Cât s-a lucrat pe un lead — păstrăm lead-ul pe care s-a muncit cel mai mult. */
function munca(lead) {
  return (
    (lead.status && lead.status !== 'DE_SUNAT' ? 100 : 0) +
    (lead._count?.notiteIstoric || 0) * 10 +
    (lead.responsabilId ? 5 : 0) +
    (lead.nextFollowUpAt ? 5 : 0) +
    (lead.notite ? 3 : 0)
  )
}

/**
 * Cum se unesc mai multe lead-uri ale aceleiași firme într-unul singur.
 *
 * Se păstrează lead-ul pe care s-a lucrat cel mai mult (status, notițe,
 * responsabil); de la celelalte se iau locațiile, categoriile, recontactarea
 * cea mai apropiată și ultimul apel. Notițele lor se mută pe lead-ul păstrat
 * (asta o face ruta), deci nu se pierde nimic.
 *
 * @param {object[]} grupa  lead-urile aceleiași firme (minim 2)
 * @returns {{ principal: object, ceilalti: object[], date: object, nota: string }}
 */
export function planificaUnire(grupa) {
  const ordonate = [...grupa].sort(
    (a, b) =>
      munca(b) - munca(a) ||
      (b.nrRecenzii || 0) - (a.nrRecenzii || 0) ||
      new Date(a.createdAt) - new Date(b.createdAt)
  )
  const [principal, ...ceilalti] = ordonate

  const locatii = unesteLocatii(...ordonate.map(locatiileLui))
  const cifre = cifreDinLocatii(locatii)
  const cuSite = ordonate.find((l) => l.siteUrl)
  // Calitatea site-ului vine de la lead-ul al cărui site îl păstrăm
  const sursaSite = principal.siteUrl ? principal : cuSite || principal
  const recontactari = ordonate.map((l) => l.nextFollowUpAt).filter(Boolean).map((d) => new Date(d))
  const apeluri = ordonate.map((l) => l.dataApel).filter(Boolean).map((d) => new Date(d))
  const create = ordonate.map((l) => new Date(l.createdAt)).filter((d) => !Number.isNaN(d.getTime()))
  const notiteVechi = ordonate.map((l) => l.notite).filter(Boolean)
  const calitateSite = sursaSite.calitateSite || null

  const date = {
    denumire: numeFirma(ordonate.map((l) => l.denumire)),
    telefon: principal.telefon || celMaiDes(ordonate.map((l) => l.telefon)) || null,
    siteUrl: sursaSite.siteUrl || null,
    calitateSite,
    observatiiSite: sursaSite.observatiiSite || null,
    categorii: [...new Set(ordonate.flatMap((l) => l.categorii || []))],
    placeIds: [...new Set(ordonate.flatMap((l) => [l.placeId, ...(l.placeIds || [])]))].filter(
      (id) => id && !id.startsWith('manual:')
    ),
    locatii: locatii.length > 1 ? locatii : null,
    nrLocatii: locatii.length > 1 ? cifre.nrLocatii : null,
    rating: locatii.length ? cifre.rating : principal.rating,
    nrRecenzii: locatii.length ? cifre.nrRecenzii : principal.nrRecenzii,
    responsabilId: principal.responsabilId || ordonate.find((l) => l.responsabilId)?.responsabilId || null,
    nextFollowUpAt: principal.nextFollowUpAt
      ? new Date(principal.nextFollowUpAt)
      : recontactari.length
        ? new Date(Math.min(...recontactari))
        : null,
    dataApel: apeluri.length ? new Date(Math.max(...apeluri)) : null,
    ...(create.length ? { createdAt: new Date(Math.min(...create)) } : {}),
    ...(notiteVechi.length > 1 ? { notite: notiteVechi.join('\n---\n').slice(0, 5000) } : {}),
  }
  date.scor = calculeazaScor({ calitateSite, rating: date.rating, nrRecenzii: date.nrRecenzii })

  // O notiță pe lead, ca să se știe de ce are acum mai multe locații
  // Dublurile identice se numără: „Fornetti ×6 (Chișinău)"
  const numar = new Map()
  for (const l of ceilalti) {
    const detalii = [
      l.status && l.status !== 'DE_SUNAT' ? `status ${l.status}` : null,
      l._count?.notiteIstoric ? `${l._count.notiteIstoric} notițe mutate aici` : null,
    ].filter(Boolean)
    const eticheta = `${l.denumire}|${l.oras || ''}|${detalii.join(', ')}`
    numar.set(eticheta, (numar.get(eticheta) || 0) + 1)
  }
  const despre = [...numar.entries()]
    .map(([eticheta, n]) => {
      const [nume, oras, detalii] = eticheta.split('|')
      return `${nume}${n > 1 ? ` ×${n}` : ''}${oras ? ` (${oras})` : ''}${detalii ? ` — ${detalii}` : ''}`
    })
    .slice(0, 15)
  const nota =
    `🔗 Unit cu ${ceilalti.length} ${ceilalti.length === 1 ? 'dublură' : 'dubluri'} ale aceleiași firme: ` +
    despre.join('; ') +
    (numar.size > 15 ? ' și altele' : '')

  return { principal, ceilalti, date, nota }
}
