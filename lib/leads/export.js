/**
 * Generarea fișierelor de ieșire: leaduri.xlsx și leaduri.csv (identic, ca rezervă).
 *
 * CSV-ul e scris pentru Excel pe setări românești:
 *  - UTF-8 CU BOM, ca diacriticele să se vadă corect;
 *  - separator punct și virgulă (;);
 *  - zecimale cu virgulă (4,7 — nu 4.7).
 *
 * Coloanele 15–17 (STATUS, DATA_APEL, NOTITE) rămân goale — le completează
 * omul în timpul apelurilor.
 */

import ExcelJS from 'exceljs'
import { sorteazaDupaScor } from './scoring.js'

/** Antetul, exact în ordinea cerută. */
export const COLOANE = [
  { cheie: 'scor', antet: 'SCOR', latime: 8 },
  { cheie: 'denumire', antet: 'DENUMIRE', latime: 32 },
  { cheie: 'telefon', antet: 'TELEFON', latime: 16 },
  { cheie: 'areSite', antet: 'ARE_SITE', latime: 10 },
  { cheie: 'calitateSite', antet: 'CALITATE_SITE', latime: 17 },
  { cheie: 'siteUrl', antet: 'SITE_URL', latime: 34 },
  { cheie: 'observatiiSite', antet: 'OBSERVATII_SITE', latime: 42 },
  { cheie: 'rating', antet: 'RATING', latime: 9 },
  { cheie: 'nrRecenzii', antet: 'NR_RECENZII', latime: 13 },
  { cheie: 'categorie', antet: 'CATEGORIE', latime: 22 },
  { cheie: 'oras', antet: 'ORAS', latime: 14 },
  { cheie: 'adresa', antet: 'ADRESA', latime: 40 },
  { cheie: 'linkMaps', antet: 'LINK_MAPS', latime: 30 },
  { cheie: 'pitch', antet: 'PITCH', latime: 60 },
  { cheie: 'status', antet: 'STATUS', latime: 14 },
  { cheie: 'dataApel', antet: 'DATA_APEL', latime: 13 },
  { cheie: 'notite', antet: 'NOTITE', latime: 30 },
  { cheie: 'placeId', antet: 'PLACE_ID', latime: 30 },
]

