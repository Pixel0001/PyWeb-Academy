/**
 * Orchestratorul unei rulări.
 *
 * O rulare completă (5 orașe × 37 categorii = 185 interogări, plus sute de
 * verificări de site) durează mult prea mult pentru o singură cerere HTTP.
 * De aceea rularea e împărțită în PAȘI mici, pe care interfața îi cere pe rând:
 *
 *   SEARCH → caută firmele pe Google (interogări din config)
 *   CHECK  → verifică site-urile firmelor găsite
 *   PITCH  → generează frazele de deschidere
 *   DONE   → gata
 *
 * Fiecare pas se încadrează confortabil sub limita de 60 de secunde, iar dacă
 * procesul crapă, rularea rămâne în baza de date exact unde a rămas.
 */

import prisma from '@/lib/prisma'
import { CONFIG, construiesteInterogari, estimeazaCost } from './config.js'
import { cautaFirme, mapeazaFirma } from './places.js'
import { verificaSiteuri, esteSocial } from './site-check.js'
import { calculeazaScor } from './scoring.js'
import { genereazaPitchuri, pitchSablon } from './pitch.js'

const MAX_LOGURI = 300

// Funcția moare la 60s pe Vercel. Ne oprim la 45 ca să apucăm să salvăm
// progresul și să răspundem — un 504 ar pierde tot lucrul pasului.
const BUGET_PAS_MS = 45 * 1000

// Lock scurt: dacă funcția e ucisă de timeout, `lockedAt` rămâne setat și
// nimeni nu-l mai șterge. Peste atâta timp considerăm lock-ul mort.
const DURATA_LOCK_MS = 70 * 1000

/**
 * Cronometrul unui pas. Fiecare fază verifică `expirat()` între unități de
 * lucru și se oprește frumos: ce n-a apucat rămâne pentru pasul următor.
 */
function creeazaTermen(bugetMs = BUGET_PAS_MS) {
  const start = Date.now()
  return {
    expirat: () => Date.now() - start >= bugetMs,
    ramasMs: () => Math.max(0, bugetMs - (Date.now() - start)),
    scursMs: () => Date.now() - start,
  }
}

/**
 * Rulează actualizări în paralel, în grupuri mici.
 *
 * O buclă cu `await` pe fiecare rând înseamnă un drum dus-întors la Mongo
 * pentru fiecare firmă; la 300 de firme se adună zeci de secunde degeaba.
 */
async function actualizeazaInParalel(elemente, actiune, grup = 10) {
  for (let i = 0; i < elemente.length; i += grup) {
    await Promise.all(elemente.slice(i, i + grup).map(actiune))
  }
}

// ============================================================
// AJUTOARE
// ============================================================

function acum() {
  return new Date().toISOString().slice(11, 19) // hh:mm:ss
}

/** Adaugă o linie în jurnalul rulării (păstrăm ultimele MAX_LOGURI). */
function adaugaLog(loguri, mesaj) {
  const lista = Array.isArray(loguri) ? loguri : []
  lista.push(`[${acum()}] ${mesaj}`)
  return lista.slice(-MAX_LOGURI)
}

/** Cheia de cache pentru o interogare: „restaurant|Chișinău" */
function cheieInterogare(interogare) {
  return `${interogare.categorie}|${interogare.oras}`
}

// ============================================================
// CREAREA RULĂRII
// ============================================================

/**
 * Pregătește o rulare nouă: produsul cartezian categorii × orașe.
 * Nu face niciun apel API — doar planifică.
 */
