/**
 * Validarea a ce scrii de mână înainte de o căutare plătită.
 *
 * O interogare Google costă bani chiar dacă nu găsește nimic. Așa că nu
 * lăsăm să plece „magazin de haine în Chisinua" sau „firme bune în Londra":
 *
 *   orașe și țări → OpenStreetMap (Nominatim), gratuit. Întoarce și numele
 *                   corect („iasi" → „Iași"), ca lead-urile să nu se împartă
 *                   pe două scrieri ale aceluiași oraș.
 *   categorii     → modelul OpenAI deja conectat: e un tip real de firmă?
 *                   cum se caută în limba țării? ce tip de loc Google are?
 *                   Fără cheie OpenAI, rămâne o verificare de bun-simț.
 */

import { TARI, GRUPURI_CATEGORII, TIPURI_GOOGLE, getTara } from './config.js'
import { cereOpenAI } from './pitch-openai.js'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
// Nominatim cere un User-Agent care identifică aplicația
const UA = 'PyWebAcademy-Leaduri/1.0 (+https://pyweb.online)'

// Rezultatele nu se schimbă — le ținem minte cât trăiește funcția
const cache = new Map()

/** „Chișinău" → „chisinau": fără diacritice, litere mici, spații simple. */
export function normalizeaza(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** Distanța de editare — pentru „poate ai vrut să scrii...". */
function distanta(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }
  return d[a.length][b.length]
}

/** Cele mai apropiate variante din listă, pentru greșeli de scriere. */
function celeMaiApropiate(text, lista, cate = 3) {
  const t = normalizeaza(text)
  return lista
    .map((x) => ({ x, d: distanta(t, normalizeaza(x)) }))
    .filter(({ x, d }) => d <= Math.max(2, Math.floor(normalizeaza(x).length / 3)))
    .sort((a, b) => a.d - b.d)
    .slice(0, cate)
    .map(({ x }) => x)
}

async function cautaNominatim(parametri) {
  const cheie = JSON.stringify(parametri)
  if (cache.has(cheie)) return cache.get(cheie)

  const url = `${NOMINATIM}?${new URLSearchParams({ format: 'jsonv2', addressdetails: '1', ...parametri })}`
  const raspuns = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
  if (!raspuns.ok) throw new Error(`OpenStreetMap a răspuns ${raspuns.status}`)

  const date = await raspuns.json()
  cache.set(cheie, date)
  return date
}

