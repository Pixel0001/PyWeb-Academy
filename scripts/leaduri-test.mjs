/**
 * Test mic al instrumentului de leaduri — o categorie, un oraș.
 *
 * Rulează întreg lanțul, fără baza de date și fără interfață:
 *   căutare → verificare site → scor → pitch → leaduri.xlsx + leaduri.csv
 *
 * Utilizare:
 *   node scripts/leaduri-test.mjs                          # restaurant în Chișinău
 *   node scripts/leaduri-test.mjs "cafenea" "Bălți"        # altă combinație
 *
 * Dacă GOOGLE_API_KEY nu e setată, scriptul NU inventează firme reale: rulează
 * pe un set de test marcat ca atare, dar verificarea site-urilor, scorul,
 * pitch-ul și fișierele de ieșire sunt cât se poate de reale.
 */

import fs from 'fs'
import path from 'path'
import { CONFIG } from '../lib/leads/config.js'
import { cautaFirme, mapeazaFirma } from '../lib/leads/places.js'
import { verificaSiteuri, esteSocial } from '../lib/leads/site-check.js'
import { calculeazaScor, sorteazaDupaScor } from '../lib/leads/scoring.js'
import { genereazaPitchuri, furnizorPitch } from '../lib/leads/pitch.js'
import { construiesteXlsx, construiesteCsv, randDinLead, COLOANE } from '../lib/leads/export.js'

const categorie = process.argv[2] || 'restaurant'
const oras = process.argv[3] || 'Chișinău'
const textQuery = `${categorie} în ${oras}`

const DOSAR_IESIRE = path.join(process.cwd(), 'exports')

// Set de test, folosit DOAR când nu există cheie Google. Firmele sunt inventate
// (ca să nu pun cifre false în dreptul unor afaceri reale), dar adresele web
// sunt reale — ca verificarea site-ului să fie o verificare adevărată.
const SET_DE_TEST = [
  { nume: 'Restaurant Vatra Nucului [TEST]', site: null, rating: 4.7, recenzii: 312 },
  { nume: 'Pizzeria Bella Verde [TEST]', site: 'https://www.facebook.com/pizzeria', rating: 4.6, recenzii: 148 },
  { nume: 'Cafeneaua Din Colț [TEST]', site: 'https://expired.badssl.com/', rating: 4.8, recenzii: 96 },
  { nume: 'Bistro Central [TEST]', site: 'https://httpbin.org/status/503', rating: 4.4, recenzii: 210 },
  { nume: 'Terasa Codrilor [TEST]', site: 'http://neverssl.com', rating: 4.2, recenzii: 41 },
  { nume: 'Braseria Veche [TEST]', site: 'https://www.google.com', rating: 3.9, recenzii: 27 },
  { nume: 'Han Modern [TEST]', site: 'https://www.wikipedia.org', rating: 4.9, recenzii: 530 },
  { nume: 'Bufetul Mic [TEST]', site: 'https://nu-exista-acest-domeniu-md-999.md', rating: 3.4, recenzii: 8 },
  { nume: 'Cofetăria Fără Telefon [TEST]', site: 'https://www.instagram.com/cofetarie', rating: 4.5, recenzii: 120, faraTelefon: true },
  { nume: 'Chioșc Fără Contact [TEST]', site: null, rating: 4.3, recenzii: 60, faraTelefon: true },
]

function linie() {
  console.log('─'.repeat(78))
}