export async function creeazaRulare({ orase, categorii, createdBy }) {
  const listaOrase = orase?.length ? orase : CONFIG.orase
  const listaCategorii = categorii?.length ? categorii : CONFIG.categorii

  const interogari = construiesteInterogari(listaOrase, listaCategorii).map((i) => ({
    ...i,
    stare: 'ASTEAPTA', // ASTEAPTA | GATA | SARITA | EROARE
    apeluri: 0,
    gasite: 0,
    eroare: null,
  }))

  const estimare = estimeazaCost(interogari.length)

  const rulare = await prisma.leadRun.create({
    data: {
      status: 'QUEUED',
      faza: 'SEARCH',
      orase: listaOrase,
      categorii: listaCategorii,
      interogari,
      limitaApeluri: CONFIG.buget.maxApeluriPeRulare,
      loguri: adaugaLog(
        [],
        `Rulare pregătită: ${interogari.length} interogări (${listaOrase.length} orașe × ${listaCategorii.length} categorii). ` +
          `Estimare: ${estimare.apeluriMin}–${estimare.apeluriMax} apeluri, ${estimare.costMinUsd}–${estimare.costMaxUsd} $.`
      ),
      createdBy: createdBy || null,
    },
  })

  return { rulare, estimare }
}

// ============================================================
// PASUL 1 — CĂUTAREA (SEARCH)
// ============================================================

/**
 * Salvează firmele găsite, deduplicate după placeId.
 * Firmele deja cunoscute NU se re-verifică decât dacă li s-a schimbat site-ul
 * sau a trecut prea mult timp — așa nu plătesc de două ori aceeași muncă.
 */
async function salveazaFirme(firme, runId) {
  if (!firme.length) return { noi: 0, actualizate: 0, sarite: 0 }

  const filtre = CONFIG.filtre || {}
  const pragReverificare = new Date(
    Date.now() - (CONFIG.cache.zileReverificareSite || 30) * 24 * 60 * 60 * 1000
  )

  // Filtrăm ce nu-mi folosește. O firmă mă interesează dacă am PE CE s-o contactez:
  //   - are telefon                        → o sun;
  //   - n-are telefon, dar are Facebook /
  //     Instagram / altă pagină de social  → îi scriu acolo;
  //   - n-are nici telefon, nici social    → nu am cum ajunge la ea, o sar.
  // Firmele închise definitiv nu sunt clienți, indiferent de contact.
  const utile = firme.filter((f) => {
    if (filtre.excludeInchisePermanent && f.businessStatus === 'CLOSED_PERMANENTLY') return false

    if (filtre.doarCuContact) {
      const areTelefon = Boolean(f.telefon || f.telefonLocal)
      const areSocial = Boolean(esteSocial(f.siteUrl))
      if (!areTelefon && !areSocial) return false
    }

    return true
  })
  const sarite = firme.length - utile.length

  // Deduplicare în interiorul lotului (aceeași firmă poate apărea de două ori)
  const dupaId = new Map()
  for (const f of utile) {
    const existent = dupaId.get(f.placeId)
    if (existent) {
      for (const c of f.categorii) {
        if (!existent.categorii.includes(c)) existent.categorii.push(c)
      }
    } else {
      dupaId.set(f.placeId, { ...f, categorii: [...f.categorii] })
    }
  }

  const idsLot = [...dupaId.keys()]
  const existente = await prisma.webLead.findMany({
    where: { placeId: { in: idsLot } },
    select: {
      id: true,
      placeId: true,
      categorii: true,
      siteUrl: true,
      verificatLa: true,
      calitateSite: true,
    },
  })
  const dupaIdExistent = new Map(existente.map((e) => [e.placeId, e]))

  const deCreat = []
  const deActualizat = []

  for (const [placeId, firma] of dupaId) {
    const vechi = dupaIdExistent.get(placeId)

    if (!vechi) {
      deCreat.push({
        ...firma,
        scor: 0,
        status: 'DE_SUNAT',
        runId,
        descoperitInRunId: runId, // rularea care a găsit-o PRIMA — rămâne fixă
        verificatLa: null,
        pitch: null,
      })
      continue
    }

    // Firma e deja cunoscută — reunim categoriile sub care a apărut.
    const categoriiUnite = [...new Set([...(vechi.categorii || []), ...firma.categorii])]

    // Merită re-verificat site-ul? Doar dacă s-a schimbat adresa sau a expirat cache-ul.
    const siteSchimbat = (vechi.siteUrl || null) !== (firma.siteUrl || null)
    const cacheExpirat = !vechi.verificatLa || vechi.verificatLa < pragReverificare
    const reverifica = siteSchimbat || cacheExpirat

    deActualizat.push({
      id: vechi.id,
      date: {
        denumire: firma.denumire,
        telefon: firma.telefon,
        telefonLocal: firma.telefonLocal,
        adresa: firma.adresa,
        oras: firma.oras,
        categorii: categoriiUnite,
        categoriePrincipala: firma.categoriePrincipala,
        rating: firma.rating,
        nrRecenzii: firma.nrRecenzii,
        siteUrl: firma.siteUrl,
        linkMaps: firma.linkMaps,
        businessStatus: firma.businessStatus,
        runId,
        ...(reverifica ? { verificatLa: null, pitch: null } : {}),
      },
    })
  }

  if (deCreat.length) {
    await prisma.webLead.createMany({ data: deCreat })
  }
  await actualizeazaInParalel(deActualizat, (u) =>
    prisma.webLead.update({ where: { id: u.id }, data: u.date })
  )

  return { noi: deCreat.length, actualizate: deActualizat.length, sarite }
}

