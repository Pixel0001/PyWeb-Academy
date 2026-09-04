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
  'OK',
]

/** Valorile posibile pentru coloana STATUS (le completez eu, manual) */
export const STATUSURI_LEAD = ['DE_SUNAT', 'SUNAT', 'INTERESAT', 'REFUZ', 'NU_MA_SUNA']

/**
 * Produsul cartezian CATEGORII × ORAȘE → lista de interogări.
 * Fiecare interogare devine un `textQuery` de forma „restaurant în Chișinău".
 *
 * @param {string[]} orase
 * @param {string[]} categorii
 * @returns {{ q: string, oras: string, categorie: string }[]}
 */
export function construiesteInterogari(orase = ORASE, categorii = CATEGORII) {
  const lista = []
  for (const oras of orase) {
    for (const categorie of categorii) {
      lista.push({
        q: `${categorie} în ${oras}`,
        oras,
        categorie,
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
