/**
 * Coloana PITCH — fraza de deschidere pe care o citesc la telefon.
 *
 * Fluxul, pe scurt:
 *
 *   lead-uri → loturi de 20, rulate 3 în paralel
 *            → GENERARE  (OpenAI — modelul ales automat)
 *            → VALIDARE  (lib/leads/pitch-validare.js — cifre reale, ton, lungime)
 *            → REPARARE  (o singură rundă, cu motivele respingerii)
 *            → VALIDARE  din nou
 *            → ȘABLON    pentru ce tot n-a trecut
 *
 * Garanția: fiecare lead primește o frază, și nicio frază nu conține o cifră
 * pe care firma nu o are cu adevărat. Prefer un șablon corect unei minciuni
 * elegante — o cifră inventată se simte din prima secundă a apelului.
 *
 * Furnizor: OpenAI, cu OPENAI_API_KEY — exact aceeași cheie folosită deja de
 * Mr. PyWeb. Modelul nu e scris în cod: la prima rulare întrebăm ce modele are
 * cheia și luăm cel mai bun din `modelePreferate` (vezi pitch-openai.js).
 * Fără cheie, totul cade pe șabloane locale — fără API, fără cost.
 */

import { CONFIG } from './config.js'
import { valideazaLot, valideazaPitch } from './pitch-validare.js'
import { cereOpenAI, alegeModel } from './pitch-openai.js'

const P = CONFIG.pitch

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms))

// ============================================================
// PROMPTUL
// ============================================================

const INSTRUCTIUNI = `Ești asistentul unui om care vinde servicii de creare de site-uri web firmelor mici din Republica Moldova. El sună clienții personal, la telefon, și citește cu voce tare exact ce scrii tu.

Pentru fiecare firmă din listă scrii O SINGURĂ frază de deschidere, în română.

## REGULI ABSOLUTE

1. Maximum 25 de cuvinte. O singură frază.
2. Folosești DOAR cifrele primite în datele firmei. Nu rotunjești, nu estimezi, nu inventezi. Dacă ratingul e 4,2 scrii 4,2 — niciodată "aproape 5" sau "peste 4". O cifră greșită distruge apelul din prima secundă.
3. Menționezi cel puțin un detaliu real și verificabil: ratingul, numărul de recenzii sau orașul.
4. Spui CONCRET ce e în neregulă cu prezența lor online, folosind câmpul "problema".
5. Începi cu "Bună ziua," și continui natural.
6. Scrii cu diacritice corecte (ă, â, î, ș, ț).

## TON

Vorbește ca un om normal care a observat ceva, nu ca un agent de vânzări.
Ești constatator, nu entuziast. Spui ce ai văzut, atât.

INTERZIS: "stimate domn", "stimată doamnă", superlative ("cel mai bun", "extraordinar"), semne de exclamare, emoji, prețuri, reduceri, cuvântul "gratuit", promisiuni de tipul "garantez".

## EXEMPLE BUNE

Firmă fără site, 4,8 stele, 340 recenzii, Orhei:
"Bună ziua, am văzut că aveți 4,8 stele din 340 de recenzii în Orhei, dar când vă caut pe Google nu găsesc niciun site."

Firmă cu site mort, status 502:
"Bună ziua, aveți pagină de Facebook, dar site-ul din Google Maps dă eroare de câteva luni bune."

Firmă cu certificat expirat în 2023, 4,5 stele:
"Bună ziua, aveți 4,5 stele pe Google, dar site-ul vă apare ca nesigur — certificatul a expirat în 2023."

Firmă cu site nemobil, 120 recenzii, Bălți:
"Bună ziua, aveți 120 de recenzii în Bălți, dar site-ul dumneavoastră nu se vede cum trebuie pe telefon."

## EXEMPLE GRESITE (nu scrie asa)

"Bună ziua! Aveți cel mai bun restaurant din Chișinău!" — superlativ, exclamare, nespecific.
"Bună ziua, aveți aproape 5 stele și sute de recenzii." — cifre rotunjite, deci inventate.
"Bună ziua, vă pot face un site modern la doar 3000 lei." — preț, ofertă, nu constatare.
"Bună ziua, stimate domn, am observat că firma dumneavoastră..." — rigid.

## VARIETATE

Nu formula toate frazele la fel. Alternează construcțiile: uneori începi cu ratingul, alteori cu problema, alteori cu orașul. Frazele identice sună a robot când suni 30 de firme la rând.

## FORMAT

Răspunzi DOAR cu un array JSON, fără text în plus, fără blocuri de cod:
[{"id": "<id-ul primit>", "pitch": "<fraza>"}]
Câte un obiect pentru FIECARE firmă primită, în aceeași ordine.`