/** Execută următoarele `interogariPePas` interogări. */
async function pasCautare(rulare, apiKey, termen) {
  const interogari = rulare.interogari
  const perPas = CONFIG.pasi.interogariPePas
  const valabilitate = new Date(
    Date.now() - (CONFIG.cache.zileValabilitateInterogare || 30) * 24 * 60 * 60 * 1000
  )

  let idx = rulare.idxInterogare
  let apeluriApi = rulare.apeluriApi
  let interogariSarite = rulare.interogariSarite
  let firmeNoi = rulare.firmeNoi
  let firmeTotal = rulare.firmeTotal
  let loguri = rulare.loguri
  let avertisment = rulare.avertisment
  let opritDeBuget = false

  const limita = rulare.limitaApeluri || CONFIG.buget.maxApeluriPeRulare
  let procesate = 0

  // Ne oprim la prima dintre: gata interogările, cota pe pas, sau timpul.
  while (idx < interogari.length && procesate < perPas) {
    // Prima interogare rulează întotdeauna — garantăm că pasul avansează.
    if (procesate > 0 && termen.expirat()) break

    // ── Plasa de siguranță pentru buget ───────────────────────────
    if (apeluriApi >= limita) {
      avertisment =
        `OPRIT AUTOMAT: rularea a atins ${apeluriApi} apeluri API (limita ${limita}). ` +
        `Limita gratuită lunară Google e 1000. Restul de ${interogari.length - idx} interogări nu au fost executate.`
      loguri = adaugaLog(loguri, `⛔ ${avertisment}`)
      opritDeBuget = true
      break
    }

    const interogare = interogari[idx]

    // ── Cache: interogarea a fost rulată recent? Atunci nu plătim din nou. ──
    const cheie = cheieInterogare(interogare)
    const inCache = await prisma.leadQueryCache.findUnique({ where: { cheie } })

    if (inCache && inCache.ultimaRulare > valabilitate) {
      interogari[idx] = {
        ...interogare,
        stare: 'SARITA',
        eroare: null,
        gasite: inCache.rezultate,
      }
      interogariSarite++
      loguri = adaugaLog(
        loguri,
        `⏭  „${interogare.q}" — sărită (rulată pe ${inCache.ultimaRulare.toISOString().slice(0, 10)}, 0 apeluri)`
      )
      idx++
      procesate++
      continue
    }

    // ── Apelul propriu-zis ────────────────────────────────────────
    try {
      const rezultat = await cautaFirme({
        textQuery: interogare.q,
        apiKey,
        apeluriRamase: limita - apeluriApi,
      })

      apeluriApi += rezultat.apeluri

      const firme = rezultat.places.map((p) =>
        mapeazaFirma(p, { oras: interogare.oras, categorie: interogare.categorie })
      )
      const salvate = await salveazaFirme(firme, rulare.id)

      firmeNoi += salvate.noi
      firmeTotal += salvate.noi + salvate.actualizate

      interogari[idx] = {
        ...interogare,
        stare: 'GATA',
        apeluri: rezultat.apeluri,
        gasite: firme.length,
        eroare: null,
      }

      await prisma.leadQueryCache.upsert({
        where: { cheie },
        create: {
          cheie,
          ultimaRulare: new Date(),
          apeluri: rezultat.apeluri,
          rezultate: firme.length,
        },
        update: {
          ultimaRulare: new Date(),
          apeluri: rezultat.apeluri,
          rezultate: firme.length,
        },
      })

      loguri = adaugaLog(
        loguri,
        `✓ „${interogare.q}" — ${rezultat.apeluri} apel(uri), ${firme.length} firme ` +
          `(${salvate.noi} noi, ${salvate.sarite} sărite — fără telefon și fără social)`
      )
    } catch (err) {
      interogari[idx] = {
        ...interogare,
        stare: 'EROARE',
        eroare: err.message?.slice(0, 250) || 'eroare necunoscută',
      }
      loguri = adaugaLog(loguri, `✗ „${interogare.q}" — EROARE: ${err.message?.slice(0, 200)}`)
    }

    idx++
    procesate++
  }

  // Avertisment din timp, înainte să lovim plafonul
  const pragAvertisment = CONFIG.buget.avertismentLaApeluri
  if (!avertisment && apeluriApi >= pragAvertisment) {
    avertisment = `Atenție: ${apeluriApi} apeluri API făcute în această rulare (plafon ${limita}, limita gratuită lunară 1000).`
  }

  const gata = opritDeBuget || idx >= interogari.length
  if (gata) {
    loguri = adaugaLog(
      loguri,
      `── Căutare încheiată: ${apeluriApi} apeluri, ${firmeTotal} firme (${firmeNoi} noi), ${interogariSarite} interogări sărite din cache.`
    )
  }

  return {
    interogari,
    idxInterogare: idx,
    apeluriApi,
    interogariSarite,
    firmeNoi,
    firmeTotal,
    costUsd: +(apeluriApi * CONFIG.buget.costPerApelUsd).toFixed(4),
    loguri,
    avertisment,
    faza: gata ? 'CHECK' : 'SEARCH',
  }
}