async function main() {
  console.log('')
  linie()
  console.log(`  TEST INSTRUMENT LEADURI — „${textQuery}"`)
  linie()

  const areCheie = Boolean(process.env.GOOGLE_API_KEY)
  let leaduri = []
  let apeluri = 0

  // ── 1. CĂUTAREA ───────────────────────────────────────────────────
  if (areCheie) {
    console.log('\n[1/4] Caut pe Google Places (Text Search)...')
    const rezultat = await cautaFirme({
      textQuery,
      apiKey: process.env.GOOGLE_API_KEY,
      apeluriRamase: CONFIG.cautare.paginiMax,
    })
    apeluri = rezultat.apeluri

    leaduri = rezultat.places.map((p) => mapeazaFirma(p, { oras, categorie }))
    console.log(`      ${apeluri} apel(uri) API → ${leaduri.length} firme`)
  } else {
    console.log('\n[1/4] GOOGLE_API_KEY lipsește → folosesc setul de test.')
    console.log('      (Restul lanțului rulează în condiții reale.)')
    leaduri = SET_DE_TEST.map((f, i) => ({
      placeId: `TEST_${String(i + 1).padStart(3, '0')}`,
      denumire: f.nume,
      telefon: f.faraTelefon ? null : `+37379${String(100000 + i * 11111).slice(0, 6)}`,
      telefonLocal: null,
      adresa: `str. Exemplu ${i + 1}, ${oras}`,
      oras,
      categorii: [categorie],
      categoriePrincipala: categorie,
      rating: f.rating,
      nrRecenzii: f.recenzii,
      siteUrl: f.site,
      linkMaps: 'https://maps.google.com/?cid=exemplu',
      businessStatus: 'OPERATIONAL',
    }))
    console.log(`      ${leaduri.length} firme de test`)
  }

  // ── FILTRUL DE CONTACT ────────────────────────────────────────────
  // Aceeași regulă ca în rularea din admin: păstrez firma dacă am pe ce s-o
  // contactez — telefon sau, în lipsa lui, o pagină de social.
  if (CONFIG.filtre?.doarCuContact) {
    const inainte = leaduri.length
    leaduri = leaduri.filter((l) => l.telefon || l.telefonLocal || esteSocial(l.siteUrl))

    const doarSocial = leaduri.filter((l) => !l.telefon && !l.telefonLocal).length
    console.log(`      ${inainte - leaduri.length} firme sărite (fără telefon și fără social)`)
    console.log(`      ${doarSocial} firme fără telefon, dar contactabile pe social`)
  }

  if (!leaduri.length) {
    console.log('\nNiciun rezultat. Ies.')
    return
  }

  // ── 2. VERIFICAREA SITE-URILOR ────────────────────────────────────
  console.log(`\n[2/4] Verific ${leaduri.length} site-uri (max ${CONFIG.verificareSite.concurenta} simultan)...`)
  const inceputVerificare = Date.now()

  const rezultateSite = await verificaSiteuri(leaduri, (gata, total) => {
    process.stdout.write(`\r      ${gata}/${total} verificate...`)
  })
  console.log(`\r      ${leaduri.length}/${leaduri.length} verificate în ${((Date.now() - inceputVerificare) / 1000).toFixed(1)}s`)

  for (const lead of leaduri) {
    const r = rezultateSite.get(lead.placeId)
    lead.calitateSite = r.calitate
    lead.observatiiSite = r.observatii
    lead.scor = calculeazaScor(lead)
    lead.status = 'DE_SUNAT'
  }

  // Câte firme din fiecare categorie de calitate
  const peCalitate = {}
  for (const l of leaduri) peCalitate[l.calitateSite] = (peCalitate[l.calitateSite] || 0) + 1
  console.log(
    '      ' +
      Object.entries(peCalitate)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k}: ${v}`)
        .join('  |  ')
  )

  // ── 3. PITCH-URILE ────────────────────────────────────────────────
  const furnizor = furnizorPitch()
  console.log(`\n[3/4] Generez pitch-urile (${furnizor.nume} / ${furnizor.model}), loturi de ${CONFIG.pitch.marimeLot}...`)

  const { pitchuri, cost: costPitch, erori, statistici } = await genereazaPitchuri(leaduri)
  for (const lead of leaduri) {
    lead.pitch = pitchuri.get(lead.placeId) || ''
  }
  console.log(`      ${pitchuri.size} pitch-uri, cost ${costPitch.toFixed(4)} $`)
  console.log(
    `      calitate: ${statistici.dinModel} bune din prima | ` +
      `${statistici.dupaReparare} reparate | ${statistici.dinSablon} din șablon`
  )
  for (const r of (statistici.respinse || []).slice(0, 5)) {
    console.log(`      ↳ respins „${r.firma}": ${r.motive.join('; ')}`)
  }
  for (const e of erori) console.log(`      ⚠ ${e}`)

  // ── 4. FIȘIERELE ──────────────────────────────────────────────────
  console.log('\n[4/4] Scriu fișierele...')
  fs.mkdirSync(DOSAR_IESIRE, { recursive: true })

  const caleXlsx = path.join(DOSAR_IESIRE, 'leaduri.xlsx')
  const caleCsv = path.join(DOSAR_IESIRE, 'leaduri.csv')

  fs.writeFileSync(caleXlsx, await construiesteXlsx(leaduri))
  fs.writeFileSync(caleCsv, construiesteCsv(leaduri))

  console.log(`      ${caleXlsx}  (${(fs.statSync(caleXlsx).size / 1024).toFixed(1)} KB)`)
  console.log(`      ${caleCsv}  (${(fs.statSync(caleCsv).size / 1024).toFixed(1)} KB)`)

  // ── PRIMELE 5 RÂNDURI ─────────────────────────────────────────────
  const sortate = sorteazaDupaScor(leaduri)
  console.log('')
  linie()
  console.log('  PRIMELE 5 RÂNDURI DIN REZULTAT')
  linie()

  for (const [i, lead] of sortate.slice(0, 5).entries()) {
    const r = randDinLead(lead)
    console.log(`\n  ${i + 1}. ${r.denumire}`)
    console.log(`     SCOR ............ ${r.scor}`)
    console.log(`     TELEFON ......... ${r.telefon}`)
    console.log(`     ARE_SITE ........ ${r.areSite}`)
    console.log(`     CALITATE_SITE ... ${r.calitateSite}`)
    console.log(`     SITE_URL ........ ${r.siteUrl || '—'}`)
    console.log(`     OBSERVATII_SITE . ${r.observatiiSite}`)
    console.log(`     RATING .......... ${String(r.rating ?? '—').replace('.', ',')}   NR_RECENZII: ${r.nrRecenzii}`)
    console.log(`     ORAS ............ ${r.oras}`)
    console.log(`     PITCH ........... „${r.pitch}"`)
  }

  // ── REZUMATUL DIN CONSOLĂ ─────────────────────────────────────────
  const faraSite = leaduri.filter((l) => ['LIPSA', 'DOAR_SOCIAL'].includes(l.calitateSite)).length
  console.log('')
  linie()
  console.log('  REZUMAT')
  linie()
  console.log(`  Apeluri API Google ....... ${apeluri}`)
  console.log(`  Cost estimat Google ...... ${(apeluri * CONFIG.buget.costPerApelUsd).toFixed(3)} $`)
  console.log(`  Cost pitch-uri ........... ${costPitch.toFixed(4)} $`)
  console.log(`  Firme unice găsite ....... ${leaduri.length}`)
  console.log(`  Fără site propriu ........ ${faraSite}`)
  console.log(`  Coloane în export ........ ${COLOANE.length}`)
  if (!areCheie) {
    console.log('')
    console.log('  ⚠ Set de test — pentru firme reale setează GOOGLE_API_KEY.')
  }
  console.log('')
}

main().catch((err) => {
  console.error('\n✗ Testul a eșuat:', err)
  process.exit(1)
})
