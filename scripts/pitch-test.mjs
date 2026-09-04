/**
 * Test pentru validatorul de pitch-uri.
 *
 * Rulează fără nicio cheie API și fără rețea — verifică logica de respingere:
 * cifre inventate, ton de agent de vânzări, fraze prea lungi, duplicate.
 *
 *   node scripts/pitch-test.mjs
 *
 * Dacă modifici regulile din lib/leads/pitch-validare.js, rulează asta.
 */

import { valideazaPitch, valideazaLot } from '../lib/leads/pitch-validare.js'
import { pitchSablon, harteazaRaspuns } from '../lib/leads/pitch.js'

// Firma de referință: 4,2 stele, 41 de recenzii, site mort cu status 502.
const FIRMA = {
  placeId: 'X1',
  denumire: 'Pizzeria Test',
  oras: 'Chișinău',
  rating: 4.2,
  nrRecenzii: 41,
  calitateSite: 'MORT',
  observatiiSite: 'status 502',
}

const CAZURI = [
  // ── Trebuie ACCEPTATE ────────────────────────────────────────────
  {
    trebuieValid: true,
    descriere: 'cifre corecte, ton bun',
    pitch: 'Bună ziua, aveți 4,2 stele din 41 de recenzii în Chișinău, dar site-ul din Google Maps dă eroare.',
  },
  {
    trebuieValid: true,
    descriere: 'foloseste cifra din observatie (502)',
    pitch: 'Bună ziua, site-ul dumneavoastră întoarce eroarea 502 de ceva vreme, deși aveți 41 de recenzii.',
  },
  {
    trebuieValid: true,
    descriere: 'doar orasul, fara cifre',
    pitch: 'Bună ziua, v-am găsit pe Google Maps în Chișinău, dar site-ul din listare nu se deschide.',
  },
  {
    trebuieValid: true,
    descriere: 'rating scris cu punct',
    pitch: 'Bună ziua, aveți 4.2 stele în Chișinău, dar site-ul nu funcționează.',
  },

  // ── Trebuie RESPINSE ─────────────────────────────────────────────
  {
    trebuieValid: false,
    descriere: 'RATING INVENTAT (4,9 in loc de 4,2)',
    pitch: 'Bună ziua, aveți 4,9 stele în Chișinău, dar site-ul nu merge.',
  },
  {
    trebuieValid: false,
    descriere: 'NUMAR RECENZII INVENTAT (300 in loc de 41)',
    pitch: 'Bună ziua, aveți 300 de recenzii în Chișinău, dar site-ul nu merge.',
  },
  {
    trebuieValid: false,
    descriere: 'ROTUNJIRE („peste 40" — tot inventare)',
    pitch: 'Bună ziua, aveți peste 40 de recenzii în Chișinău, dar site-ul nu merge.',
  },
  {
    trebuieValid: false,
    descriere: 'superlativ + exclamare',
    pitch: 'Bună ziua, aveți cel mai bun restaurant din Chișinău!',
  },
  {
    trebuieValid: false,
    descriere: 'mentioneaza pret',
    pitch: 'Bună ziua, vă pot face un site modern la doar 3000 lei, aveți 41 de recenzii.',
  },
  {
    trebuieValid: false,
    descriere: 'adresare rigida',
    pitch: 'Bună ziua, stimate domn, am observat că aveți 41 de recenzii în Chișinău.',
  },
  {
    trebuieValid: false,
    descriere: 'prea lung (peste 25 de cuvinte)',
    pitch:
      'Bună ziua, am văzut că aveți 4,2 stele din 41 de recenzii în Chișinău și mă gândeam că poate ' +
      'ar fi util să discutăm puțin despre cum ar putea arăta un site nou pentru afacerea dumneavoastră.',
  },
  {
    trebuieValid: false,
    descriere: 'sablon necompletat',
    pitch: 'Bună ziua, aveți [RATING] stele în Chișinău, dar site-ul nu merge.',
  },
  {
    trebuieValid: false,
    descriere: 'emoji',
    pitch: 'Bună ziua, aveți 4,2 stele în Chișinău 🎉 dar site-ul nu merge.',
  },
  {
    trebuieValid: false,
    descriere: 'gol',
    pitch: '',
  },
  {
    trebuieValid: false,
    descriere: 'niciun detaliu verificabil',
    pitch: 'Bună ziua, am observat că site-ul dumneavoastră ar putea fi îmbunătățit semnificativ.',
  },
]

let treceri = 0
let caderi = 0

console.log('')
console.log('─'.repeat(78))
console.log('  TEST VALIDATOR PITCH — firma: 4,2 stele | 41 recenzii | status 502 | Chișinău')
console.log('─'.repeat(78))
console.log('')

for (const caz of CAZURI) {
  const { valid, motive } = valideazaPitch(caz.pitch, FIRMA, { maxCuvinte: 25 })
  const corect = valid === caz.trebuieValid

  if (corect) treceri++
  else caderi++

  const semn = corect ? '✓' : '✗ TEST PICAT'
  const verdict = valid ? 'ACCEPTAT' : 'RESPINS '
  console.log(`  ${semn}  ${verdict}  ${caz.descriere}`)
  if (!valid) console.log(`              motiv: ${motive.join('; ')}`)
  if (!corect) console.log(`              AȘTEPTAM: ${caz.trebuieValid ? 'ACCEPTAT' : 'RESPINS'}`)
}