// ============================================================
// PASUL 2 — VERIFICAREA SITE-URILOR (CHECK)
// ============================================================

async function pasVerificare(rulare, termen) {
  const lot = await prisma.webLead.findMany({
    where: { runId: rulare.id, verificatLa: null },
    select: { id: true, placeId: true, siteUrl: true, rating: true, nrRecenzii: true },
    take: CONFIG.pasi.siteuriPePas,
  })

  let loguri = rulare.loguri

  if (!lot.length) {
    const faraSite = await prisma.webLead.count({
      where: { runId: rulare.id, calitateSite: { in: ['LIPSA', 'DOAR_SOCIAL'] } },
    })
    loguri = adaugaLog(loguri, `── Verificarea site-urilor s-a încheiat. ${faraSite} firme fără site propriu.`)
    return { faza: 'PITCH', faraSite, loguri }
  }

  // Verificăm în sub-grupuri, ca să putem ieși la timp. Un site care nu
  // răspunde ține 10 secunde ocupat, deci un lot întreg poate depăși bugetul.
  const rezultate = new Map()
  const procesate = []
  const marimeGrup = CONFIG.verificareSite.concurenta

  for (let i = 0; i < lot.length; i += marimeGrup) {
    // Primul subgrup rulează întotdeauna: altfel, dacă bugetul s-ar termina
    // chiar la intrarea în pas, rularea s-ar învârti fără să avanseze.
    if (i > 0 && termen.expirat()) break
    const subgrup = lot.slice(i, i + marimeGrup)
    const rezultatSubgrup = await verificaSiteuri(subgrup)
    for (const [k, v] of rezultatSubgrup) rezultate.set(k, v)
    procesate.push(...subgrup)
  }

  const deSalvat = []

  for (const lead of procesate) {
    // Orice s-ar întâmpla, fiecare lead din lot TREBUIE să primească `verificatLa`,
    // altfel ar fi ales din nou la pasul următor și rularea s-ar învârti la infinit.
    const r = rezultate.get(lead.placeId) || {
      calitate: 'MORT',
      observatii: 'verificarea nu a întors niciun rezultat',
    }

    const scor = calculeazaScor({
      calitateSite: r.calitate,
      rating: lead.rating,
      nrRecenzii: lead.nrRecenzii,
    })

    deSalvat.push({
      id: lead.id,
      data: {
        calitateSite: r.calitate,
        observatiiSite: r.observatii,
        scor,
        verificatLa: new Date(),
        pitch: null, // calitatea s-a (re)stabilit → pitch-ul se regenerează
      },
    })
  }

  await actualizeazaInParalel(deSalvat, (u) =>
    prisma.webLead.update({ where: { id: u.id }, data: u.data })
  )

  const ramase = await prisma.webLead.count({ where: { runId: rulare.id, verificatLa: null } })
  loguri = adaugaLog(loguri, `🔎 ${procesate.length} site-uri verificate, ${ramase} rămase.`)

  return { faza: 'CHECK', loguri }
}

