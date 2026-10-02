/**
 * Încarcă setările instrumentului de lead-uri din config/leads.json.
 *
 * Tot ce se poate schimba fără să umbli în cod stă în acel fișier:
 * orașe, categorii, praguri de scor, limite de buget, reguli de verificare.
 *
 * Citim fișierul de pe disc (nu prin `import ... .json`) ca să meargă identic
 * și în Next.js, și în scriptul de test din linia de comandă. Ca să ajungă
 * fișierul în bundle-ul de producție, e listat în `outputFileTracingIncludes`
 * din next.config.mjs.
 */

import fs from 'fs'
import path from 'path'

function incarcaConfig() {
  const caleConfig = path.join(process.cwd(), 'config', 'leads.json')
  return JSON.parse(fs.readFileSync(caleConfig, 'utf8'))
}

/** Setările brute din config/leads.json */
export const CONFIG = incarcaConfig()

/** Orașele active (cele pe care le căutăm implicit) */
export const ORASE = CONFIG.orase

/** Orașele disponibile dar dezactivate — pot fi bifate din interfață */
export const ORASE_INACTIVE = CONFIG.oraseInactive || []

/** Toate orașele pe care le poate alege utilizatorul din interfață */
export const TOATE_ORASELE = [...ORASE, ...ORASE_INACTIVE]

/** Categoriile de afaceri căutate */
export const CATEGORII = CONFIG.categorii

/** Valorile posibile pentru coloana CALITATE_SITE, în ordinea priorității */
export const CALITATI_SITE = [
  'LIPSA',
  'DOAR_SOCIAL',
  'MORT',
  'FARA_HTTPS',
  'NEADAPTAT_MOBIL',
  'LENT',
  'NECLAR',
  'OK',
]

/** Valorile posibile pentru coloana STATUS (le completez eu, manual) */
export const STATUSURI_LEAD = ['DE_SUNAT', 'SUNAT', 'INTERESAT', 'REFUZ', 'NU_MA_SUNA']

// ============================================================
// ȚĂRI ȘI CATEGORII
// ============================================================

/** Țările din config, cu orașele lor. Moldova e prima și implicită. */
export const TARI = CONFIG.tari || [
  { cod: 'MD', nume: 'Moldova', steag: '🇲🇩', limba: 'ro', prefix: '373', orase: TOATE_ORASELE, oraseImplicite: ORASE },
]

export const TARA_IMPLICITA = TARI[0]

/** Țara după cod; o țară scrisă de mână (validată) vine ca obiect complet. */
export function getTara(cod) {
  return TARI.find((t) => t.cod === cod) || null
}

/** Categoriile pe grupe, din config. */
export const GRUPURI_CATEGORII = CONFIG.grupuriCategorii || [
  { grup: 'Toate', emoji: '📋', categorii: CATEGORII.map((ro) => ({ ro, en: ro })) },
]

const CATEGORII_DUPA_NUME = new Map(
  GRUPURI_CATEGORII.flatMap((g) => g.categorii.map((c) => [c.ro, c]))
)

/** Definiția unei categorii predefinite, după numele ei în română. */
export function getCategorie(ro) {
  return CATEGORII_DUPA_NUME.get(ro) || null
}

/**
 * Tipurile de loc Google (Table A) pe care le acceptăm la categoriile scrise
 * de mână. Un tip greșit ar face Google să respingă cererea — așa că AI-ul
 * poate alege doar din lista asta.
 */
export const TIPURI_GOOGLE = [
  ...new Set([
    ...GRUPURI_CATEGORII.flatMap((g) => g.categorii.map((c) => c.tip).filter(Boolean)),
    'store', 'shopping_mall', 'department_store', 'supermarket', 'convenience_store',
    'school', 'primary_school', 'secondary_school', 'preschool', 'university',
    'doctor', 'pharmacy', 'physiotherapist', 'hospital',
    'meal_takeaway', 'meal_delivery', 'night_club',
    'insurance_agency', 'bank', 'storage', 'locksmith', 'roofing_contractor', 'painter',
    'laundry', 'funeral_home', 'art_gallery', 'museum', 'tourist_attraction',
  ]),
]

/** Interogarea propriu-zisă: „magazin de haine în Iași" / „clothing store in London". */
function textInterogare(termen, oras, limba) {
  return limba === 'ro' ? `${termen} în ${oras}` : `${termen} in ${oras}`
}

/**
 * Produsul cartezian CATEGORII × ORAȘE → lista de interogări.
 *
 * O categorie poate fi numele unei categorii predefinite („magazin de haine")
 * sau un obiect validat, scris de mână: { ro, query, tip, strict }.
 *
 * În Moldova interogarea rămâne exact ca înainte („restaurant în Chișinău"),
 * ca rulările vechi să rămână în cache.
 *
 * @returns {{ q, oras, categorie, tara, limba, tip, strict }[]}
 */
export function construiesteInterogari(orase = ORASE, categorii = CATEGORII, tara = TARA_IMPLICITA) {
  const limba = tara?.limba || 'ro'
  const lista = []

  for (const oras of orase) {
    for (const c of categorii) {
      const def = typeof c === 'string' ? getCategorie(c) || { ro: c, en: c } : c
      const termen = def.query || (limba === 'ro' ? def.ro : def.en || def.ro)

      lista.push({
        q: textInterogare(termen, oras, limba),
        oras,
        categorie: def.ro,
        tara: tara?.cod || 'MD',
        limba,
        tip: TIPURI_GOOGLE.includes(def.tip) ? def.tip : null,
        strict: Boolean(def.strict && def.tip),
      })
    }
  }
  return lista
}

/**
 * Estimează costul unei rulări ÎNAINTE de a o porni.
 * Text Search se facturează per APEL (nu per rezultat), iar un apel
 * întoarce până la 20 de firme. Maximum 3 pagini per interogare.
 */
export function estimeazaCost(nrInterogari) {
  const paginiMax = CONFIG.cautare.paginiMax
  const costPerApel = CONFIG.buget.costPerApelUsd

  return {
    interogari: nrInterogari,
    apeluriMin: nrInterogari, // dacă fiecare interogare are o singură pagină
    apeluriMax: nrInterogari * paginiMax,
    costMinUsd: +(nrInterogari * costPerApel).toFixed(2),
    costMaxUsd: +(nrInterogari * paginiMax * costPerApel).toFixed(2),
    depasesteLimita: nrInterogari * paginiMax > CONFIG.buget.maxApeluriPeRulare,
    limita: CONFIG.buget.maxApeluriPeRulare,
  }
}