/** Rating-ul cu virgulă, cum se scrie în română (4.7 → „4,7") */
function ratingRo(rating) {
  return typeof rating === 'number' ? String(rating).replace('.', ',') : null
}

/** Descrie problema în cuvinte simple, ca să aibă modelul de ce se agăța. */
function descrieProblema(lead) {
  const dupaCalitate = {
    LIPSA: 'nu are niciun site web',
    DOAR_SOCIAL: 'are doar pagină de social media, fără site propriu',
    MORT: `are site în Google Maps, dar nu funcționează (${lead.observatiiSite || 'eroare'})`,
    FARA_HTTPS: `site-ul nu are certificat SSL (${lead.observatiiSite || 'fără https'})`,
    NEADAPTAT_MOBIL: 'site-ul nu se vede corect pe telefon',
    LENT: `site-ul se încarcă greu (${lead.observatiiSite || 'lent'})`,
    OK: 'site-ul funcționează, dar se poate moderniza',
  }
  return dupaCalitate[lead.calitateSite] || 'prezență online slabă'
}

/** Datele minime trimise modelului — fără telefon, fără adresă, nu-i trebuie. */
function pregatesteLead(lead) {
  return {
    id: lead.placeId,
    firma: lead.denumire,
    oras: lead.oras,
    categorie: lead.categoriePrincipala || lead.categorii?.[0] || null,
    rating: ratingRo(lead.rating),
    recenzii: lead.nrRecenzii || 0,
    problema: descrieProblema(lead),
  }
}

// ============================================================
// ȘABLOANE LOCALE (fallback fără API — gratis)
// ============================================================

/**
 * Construiește o frază decentă fără niciun apel de API.
 * Se folosește când nu există nicio cheie, sau când modelul a dat greș.
 */
export function pitchSablon(lead) {
  const r = ratingRo(lead.rating)
  const n = lead.nrRecenzii || 0
  const oras = lead.oras || 'Moldova'

  // Partea cu dovada — doar dacă avem cifre reale. Ținută scurtă, ca fraza
  // întreagă să încapă în 25 de cuvinte fără să fie nevoie s-o tăiem.
  let dovada
  if (r && n >= 10) dovada = `aveți ${r} stele din ${n} recenzii în ${oras}`
  else if (r) dovada = `aveți ${r} stele în ${oras}`
  else if (n >= 10) dovada = `aveți ${n} recenzii în ${oras}`
  else dovada = `v-am găsit pe Google Maps în ${oras}`

  const dupaCalitate = {
    LIPSA: `${dovada}, dar când vă caut pe Google nu găsesc niciun site.`,
    DOAR_SOCIAL: `${dovada}, dar în loc de site aveți doar o pagină de social media.`,
    MORT: `${dovada}, dar site-ul din Google Maps nu se mai deschide deloc.`,
    FARA_HTTPS: `${dovada}, dar site-ul nu are certificat SSL și browserul îl arată ca nesigur.`,
    NEADAPTAT_MOBIL: `${dovada}, dar site-ul nu se vede cum trebuie pe telefon.`,
    LENT: `${dovada}, dar site-ul se încarcă foarte greu, peste trei secunde.`,
    OK: `${dovada} și un site care merge, dar arată destul de învechit.`,
  }

  const fraza = dupaCalitate[lead.calitateSite] || `${dovada}, dar prezența online lasă de dorit.`
  return taieLaCuvinte(`Bună ziua, ${fraza}`, P.maxCuvinte)
}

/**
 * Taie fraza la maximum `max` cuvinte.
 *
 * Tăierea brutală poate lăsa fraza suspendată („...nu răspunde în."), ceea ce
 * sună prost citit cu voce tare. Așa că retezăm până la ultima pauză naturală
 * (virgulă, liniuță) și abia dacă nu găsim niciuna tăiem pur și simplu.
 */
function taieLaCuvinte(text, max) {
  const curat = text.trim()
  const cuvinte = curat.split(/\s+/)
  if (cuvinte.length <= max) return curat

  const scurtat = cuvinte.slice(0, max).join(' ')

  const pauza = Math.max(scurtat.lastIndexOf(','), scurtat.lastIndexOf(' — '))
  if (pauza > scurtat.length * 0.5) {
    return scurtat.slice(0, pauza).replace(/[\s,;:—-]+$/, '') + '.'
  }

  return scurtat.replace(/[\s,;:—-]+$/, '') + '.'
}

// ============================================================
// APELURI CĂTRE MODEL
// ============================================================