// ============================================================
// PASUL 3 — PITCH-URILE (PITCH)
// ============================================================

async function pasPitch(rulare, termen) {
  const cate = CONFIG.pitch.marimeLot * CONFIG.pasi.loturiPitchPePas

  const lot = await prisma.webLead.findMany({
    where: { runId: rulare.id, pitch: null, verificatLa: { not: null } },
    take: cate,
    orderBy: { scor: 'desc' }, // întâi cele mai valoroase
  })

  let loguri = rulare.loguri

  if (!lot.length) {
    loguri = adaugaLog(loguri, '── Pitch-urile sunt gata. Rulare încheiată.')
    return { faza: 'DONE', loguri }
  }

  // Îi dăm generatorului timpul rămas: dacă e pe terminate, sare peste
  // runda de reparare și pune direct șabloanele — mai bine ceva decât un 504.
  const { pitchuri, cost, furnizor, erori, statistici } = await genereazaPitchuri(lot, { termen })

  // Ca și la verificare: fiecare lead trebuie să iasă din lista „pitch == null",
  // altfel pasul l-ar relua la nesfârșit. Șablonul local e plasa de siguranță.
  await actualizeazaInParalel(lot, (lead) =>
    prisma.webLead.update({
      where: { id: lead.id },
      data: { pitch: pitchuri.get(lead.placeId) || pitchSablon(lead) },
    })
  )

  // Jurnalul arată cât de bine s-a descurcat modelul: câte fraze au trecut din
  // prima, câte au trebuit reparate și câte au căzut pe șablon.
  loguri = adaugaLog(
    loguri,
    `💬 ${lot.length} pitch-uri (${furnizor}): ${statistici.dinModel} bune din prima, ` +
      `${statistici.dupaReparare} după reparare, ${statistici.dinSablon} din șablon.`
  )

  // Motivele respingerilor — dacă modelul inventează cifre, vreau să știu.
  for (const respins of (statistici.respinse || []).slice(0, 3)) {
    loguri = adaugaLog(loguri, `   ↳ „${respins.firma}" respins: ${respins.motive.join('; ')}`)
  }
  for (const e of erori.slice(0, 3)) {
    loguri = adaugaLog(loguri, `⚠ pitch: ${e}`)
  }

  return { faza: 'PITCH', loguri, costPitch: cost }
}

