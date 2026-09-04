/**
 * Scorul de lead (0–100).
 *
 *   scor = puncte_site + puncte_rating + puncte_recenzii
 *
 * Ideea din spate: clientul ideal e firma care MERGE BINE (rating mare, multe
 * recenzii) dar are prezența online proastă. Are și bani, și motiv să asculte.
 *
 * Pragurile stau în config/leads.json → le poți schimba fără să umbli aici.
 */

import { CONFIG } from './config.js'

const S = CONFIG.scor

/** Puncte pentru calitatea site-ului: LIPSA 50 … OK 0 */
export function punctesite(calitateSite) {
  return S.puncteSite[calitateSite] ?? 0
}

/** Puncte pentru rating: >=4,5 → 30 | 4,0–4,49 → 20 | 3,5–3,99 → 10 | sub 3,5 sau lipsă → 0 */
export function puncteRating(rating) {
  if (typeof rating !== 'number' || Number.isNaN(rating)) return 0
  for (const prag of S.puncteRating) {
    if (rating >= prag.min) return prag.puncte
  }
  return 0
}

/** Puncte pentru numărul de recenzii: >=100 → 20 | 30–99 → 15 | 10–29 → 8 | sub 10 → 0 */
export function puncteRecenzii(nrRecenzii) {
  const n = nrRecenzii || 0
  for (const prag of S.puncteRecenzii) {
    if (n >= prag.min) return prag.puncte
  }
  return 0
}

/**
 * Scorul total al unui lead.
 * @param {{ calitateSite: string, rating: number|null, nrRecenzii: number }} lead
 * @returns {number} 0–100
 */
export function calculeazaScor(lead) {
  return (
    punctesite(lead.calitateSite) + puncteRating(lead.rating) + puncteRecenzii(lead.nrRecenzii)
  )
}

/** Defalcarea scorului — utilă în interfață, ca să văd de ce a ieșit atât. */
export function explicaScor(lead) {
  const site = punctesite(lead.calitateSite)
  const rating = puncteRating(lead.rating)
  const recenzii = puncteRecenzii(lead.nrRecenzii)
  return { site, rating, recenzii, total: site + rating + recenzii }
}

/** Sortare descrescătoare după scor; la egalitate, firma cu mai multe recenzii e mai valoroasă. */
export function sorteazaDupaScor(leaduri) {
  return [...leaduri].sort((a, b) => b.scor - a.scor || (b.nrRecenzii || 0) - (a.nrRecenzii || 0))
}
