/**
 * Validarea pitch-urilor generate de AI.
 *
 * De ce există fișierul ăsta: fraza asta o citesc unui om REAL la telefon.
 * Dacă modelul inventează „aveți 4,9 stele" când firma are 4,2, sună ca un
 * escroc și pierd clientul din prima propoziție. Un model ieftin, cu
 * temperatură, inventează cifre din când în când — deci nu am încredere în el,
 * îl verific.
 *
 * Regula de bază: ORICE cifră din pitch trebuie să existe în datele reale ale
 * firmei. Dacă nu există, pitch-ul e respins — se repară sau se pune șablonul.
 *
 * Tot ce e aici e pur (fără rețea), deci se poate testa fără nicio cheie API:
 *   node scripts/pitch-test.mjs
 */

/** Fraze care sună a agent de vânzări sau a promisiune pe care nu o pot ține. */
const FRAZE_INTERZISE = [
  // „stimat", „stimate", „stimată", „stimimați"... — prindem toată familia
  { tipar: /\bstimat\w*/i, motiv: 'formulă rigidă („stimate/stimată")' },
  { tipar: /\bdomn\w*|\bdoamn\w*/i, motiv: 'adresare rigidă („domnule/doamnă")' },
  { tipar: /cel mai (bun|bine|ieftin)|cea mai bun[ăa]/i, motiv: 'superlativ' },
  { tipar: /extraordinar|senzațional|fantastic|incredibil|uimitor/i, motiv: 'superlativ' },
  { tipar: /\bgratuit\b|\bgratis\b|\breducere\b|\bofert[ăa]\b|\bpromoți[ei]/i, motiv: 'promisiune comercială' },
  { tipar: /\d+\s*(lei|euro|€|\$|mdl)/i, motiv: 'menționează preț' },
  { tipar: /garantez|vă asigur că|100%/i, motiv: 'promisiune pe care nu o pot ține' },
  { tipar: /!/, motiv: 'semn de exclamare' },
  { tipar: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, motiv: 'emoji' },
  { tipar: /\[|\]|\{|\}|<|>/, motiv: 'text-șablon necompletat' },
  { tipar: /\bXX+\b|\bN\/A\b|\bnull\b|\bundefined\b/i, motiv: 'valoare lipsă în text' },
]

/**
 * Toate cifrele pe care modelul are voie să le folosească pentru firma asta.
 * Orice altceva înseamnă că le-a inventat.
 */
function cifrePermise(lead) {
  const permise = new Set()

  // Ratingul, în ambele scrieri (4.7 și 4,7) — plus fără zecimala inutilă
  if (typeof lead.rating === 'number') {
    const cuPunct = String(lead.rating)
    permise.add(cuPunct)
    permise.add(cuPunct.replace('.', ','))
    if (Number.isInteger(lead.rating)) permise.add(`${lead.rating},0`)
  }

  // Numărul de recenzii
  if (lead.nrRecenzii) permise.add(String(lead.nrRecenzii))

  // Cifrele din observație: „status 502", „certificat expirat în 2023",
  // „se încarcă în 4.2s" — sunt fapte reale, verificate de noi.
  for (const potrivire of String(lead.observatiiSite || '').matchAll(/\d+(?:[.,]\d+)?/g)) {
    permise.add(potrivire[0])
    permise.add(potrivire[0].replace('.', ','))
    permise.add(potrivire[0].replace(',', '.'))
  }

  return permise
}

/** Scoate cifrele dintr-un text, ca simboluri comparabile („4,7", „312"). */
function cifreDinText(text) {
  return [...text.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => m[0])
}

/**
 * Verifică un pitch generat.
 *
 * @param {string} pitch
 * @param {object} lead        firma, cu datele reale
 * @param {object} optiuni
 * @param {number} optiuni.maxCuvinte
 * @param {Set<string>} [optiuni.pitchuriDejaFolosite]  ca să prind duplicatele din lot
 * @returns {{ valid: boolean, motive: string[] }}
 */
export function valideazaPitch(pitch, lead, { maxCuvinte = 25, pitchuriDejaFolosite } = {}) {
  const motive = []

  if (!pitch || typeof pitch !== 'string' || !pitch.trim()) {
    return { valid: false, motive: ['pitch gol'] }
  }

  const text = pitch.trim()

  // ── Lungimea ──────────────────────────────────────────────────────
  const cuvinte = text.split(/\s+/).length
  if (cuvinte > maxCuvinte) {
    motive.push(`${cuvinte} cuvinte (maximum ${maxCuvinte})`)
  }

  // O singură frază: tolerăm punctul final, dar nu un al doilea enunț lung.
  const enunturi = text.split(/[.?]\s+/).filter((f) => f.trim().length > 15)
  if (enunturi.length > 1) {
    motive.push('mai multe fraze (trebuie una singură)')
  }

  // ── Tonul ─────────────────────────────────────────────────────────
  for (const { tipar, motiv } of FRAZE_INTERZISE) {
    if (tipar.test(text)) motive.push(motiv)
  }

  // ── Cifre inventate — verificarea cea mai importantă ──────────────
  const permise = cifrePermise(lead)
  const inventate = cifreDinText(text).filter((c) => !permise.has(c))
  if (inventate.length) {
    motive.push(`cifre care nu există în datele firmei: ${inventate.join(', ')}`)
  }

  // ── Trebuie să conțină un detaliu real și verificabil ─────────────
  const areCifraReala = cifreDinText(text).some((c) => permise.has(c))
  const areOrasul = Boolean(lead.oras && text.toLowerCase().includes(lead.oras.toLowerCase()))
  if (!areCifraReala && !areOrasul) {
    motive.push('nu menționează niciun detaliu verificabil (rating, recenzii sau oraș)')
  }

  // ── Duplicat în același lot ───────────────────────────────────────
  const normalizat = text.toLowerCase().replace(/\s+/g, ' ')
  if (pitchuriDejaFolosite?.has(normalizat)) {
    motive.push('identic cu alt pitch din lot')
  }

  return { valid: motive.length === 0, motive }
}

/**
 * Validează un lot întreg și separă ce e bun de ce trebuie reparat.
 *
 * @returns {{ bune: Map<string,string>, deReparat: Array<{ lead, pitch, motive }> }}
 */
export function valideazaLot(pitchuri, leaduri, { maxCuvinte = 25 } = {}) {
  const bune = new Map()
  const deReparat = []
  const folosite = new Set()

  for (const lead of leaduri) {
    const pitch = pitchuri.get(lead.placeId)
    const { valid, motive } = valideazaPitch(pitch, lead, {
      maxCuvinte,
      pitchuriDejaFolosite: folosite,
    })

    if (valid) {
      bune.set(lead.placeId, pitch.trim())
      folosite.add(pitch.trim().toLowerCase().replace(/\s+/g, ' '))
    } else {
      deReparat.push({ lead, pitch: pitch || '', motive })
    }
  }

  return { bune, deReparat }
}