// ── Duplicatele din același lot ──────────────────────────────────────
console.log('')
console.log('─'.repeat(78))
console.log('  TEST DUPLICATE ÎN LOT')
console.log('─'.repeat(78))

const acelasiPitch = 'Bună ziua, aveți 41 de recenzii în Chișinău, dar site-ul nu se deschide.'
const leaduriLot = [
  { ...FIRMA, placeId: 'A' },
  { ...FIRMA, placeId: 'B' },
]
const brute = new Map([
  ['A', acelasiPitch],
  ['B', acelasiPitch],
])

const { bune, deReparat } = valideazaLot(brute, leaduriLot, { maxCuvinte: 25 })
const duplicatPrins = bune.size === 1 && deReparat.length === 1
console.log(`  ${duplicatPrins ? '✓' : '✗ TEST PICAT'}  primul acceptat, al doilea respins ca duplicat`)
if (duplicatPrins) treceri++
else caderi++

// ── Șabloanele locale trebuie să treacă propria validare ─────────────
console.log('')
console.log('─'.repeat(78))
console.log('  TEST ȘABLOANE LOCALE (fallback-ul trebuie să fie el însuși valid)')
console.log('─'.repeat(78))

const CALITATI = ['LIPSA', 'DOAR_SOCIAL', 'MORT', 'FARA_HTTPS', 'NEADAPTAT_MOBIL', 'LENT', 'OK']
for (const calitate of CALITATI) {
  const lead = { ...FIRMA, calitateSite: calitate, observatiiSite: 'status 502' }
  const pitch = pitchSablon(lead)
  const { valid, motive } = valideazaPitch(pitch, lead, { maxCuvinte: 25 })

  if (valid) treceri++
  else caderi++

  console.log(`  ${valid ? '✓' : '✗ TEST PICAT'}  ${calitate.padEnd(16)} ${pitch}`)
  if (!valid) console.log(`              motiv: ${motive.join('; ')}`)
}

// Șablon pentru o firmă fără rating și fără recenzii
const leadGol = { ...FIRMA, rating: null, nrRecenzii: 0, calitateSite: 'LIPSA', observatiiSite: null }
const pitchGol = pitchSablon(leadGol)
const rezGol = valideazaPitch(pitchGol, leadGol, { maxCuvinte: 25 })
console.log(`  ${rezGol.valid ? '✓' : '✗ TEST PICAT'}  fără rating/recenzii  ${pitchGol}`)
rezGol.valid ? treceri++ : caderi++

// ── Parsarea răspunsului modelului ───────────────────────────────────
// Modelele strică formatul exact în felurile de mai jos. Toate trebuie
// digerate, pentru că un lot neparsabil ar trimite 20 de lead-uri pe șablon.
console.log('')
console.log('─'.repeat(78))
console.log('  TEST PARSARE RĂSPUNS MODEL (formate urâte, dar recuperabile)')
console.log('─'.repeat(78))

const RASPUNSURI = [
  {
    descriere: 'JSON curat',
    text: '[{"id":"A","pitch":"Bună ziua, test unu."}]',
    asteptat: 1,
  },
  {
    descriere: 'împachetat în ```json',
    text: '```json\n[{"id":"A","pitch":"Bună ziua, test unu."}]\n```',
    asteptat: 1,
  },
  {
    descriere: 'cu vorbărie înainte și după',
    text: 'Sigur! Iată frazele:\n[{"id":"A","pitch":"Bună ziua, test."}]\nSper că ajută.',
    asteptat: 1,
  },
  {
    descriere: 'mai multe elemente',
    text: '[{"id":"A","pitch":"Unu."},{"id":"B","pitch":"Doi."},{"id":"C","pitch":"Trei."}]',
    asteptat: 3,
  },
  {
    descriere: 'element fără pitch — se ignoră doar el',
    text: '[{"id":"A","pitch":"Unu."},{"id":"B"},{"id":"C","pitch":"Trei."}]',
    asteptat: 2,
  },
  {
    descriere: 'pitch gol — se ignoră',
    text: '[{"id":"A","pitch":"   "},{"id":"B","pitch":"Doi."}]',
    asteptat: 1,
  },
  { descriere: 'JSON rupt de tot', text: 'îmi pare rău, nu pot', asteptat: null },
  { descriere: 'text gol', text: '', asteptat: null },
]

for (const caz of RASPUNSURI) {
  const harta = harteazaRaspuns(caz.text)
  const marime = harta ? harta.size : null
  const corect = marime === caz.asteptat

  if (corect) treceri++
  else caderi++

  console.log(
    `  ${corect ? '✓' : '✗ TEST PICAT'}  ${String(marime).padEnd(4)} pitch-uri  ${caz.descriere}`
  )
  if (!corect) console.log(`              AȘTEPTAM: ${caz.asteptat}`)
}

console.log('')
console.log('─'.repeat(78))
console.log(`  REZULTAT: ${treceri} trecute, ${caderi} picate`)
console.log('─'.repeat(78))
console.log('')

process.exit(caderi > 0 ? 1 : 0)
