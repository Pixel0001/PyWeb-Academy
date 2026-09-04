/**
 * Client pentru Google Places API (New) — DOAR endpointul Text Search.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  REGULĂ DE COST — NU O ÎNCĂLCA                                       │
 * │                                                                      │
 * │  NU apelăm NICIODATĂ Place Details (places/{id}).                    │
 * │  Toate câmpurile de care avem nevoie vin direct din Text Search,     │
 * │  prin FieldMask-ul de mai jos.                                       │
 * │                                                                      │
 * │  Text Search se facturează PER APEL (~0,035 $), nu per rezultat,     │
 * │  iar un apel întoarce până la 20 de firme complete. Un apel de       │
 * │  Place Details pentru fiecare firmă ar înmulți costul cu 20.         │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { CONFIG } from './config.js'

const URL_TEXT_SEARCH = 'https://places.googleapis.com/v1/places:searchText'

// Exact câmpurile de care avem nevoie. Fiecare câmp în plus costă mai mult,
// fiecare câmp lipsă ar însemna un apel de Place Details — deci nici mai mult, nici mai puțin.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.internationalPhoneNumber',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.primaryTypeDisplayName',
  'places.businessStatus',
  'places.googleMapsUri',
  'nextPageToken',
].join(',')

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Un singur apel Text Search (= o singură unitate facturabilă).
 * Reîncearcă de `reincercari` ori, cu pauză crescătoare, la erori de rețea / 429 / 5xx.
 *
 * @returns {Promise<{ places: object[], nextPageToken: string|null }>}
 */
async function apelTextSearch({ textQuery, pageToken = null, apiKey, semnal }) {
  const { reincercari, pauzaInitialaMs, languageCode, regionCode, pageSize } = CONFIG.cautare

  const corp = {
    textQuery,
    languageCode,
    regionCode,
    pageSize,
  }
  // La paginare, restul parametrilor trebuie să rămână identici.
  if (pageToken) corp.pageToken = pageToken

  let ultimaEroare = null

  for (let incercare = 1; incercare <= reincercari; incercare++) {
    try {
      const raspuns = await fetch(URL_TEXT_SEARCH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(corp),
        signal: semnal,
      })

      // 429 / 5xx → merită reîncercat. 4xx (în afară de 429) → eroare definitivă.
      if (!raspuns.ok) {
        const text = await raspuns.text().catch(() => '')
        const eroare = new Error(`Places ${raspuns.status}: ${text.slice(0, 300)}`)
        eroare.status = raspuns.status

        const meritaReincercat = raspuns.status === 429 || raspuns.status >= 500
        if (!meritaReincercat) throw eroare

        ultimaEroare = eroare
      } else {
        const date = await raspuns.json()
        return {
          places: date.places || [],
          nextPageToken: date.nextPageToken || null,
        }
      }
    } catch (err) {
      // Eroare definitivă (4xx) — nu mai reîncercăm.
      if (err.status && err.status !== 429 && err.status < 500) throw err
      if (err.name === 'AbortError') throw err
      ultimaEroare = err
    }

    // Pauză crescătoare: 1s, 2s, 4s...
    if (incercare < reincercari) {
      await asteapta(pauzaInitialaMs * Math.pow(2, incercare - 1))
    }
  }

  throw ultimaEroare || new Error('Places: eșec necunoscut')
}

/**
 * Rulează o interogare completă, cu paginare (max `paginiMax` pagini = max 60 firme).
 *
 * @param {object} p
 * @param {string} p.textQuery      ex. „restaurant în Chișinău"
 * @param {string} p.apiKey
 * @param {number} [p.apeluriRamase] plafonul de apeluri rămase în rulare — ne oprim dacă îl atingem
 * @returns {Promise<{ places: object[], apeluri: number, pagini: number, opritDeLimita: boolean }>}
 */
export async function cautaFirme({ textQuery, apiKey, apeluriRamase = Infinity, semnal }) {
  const paginiMax = CONFIG.cautare.paginiMax

  const toate = []
  let pageToken = null
  let apeluri = 0
  let pagini = 0
  let opritDeLimita = false

  for (let pagina = 0; pagina < paginiMax; pagina++) {
    if (apeluri >= apeluriRamase) {
      opritDeLimita = true
      break
    }

    const rezultat = await apelTextSearch({ textQuery, pageToken, apiKey, semnal })
    apeluri++
    pagini++
    toate.push(...rezultat.places)

    if (!rezultat.nextPageToken) break
    pageToken = rezultat.nextPageToken
  }

  return { places: toate, apeluri, pagini, opritDeLimita }
}

/**
 * Transformă un rezultat brut Places într-un lead, cu câmpurile care ne interesează.
 * Nu face niciun apel suplimentar — totul vine din răspunsul Text Search.
 */
export function mapeazaFirma(place, { oras, categorie }) {
  const telefon = place.internationalPhoneNumber || null

  return {
    placeId: place.id,
    denumire: place.displayName?.text || '(fără nume)',
    telefon: telefon ? normalizeazaTelefon(telefon) : null,
    telefonLocal: place.nationalPhoneNumber || null,
    adresa: place.formattedAddress || null,
    oras,
    categorii: [categorie],
    categoriePrincipala: place.primaryTypeDisplayName?.text || categorie,
    rating: typeof place.rating === 'number' ? place.rating : null,
    nrRecenzii: place.userRatingCount || 0,
    siteUrl: place.websiteUri || null,
    linkMaps: place.googleMapsUri || null,
    businessStatus: place.businessStatus || null,
  }
}

/**
 * Normalizează telefonul la format internațional (+373...).
 * Google întoarce de obicei „+373 22 123 456" — scoatem spațiile și cratimele.
 */
export function normalizeazaTelefon(telefon) {
  if (!telefon) return null
  const curat = telefon.replace(/[\s\-().]/g, '')
  return curat.startsWith('+') ? curat : `+${curat}`
}
