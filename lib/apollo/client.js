/**
 * Clientul HTTP pentru Apollo.io.
 *
 * Un singur loc care știe de autentificare, reîncercări și traducerea erorilor
 * în ceva citibil. Restul modulelor din lib/apollo/ doar cheamă `apollo()`.
 *
 * Cheia: APOLLO_API_KEY din variabilele de mediu.
 * Documentație: https://docs.apollo.io/reference/apollo-api
 */

import fs from 'fs'
import path from 'path'

const BAZA = 'https://api.apollo.io/api/v1'

/** Setările din config/apollo.json (citite de pe disc, ca la leaduri). */
function incarcaConfig() {
  const cale = path.join(process.cwd(), 'config', 'apollo.json')
  return JSON.parse(fs.readFileSync(cale, 'utf8'))
}

export const CONFIG = incarcaConfig()

const asteapta = (ms) => new Promise((r) => setTimeout(r, ms))

/** Avem cheie configurată? */
export function areCheie() {
  return Boolean(process.env.APOLLO_API_KEY)
}

/**
 * Traduce o eroare Apollo în ceva ce înțelege omul din fața ecranului.
 */
function explicaEroare(status, corp) {
  const mesajApollo =
    corp?.error_message || corp?.error || (typeof corp === 'string' ? corp.slice(0, 200) : '')

  const dupaStatus = {
    401: 'Cheia Apollo e invalidă sau a fost revocată.',
    403: 'Planul tău Apollo nu permite acest lucru (sau lipsește un master API key).',
    404: 'Resursa nu există în Apollo.',
    422: `Apollo a respins cererea: ${mesajApollo || 'parametri invalizi'}`,
    429: 'Ai depășit limita de cereri Apollo. Încearcă peste un minut.',
  }

  return dupaStatus[status] || `Apollo ${status}${mesajApollo ? `: ${mesajApollo}` : ''}`
}

/**
 * Apel către Apollo, cu reîncercări la erori trecătoare (429, 5xx, rețea).
 *
 * @param {string} cale       ex. '/mixed_people/api_search'
 * @param {object} optiuni
 * @param {string} [optiuni.metoda]  GET (implicit) sau POST
 * @param {object} [optiuni.corp]    trimis ca JSON
 * @param {object} [optiuni.query]   parametri de query string
 */
export async function apollo(cale, { metoda = 'GET', corp, query } = {}) {
  const cheie = process.env.APOLLO_API_KEY
  if (!cheie) throw new Error('APOLLO_API_KEY lipsește din variabilele de mediu')

  let url = `${BAZA}${cale}`

  if (query) {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue
      // Apollo așteaptă listele ca `param[]=a&param[]=b`
      if (Array.isArray(v)) {
        for (const el of v) p.append(`${k}[]`, String(el))
      } else {
        p.append(k, String(v))
      }
    }
    const qs = p.toString()
    if (qs) url += `?${qs}`
  }

  const reincercari = CONFIG.cautare.reincercari ?? 3
  let ultimaEroare = null

  for (let incercare = 1; incercare <= reincercari; incercare++) {
    let raspuns
    try {
      raspuns = await fetch(url, {
        method: metoda,
        headers: {
          'x-api-key': cheie,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        ...(corp ? { body: JSON.stringify(corp) } : {}),
      })
    } catch (err) {
      // Rețeaua a picat — merită reîncercat.
      ultimaEroare = new Error(`Apollo inaccesibil: ${err.message}`)
      if (incercare < reincercari) await asteapta(1000 * Math.pow(2, incercare - 1))
      continue
    }

    const text = await raspuns.text()
    let date = null
    try {
      date = text ? JSON.parse(text) : null
    } catch {
      date = text
    }

    if (raspuns.ok) return date

    const trecatoare = raspuns.status === 429 || raspuns.status >= 500
    const eroare = new Error(explicaEroare(raspuns.status, date))
    eroare.status = raspuns.status

    if (!trecatoare) throw eroare

    ultimaEroare = eroare
    if (incercare < reincercari) await asteapta(1000 * Math.pow(2, incercare - 1))
  }

  throw ultimaEroare || new Error('Apollo: eșec necunoscut')
}

/** Verifică rapid dacă cheia e validă. Nu consumă credite. */
export async function verificaCheia() {
  try {
    const r = await apollo('/auth/health')
    return { valida: Boolean(r?.is_logged_in), detalii: r }
  } catch (err) {
    return { valida: false, eroare: err.message }
  }
}