/** Steagul din codul țării: „RO" → 🇷🇴 */
export function steagDinCod(cod) {
  if (!/^[A-Z]{2}$/.test(cod || '')) return '🏳️'
  return String.fromCodePoint(...[...cod].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

// Limba interogărilor pentru țările care nu sunt în config. Google înțelege
// engleza peste tot, deci restul merg pe engleză.
const LIMBI = {
  AT: 'de', CH: 'de', BE: 'fr', LU: 'fr', NL: 'nl', PT: 'pt', BR: 'pt', PL: 'pl', CZ: 'cs',
  UA: 'uk', RU: 'ru', TR: 'tr', GR: 'el', BG: 'bg', HU: 'hu', SE: 'sv', NO: 'no', DK: 'da',
  FI: 'fi', MX: 'es', AR: 'es', CO: 'es', CL: 'es',
}

// ============================================================
// ȚARĂ
// ============================================================

/**
 * @returns {Promise<{ valid: boolean, tara?: object, mesaj?: string }>}
 */
export async function valideazaTara(text) {
  const curat = String(text || '').trim()
  if (curat.length < 2 || curat.length > 60) {
    return { valid: false, mesaj: 'Scrie numele țării (ex: Polonia, Canada)' }
  }

  // Țările din config, după nume sau cod
  const n = normalizeaza(curat)
  const cunoscuta = TARI.find((t) => normalizeaza(t.nume) === n || t.cod.toLowerCase() === n)
  if (cunoscuta) return { valid: true, tara: cunoscuta }

  const rezultate = await cautaNominatim({ q: curat, featureType: 'country', limit: '1', 'accept-language': 'ro,en' })
  const r = rezultate?.[0]
  const cod = r?.address?.country_code?.toUpperCase()
  if (!r || !cod || !['country', 'state'].includes(r.addresstype || r.type)) {
    return { valid: false, mesaj: `Nu găsesc țara „${curat}"` }
  }

  const dinConfig = getTara(cod)
  if (dinConfig) return { valid: true, tara: dinConfig }

  return {
    valid: true,
    tara: {
      cod,
      nume: r.name || r.address?.country || curat,
      steag: steagDinCod(cod),
      limba: LIMBI[cod] || 'en',
      prefix: null,
      orase: [],
      oraseImplicite: [],
      personalizata: true,
    },
  }
}

// ============================================================
// ORAȘ
// ============================================================

const TIPURI_LOCALITATE = new Set([
  'city', 'town', 'village', 'municipality', 'borough', 'suburb', 'city_district', 'hamlet',
])

/**
 * Verifică dacă orașul există în țara aleasă și îi întoarce numele corect.
 *
 * @param {string} text
 * @param {{ cod: string, limba?: string, orase?: string[] }} tara
 */
export async function valideazaOras(text, tara) {
  const curat = String(text || '').trim()
  if (curat.length < 2 || curat.length > 80) {
    return { valid: false, mesaj: 'Scrie numele orașului' }
  }
  if (!/^[A-Z]{2}$/.test(tara?.cod || '')) {
    return { valid: false, mesaj: 'Alege întâi țara' }
  }

  // Orașele din config sunt deja corecte — fără apel
  const predefinite = tara.orase || getTara(tara.cod)?.orase || []
  const exact = predefinite.find((o) => normalizeaza(o) === normalizeaza(curat))
  if (exact) return { valid: true, nume: exact }

  const limba = tara.limba === 'ro' ? 'ro' : `${tara.limba || 'en'},en`
  const rezultate = await cautaNominatim({
    q: curat,
    countrycodes: tara.cod.toLowerCase(),
    limit: '8',
    'accept-language': limba,
  })

  const localitati = (rezultate || []).filter(
    (r) => TIPURI_LOCALITATE.has(r.addresstype) || (r.category === 'place' && TIPURI_LOCALITATE.has(r.type))
  )

  if (!localitati.length) {
    const sugestii = celeMaiApropiate(curat, predefinite)
    return {
      valid: false,
      mesaj: `Nu găsesc „${curat}" în ${tara.nume || tara.cod}`,
      sugestii,
    }
  }

  // Preferăm orașele mari: un „Bălți" sat nu bate „Bălți" municipiu
  const ordine = ['city', 'municipality', 'town', 'borough', 'city_district', 'suburb', 'village', 'hamlet']
  localitati.sort(
    (a, b) =>
      ordine.indexOf(a.addresstype) - ordine.indexOf(b.addresstype) ||
      (b.importance || 0) - (a.importance || 0)
  )
  const ales = localitati[0]

  // Dacă locul găsit e unul din orașele din listă („Greater London" → „London"),
  // folosim scrierea din listă — altfel lead-urile s-ar împărți pe două nume.
  const numeGasit = normalizeaza(ales.name || ales.address?.city || '')
  const dinLista = predefinite.find((p) => {
    const np = normalizeaza(p)
    return numeGasit === np || numeGasit.endsWith(` ${np}`) || numeGasit.startsWith(`${np} `)
  })
  const nume = dinLista || ales.name || curat

  return {
    valid: true,
    nume,
    detaliu: ales.display_name,
    // Un sat cu numele scris înseamnă de obicei puține firme — merită spus
    avertisment: ['village', 'hamlet'].includes(ales.addresstype)
      ? `„${nume}" e un sat — probabil găsești puține firme`
      : null,
  }
}

// ============================================================
// CATEGORIE
// ============================================================

const CATEGORII_PREDEFINITE = GRUPURI_CATEGORII.flatMap((g) => g.categorii)

const INSTRUCTIUNI_CATEGORIE = `Validezi termeni de căutare pentru Google Maps. Cu ei găsim firme mici cărora să le vindem servicii (site-uri, marketing).

Primești un termen scris de un om și țara în care căutăm. Răspunzi DOAR cu un obiect JSON, fără alt text:
{
  "valid": true sau false,
  "motiv": "de ce nu e valid, pe scurt, în română (gol dacă e valid)",
  "ro": "numele categoriei în română, curat, cu diacritice, litere mici, la singular (ex: magazin de rochii de mireasă)",
  "query": "termenul exact de căutat pe Google Maps în țara dată: în română pentru Moldova și România, în engleză pentru orice altă țară",
  "tip": "un singur tip din LISTA DE TIPURI care descrie exact categoria, sau null",
  "strict": true doar dacă tipul descrie exact și complet categoria (ex: magazin de pantofi → shoe_store), altfel false,
  "avertisment": "o observație utilă dacă termenul e prea larg sau ciudat, altfel null",
  "sugestii": ["până la 3 categorii mai bune, în română, dacă termenul nu e valid sau e prea vag"]
}

Termenul NU e valid dacă:
- nu e un tip de firmă / organizație care apare pe Google Maps (text fără sens, un nume de persoană, un adjectiv singur);
- e prea vag ca să aducă firme de același fel („firme", „afaceri", „servicii", „orice", „magazine bune");
- e numele unei singure firme sau mărci („Zara", „McDonald's") — atunci sugerează categoria (magazin de haine, fast-food);
- e ilegal sau pentru adulți.
Termenii vagi dar folosibili („magazin", „școală") sunt valizi, cu un avertisment și sugestii mai precise.
Nu inventa tipuri: "tip" e null dacă niciun tip din listă nu se potrivește exact.`

function extrageJson(text) {
  const start = text.indexOf('{')
  const sfarsit = text.lastIndexOf('}')
  if (start < 0 || sfarsit <= start) return null
  try {
    return JSON.parse(text.slice(start, sfarsit + 1))
  } catch {
    return null
  }
}

const taie = (v, max) => String(v || '').trim().slice(0, max)

// Cuvinte care singure nu descriu un tip de firmă
const VAGI = new Set([
  'firma', 'firme', 'firmă', 'afaceri', 'afacere', 'companii', 'companie', 'business', 'businesses',
  'company', 'companies', 'servicii', 'services', 'orice', 'toate', 'diverse', 'altele', 'lucruri',
])

// Adjective care nu fac dintr-un cuvânt vag o categorie („firme bune")
const ADJECTIVE_VAGI = new Set([
  'bune', 'bun', 'mici', 'mari', 'diverse', 'noi', 'locale', 'multe', 'frumoase', 'profitabile',
  'good', 'best', 'top', 'small', 'local', 'new', 'various',
])

/** Un cuvânt care arată a tastatură apăsată la întâmplare („asdfgh", „qwrtzx"). */
function pareFaraSens(cuvant) {
  const c = normalizeaza(cuvant)
  if (c.length < 4) return false
  if (/[^aeiouys]{5,}/.test(c)) return true // 5 consoane la rând
  if (/(asdf|qwer|zxcv|sdfg|dfgh|fghj|hjkl|wert|erty|yxcv)/.test(c)) return true
  const vocale = (c.match(/[aeiouy]/g) || []).length
  return vocale / c.length < 0.2
}

/** Verificarea de bun-simț, când n-avem AI. */
function valideazaFaraAI(curat) {
  const cuvinte = normalizeaza(curat).split(' ').filter(Boolean)

  if (cuvinte.some(pareFaraSens)) {
    return { valid: false, mesaj: 'Termenul nu pare un cuvânt real', sugestii: celeMaiApropiate(curat, CATEGORII_PREDEFINITE.map((c) => c.ro)) }
  }
  // „firme", „firme bune", „servicii diverse" — prea vag ca să aducă firme de același fel
  if (VAGI.has(cuvinte[0]) && cuvinte.slice(1).every((w) => VAGI.has(w) || ADJECTIVE_VAGI.has(w))) {
    return {
      valid: false,
      mesaj: 'Prea vag — scrie ce fel de firme (ex: magazin de haine, școală de dans)',
      sugestii: [],
    }
  }

  if (/https?:|www\.|@|\.(md|ro|com)\b/i.test(curat)) {
    return { valid: false, mesaj: 'Scrie un tip de firmă, nu un link sau o adresă' }
  }
  if (!/\p{L}{3,}/u.test(curat)) {
    return { valid: false, mesaj: 'Termenul trebuie să conțină cel puțin un cuvânt' }
  }
  if (curat.split(/\s+/).length > 8) {
    return { valid: false, mesaj: 'Termenul e prea lung — scrie doar tipul de firmă' }
  }
  const ro = curat.toLowerCase()
  return {
    valid: true,
    categorie: { ro, query: ro, tip: null, strict: false, proprie: true },
    avertisment: 'Verificat doar de bază (fără cheie OpenAI) — asigură-te că e un tip real de firmă',
  }
}

/**
 * @param {string} text
 * @param {{ cod: string, nume?: string, limba?: string }} tara
 */
export async function valideazaCategorie(text, tara) {
  const curat = String(text || '').trim().replace(/\s+/g, ' ')
  if (curat.length < 3 || curat.length > 60) {
    return { valid: false, mesaj: 'Scrie tipul de firmă (3–60 de caractere)' }
  }

  // Există deja în listă? Atunci n-are rost să întrebăm pe nimeni.
  const existenta = CATEGORII_PREDEFINITE.find(
    (c) => normalizeaza(c.ro) === normalizeaza(curat) || normalizeaza(c.en) === normalizeaza(curat)
  )
  if (existenta) {
    return { valid: true, categorie: { ...existenta }, existaDeja: true }
  }

  if (!process.env.OPENAI_API_KEY) return valideazaFaraAI(curat)

  const limba = tara?.limba === 'ro' ? 'română' : 'engleză'
  const continut =
    `Țara: ${tara?.nume || tara?.cod || 'Moldova'} (${tara?.cod || 'MD'}) — interogarea se scrie în ${limba}.\n` +
    `Termenul scris: "${curat}"\n\n` +
    `LISTA DE TIPURI: ${TIPURI_GOOGLE.join(', ')}`

  let raspuns
  try {
    raspuns = await cereOpenAI({ instructiuni: INSTRUCTIUNI_CATEGORIE, continut, maxTokeni: 600 })
  } catch {
    // AI-ul nu răspunde — nu blocăm omul, cădem pe verificarea simplă
    return valideazaFaraAI(curat)
  }

  const j = extrageJson(raspuns.text)
  if (!j) return valideazaFaraAI(curat)

  const sugestii = (Array.isArray(j.sugestii) ? j.sugestii : []).map((s) => taie(s, 60)).filter(Boolean).slice(0, 3)

  if (!j.valid) {
    return { valid: false, mesaj: taie(j.motiv, 200) || 'Nu pare un tip de firmă', sugestii }
  }

  const ro = taie(j.ro, 60).toLowerCase() || curat.toLowerCase()
  const tip = TIPURI_GOOGLE.includes(j.tip) ? j.tip : null

  return {
    valid: true,
    categorie: {
      ro,
      query: taie(j.query, 80) || ro,
      tip,
      strict: Boolean(j.strict && tip),
      proprie: true,
    },
    avertisment: j.avertisment ? taie(j.avertisment, 200) : null,
    sugestii,
  }
}