/** Extrage array-ul JSON dintr-un răspuns care poate avea text în jur. */
function extrageJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {}

  // Uneori modelul împachetează răspunsul în ```json ... ```
  const faraGarduri = text.replace(/```(?:json)?/gi, '')
  try {
    return JSON.parse(faraGarduri)
  } catch {}

  const inceput = faraGarduri.indexOf('[')
  const sfarsit = faraGarduri.lastIndexOf(']')
  if (inceput === -1 || sfarsit <= inceput) return null
  try {
    return JSON.parse(faraGarduri.slice(inceput, sfarsit + 1))
  } catch {
    return null
  }
}

/**
 * Trimite un lot la OpenAI, cu reîncercări la erori trecătoare (429, 5xx,
 * rețea). Erorile definitive — cheie greșită, model inexistent — nu se
 * reîncearcă, n-are rost să lovim de trei ori în același zid.
 */
async function trimiteLot(continut) {
  const reincercari = P.reincercari ?? 3
  let ultimaEroare = null

  for (let incercare = 1; incercare <= reincercari; incercare++) {
    try {
      return await cereOpenAI({ instructiuni: INSTRUCTIUNI, continut })
    } catch (err) {
      const status = err.status ?? err.response?.status
      const trecatoare = !status || status === 429 || status >= 500
      if (!trecatoare) throw err

      ultimaEroare = err
      if (incercare < reincercari) await asteapta(1000 * Math.pow(2, incercare - 1))
    }
  }

  throw ultimaEroare || new Error('Lot eșuat din motive necunoscute')
}

/**
 * Transformă răspunsul modelului într-o hartă placeId → pitch.
 * Exportată ca s-o pot testa cu răspunsuri urâte (vezi scripts/pitch-test.mjs).
 */
export function harteazaRaspuns(text) {
  const pitchuri = new Map()
  const parsate = extrageJson(text)
  if (!Array.isArray(parsate)) return null

  for (const element of parsate) {
    if (element?.id && typeof element.pitch === 'string' && element.pitch.trim()) {
      pitchuri.set(String(element.id), element.pitch.trim())
    }
  }
  return pitchuri
}

/** Rulează sarcini cu cel mult `limita` în paralel. */
async function inParalel(sarcini, limita) {
  const rezultate = []
  let index = 0

  async function lucrator() {
    while (index < sarcini.length) {
      const i = index++
      rezultate[i] = await sarcini[i]()
    }
  }

  await Promise.all(Array.from({ length: Math.min(limita, sarcini.length) }, lucrator))
  return rezultate
}

/**
 * Ce furnizor avem la dispoziție.
 *
 * Modelul concret se află abia la primul apel (întrebăm /v1/models), așa că
 * aici întoarcem lista de preferințe — suficient pentru afișaj.
 */
export function furnizorPitch() {
  if (process.env.OPENAI_API_KEY) {
    return {
      nume: 'openai',
      model: (P.modelePreferate || []).join(' → ') || P.modelRezerva,
    }
  }
  return { nume: 'sabloane', model: 'local' }
}

/** Modelul chiar ales pentru rularea curentă (după interogarea /v1/models). */
export async function modelCurent() {
  if (!process.env.OPENAI_API_KEY) return null
  return alegeModel()
}

// ============================================================
// GENERAREA
// ============================================================

/**
 * Generează pitch-urile pentru o listă de lead-uri.
 *
 * Nu aruncă niciodată: orice lead iese cu o frază, în cel mai rău caz șablonul
 * local. Mai bine o frază corectă și banală decât o celulă goală — sau, și mai
 * rău, o cifră inventată citită la telefon.
 *
 * @returns {Promise<{
 *   pitchuri: Map<string,string>, cost: number, furnizor: string,
 *   erori: string[], statistici: object
 * }>}
 */
export async function genereazaPitchuri(leaduri, { onProgres, termen } = {}) {
  const erori = []
  const statistici = {
    total: leaduri.length,
    dinModel: 0,
    dupaReparare: 0,
    dinSablon: 0,
    respinse: [],
    model: null,
    costNecunoscut: false, // true dacă modelul ales nu are preț în config
  }
  let cost = 0

  const furnizor = furnizorPitch()

  // Fără cheie → direct șabloane, fără să pierdem vremea.
  if (furnizor.nume === 'sabloane') {
    const pitchuri = new Map()
    for (const lead of leaduri) pitchuri.set(lead.placeId, pitchSablon(lead))
    statistici.dinSablon = leaduri.length
    return { pitchuri, cost: 0, furnizor: 'sabloane', erori: [], statistici }
  }

  // ── 1. GENERAREA — loturi de 20, câteva în paralel ────────────────
  const marime = P.marimeLot
  const loturi = []
  for (let i = 0; i < leaduri.length; i += marime) {
    loturi.push(leaduri.slice(i, i + marime))
  }

  let gata = 0
  const brute = new Map()

  const rezultate = await inParalel(
    loturi.map((lot, idx) => async () => {
      try {
        const rezultat = await trimiteLot(JSON.stringify(lot.map(pregatesteLead), null, 1))
        const harta = harteazaRaspuns(rezultat.text)
        if (!harta) erori.push(`lot ${idx + 1}: răspuns neparsabil`)
        return { cost: rezultat.cost, harta }
      } catch (err) {
        erori.push(`lot ${idx + 1}: ${err.message?.slice(0, 150)}`)
        return { cost: 0, harta: null }
      } finally {
        gata += lot.length
        onProgres?.(Math.min(gata, leaduri.length), leaduri.length)
      }
    }),
    P.loturiParalele ?? 3
  )

  for (const r of rezultate) {
    if (r.cost === null) statistici.costNecunoscut = true
    else cost += r.cost || 0
    if (r.model) statistici.model = r.model
    if (r.harta) for (const [id, pitch] of r.harta) brute.set(id, pitch)
  }

  // ── 2. VALIDAREA — cifrele trebuie să fie reale ───────────────────
  const { bune, deReparat } = valideazaLot(brute, leaduri, { maxCuvinte: P.maxCuvinte })
  const pitchuri = new Map(bune)
  statistici.dinModel = bune.size

  // ── 3. REPARAREA — o singură rundă, cu motivele respingerii ───────
  const maiEsteTimp = !termen || !termen.expirat()

  if (deReparat.length && P.repararePitchuriProaste !== false && maiEsteTimp) {
    const reparate = await reparaLot(deReparat, erori)
    if (reparate.cost === null) statistici.costNecunoscut = true
    else cost += reparate.cost || 0

    const { bune: buneDupaReparare } = valideazaLot(
      reparate.pitchuri,
      deReparat.map((d) => d.lead),
      { maxCuvinte: P.maxCuvinte }
    )

    for (const [id, pitch] of buneDupaReparare) {
      pitchuri.set(id, pitch)
      statistici.dupaReparare++
    }
  }

  if (deReparat.length && !maiEsteTimp) {
    erori.push('reparare sărită — pasul era pe terminate (se folosesc șabloanele)')
  }

  // ── 4. ȘABLONUL — pentru tot ce n-a trecut ────────────────────────
  for (const { lead, motive } of deReparat) {
    if (!pitchuri.has(lead.placeId)) {
      pitchuri.set(lead.placeId, pitchSablon(lead))
      statistici.dinSablon++
      statistici.respinse.push({ firma: lead.denumire, motive })
    }
  }

  // Plasă finală: absolut fiecare lead iese cu o frază.
  for (const lead of leaduri) {
    if (!pitchuri.has(lead.placeId)) {
      pitchuri.set(lead.placeId, pitchSablon(lead))
      statistici.dinSablon++
    }
  }

  return { pitchuri, cost, furnizor: furnizor.nume, erori, statistici }
}

/**
 * Runda de reparare: retrimitem doar frazele respinse, împreună cu motivul
 * exact pentru care au picat. Modelul corectează mult mai bine când i se spune
 * ce a greșit decât dacă i-am cere pur și simplu „încă o dată".
 */
async function reparaLot(deReparat, erori) {
  const pitchuri = new Map()
  let cost = 0

  const marime = P.marimeLot
  const loturi = []
  for (let i = 0; i < deReparat.length; i += marime) {
    loturi.push(deReparat.slice(i, i + marime))
  }

  const rezultate = await inParalel(
    loturi.map((lot, idx) => async () => {
      const continut = JSON.stringify(
        lot.map(({ lead, pitch, motive }) => ({
          ...pregatesteLead(lead),
          fraza_respinsa: pitch,
          de_ce_a_fost_respinsa: motive,
        })),
        null,
        1
      )

      const cerere =
        `Frazele de mai jos au fost RESPINSE la verificare. Pentru fiecare firmă scrie o frază nouă, ` +
        `corectând exact problema din "de_ce_a_fost_respinsa". Folosește DOAR cifrele din datele firmei ` +
        `(rating, recenzii) — dacă nu ești sigur pe o cifră, nu o pune deloc și menționează doar orașul.\n\n` +
        continut

      try {
        const rezultat = await trimiteLot(cerere)
        const harta = harteazaRaspuns(rezultat.text)
        if (harta) for (const [id, p] of harta) pitchuri.set(id, p)
        else erori.push(`reparare lot ${idx + 1}: răspuns neparsabil`)
        return rezultat.cost
      } catch (err) {
        erori.push(`reparare lot ${idx + 1}: ${err.message?.slice(0, 150)}`)
        return 0
      }
    }),
    P.loturiParalele ?? 3
  )

  let costNecunoscut = false
  for (const c of rezultate) {
    if (c === null) costNecunoscut = true
    else cost += c || 0
  }

  return { pitchuri, cost: costNecunoscut ? null : cost }
}

// Reexportăm validatorul, ca restul aplicației să aibă un singur punct de intrare.
export { valideazaPitch, valideazaLot }