// ============================================================
// EXECUȚIA UNUI PAS
// ============================================================

/**
 * Execută următorul pas al rulării. Interfața cheamă asta în buclă
 * până când `terminat` devine true.
 */
export async function executaPas(runId) {
  const rulare = await prisma.leadRun.findUnique({ where: { id: runId } })
  if (!rulare) throw new Error('Rularea nu există')

  if (['DONE', 'EROARE', 'ANULAT'].includes(rulare.status)) {
    return { terminat: true, rulare }
  }

  // Lock simplu — ca două file de browser deschise să nu facă aceeași muncă de două ori.
  if (rulare.lockedAt && Date.now() - new Date(rulare.lockedAt).getTime() < DURATA_LOCK_MS) {
    return { ocupat: true, rulare }
  }

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey && rulare.faza === 'SEARCH') {
    const eroare = 'Lipsește GOOGLE_API_KEY din variabilele de mediu.'
    const actualizata = await prisma.leadRun.update({
      where: { id: runId },
      data: {
        status: 'EROARE',
        eroare,
        finishedAt: new Date(),
        loguri: adaugaLog(rulare.loguri, `✗ ${eroare}`),
      },
    })
    return { terminat: true, rulare: actualizata }
  }

  await prisma.leadRun.update({
    where: { id: runId },
    data: { lockedAt: new Date(), status: 'RULEAZA' },
  })

  try {
    const termen = creeazaTermen()
    let actualizari = {}

    if (rulare.faza === 'SEARCH') {
      actualizari = await pasCautare(rulare, apiKey, termen)
    } else if (rulare.faza === 'CHECK') {
      actualizari = await pasVerificare(rulare, termen)
    } else if (rulare.faza === 'PITCH') {
      const rezultat = await pasPitch(rulare, termen)
      actualizari = { faza: rezultat.faza, loguri: rezultat.loguri }
    }

    const terminat = actualizari.faza === 'DONE'

    if (terminat) {
      const [faraSite, total] = await Promise.all([
        prisma.webLead.count({
          where: { runId, calitateSite: { in: ['LIPSA', 'DOAR_SOCIAL'] } },
        }),
        prisma.webLead.count({ where: { runId } }),
      ])
      actualizari.faraSite = faraSite
      actualizari.firmeTotal = total
      actualizari.status = 'DONE'
      actualizari.finishedAt = new Date()
    }

    // `costPitch` nu e coloană în baza de date — îl scoatem înainte de update.
    delete actualizari.costPitch

    const actualizata = await prisma.leadRun.update({
      where: { id: runId },
      data: { ...actualizari, lockedAt: null },
    })

    return { terminat, rulare: actualizata }
  } catch (err) {
    const actualizata = await prisma.leadRun.update({
      where: { id: runId },
      data: {
        status: 'EROARE',
        eroare: err.message?.slice(0, 500) || 'eroare necunoscută',
        lockedAt: null,
        finishedAt: new Date(),
        loguri: adaugaLog(rulare.loguri, `✗ EROARE FATALĂ: ${err.message?.slice(0, 300)}`),
      },
    })
    return { terminat: true, eroare: err.message, rulare: actualizata }
  }
}

/** Oprește o rulare în curs. */
export async function anuleazaRulare(runId) {
  return prisma.leadRun.update({
    where: { id: runId },
    data: { status: 'ANULAT', finishedAt: new Date(), lockedAt: null },
  })
}

/** Rezumatul afișat la final (și în consolă, la scriptul de test). */
export function rezumatRulare(rulare) {
  return {
    apeluriApi: rulare.apeluriApi,
    costEstimatUsd: +(rulare.apeluriApi * CONFIG.buget.costPerApelUsd).toFixed(2),
    interogariSarite: rulare.interogariSarite,
    firmeUnice: rulare.firmeTotal,
    firmeNoi: rulare.firmeNoi,
    faraSite: rulare.faraSite,
    avertisment: rulare.avertisment,
  }
}