/** Data în format românesc (zz.ll.aaaa) sau gol. */
function dataRo(valoare) {
  if (!valoare) return ''
  const d = new Date(valoare)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

/**
 * Transformă un lead din baza de date în rândul de export.
 * STATUS / DATA_APEL / NOTITE sunt goale la prima generare, dar dacă le-am
 * completat deja în CRM, le păstrăm — ca să nu-mi pierd munca la re-export.
 */
export function randDinLead(lead) {
  return {
    scor: lead.scor ?? 0,
    denumire: lead.denumire || '',
    telefon: lead.telefon || lead.telefonLocal || '',
    areSite: lead.siteUrl ? 'DA' : 'NU',
    calitateSite: lead.calitateSite || '',
    siteUrl: lead.siteUrl || '',
    observatiiSite: lead.observatiiSite || '',
    rating: typeof lead.rating === 'number' ? lead.rating : null,
    nrRecenzii: lead.nrRecenzii ?? 0,
    categorie: lead.categoriePrincipala || lead.categorii?.[0] || '',
    oras: lead.oras || '',
    adresa: lead.adresa || '',
    linkMaps: lead.linkMaps || '',
    pitch: lead.pitch || '',
    // Coloanele mele de lucru — goale până le completez eu
    status: lead.status && lead.status !== 'DE_SUNAT' ? lead.status : '',
    dataApel: dataRo(lead.dataApel),
    notite: lead.notite || '',
    placeId: lead.placeId || '',
  }
}

// ============================================================
// EXCEL
// ============================================================

/**
 * Construiește leaduri.xlsx.
 *
 * Formatare:
 *  - antet îngroșat și înghețat;
 *  - SCOR colorat gradient: verde peste 70, galben 40–70, gri sub 40;
 *  - filtre automate pe toate coloanele;
 *  - lățimi potrivite conținutului.
 *
 * @returns {Promise<Buffer>}
 */
export async function construiesteXlsx(leaduri) {
  const randuri = sorteazaDupaScor(leaduri).map(randDinLead)

  const registru = new ExcelJS.Workbook()
  registru.creator = 'PyWeb — instrument lead-uri'
  registru.created = new Date()

  const foaie = registru.addWorksheet('Leaduri', {
    views: [{ state: 'frozen', ySplit: 1 }], // antetul rămâne vizibil la scroll
  })

  foaie.columns = COLOANE.map((c) => ({ header: c.antet, key: c.cheie, width: c.latime }))

  // ── Antet îngroșat ────────────────────────────────────────────────
  const antet = foaie.getRow(1)
  antet.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  antet.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
  antet.alignment = { vertical: 'middle', horizontal: 'left' }
  antet.height = 22

  // ── Rândurile ─────────────────────────────────────────────────────
  for (const rand of randuri) {
    foaie.addRow(rand)
  }

  // ── Formatare pe coloane ──────────────────────────────────────────
  const colScor = foaie.getColumn('scor')
  const colRating = foaie.getColumn('rating')

  colScor.alignment = { horizontal: 'center' }
  colScor.font = { bold: true }
  // Rating cu o zecimală — pe setări românești Excel îl afișează „4,7"
  colRating.numFmt = '0.0'
  colRating.alignment = { horizontal: 'center' }
  foaie.getColumn('nrRecenzii').alignment = { horizontal: 'center' }
  foaie.getColumn('pitch').alignment = { wrapText: true, vertical: 'top' }
  foaie.getColumn('observatiiSite').alignment = { wrapText: true, vertical: 'top' }

  // ── SCOR colorat: verde > 70, galben 40–70, gri < 40 ──────────────
  for (let i = 2; i <= randuri.length + 1; i++) {
    const celula = foaie.getRow(i).getCell('scor')
    const scor = celula.value ?? 0

    let fundal, text
    if (scor > 70) {
      fundal = 'FF16A34A' // verde — sună-l primul
      text = 'FFFFFFFF'
    } else if (scor >= 40) {
      fundal = 'FFFACC15' // galben — merită un telefon
      text = 'FF422006'
    } else {
      fundal = 'FFE5E7EB' // gri — prioritate mică
      text = 'FF6B7280'
    }

    celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fundal } }
    celula.font = { bold: true, color: { argb: text } }
  }

  // ── Filtre automate pe toate coloanele ────────────────────────────
  foaie.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(randuri.length + 1, 2), column: COLOANE.length },
  }

  const buffer = await registru.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

// ============================================================
// CSV
// ============================================================

/** Pune ghilimele doar unde e nevoie (separator, ghilimele, rând nou). */
function celulaCsv(valoare) {
  if (valoare === null || valoare === undefined) return ''
  const text = String(valoare)
  if (/[;"\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/**
 * Construiește leaduri.csv — identic cu Excel-ul, ca rezervă.
 * UTF-8 cu BOM + separator „;" + zecimale cu virgulă.
 *
 * @returns {Buffer}
 */
export function construiesteCsv(leaduri) {
  const randuri = sorteazaDupaScor(leaduri).map(randDinLead)

  const linii = [COLOANE.map((c) => c.antet).join(';')]

  for (const rand of randuri) {
    const celule = COLOANE.map((c) => {
      let valoare = rand[c.cheie]
      // Rating cu virgulă zecimală, cum se așteaptă Excel-ul românesc
      if (c.cheie === 'rating' && typeof valoare === 'number') {
        valoare = String(valoare).replace('.', ',')
      }
      return celulaCsv(valoare)
    })
    linii.push(celule.join(';'))
  }

  // BOM-ul e obligatoriu, altfel Excel strică diacriticele
  return Buffer.from('﻿' + linii.join('\r\n'), 'utf8')
}
