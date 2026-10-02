/**
 * O firmă = un lead, oricâte locații ar avea.
 *
 * Google Maps întoarce fiecare locație separat: Fornetti apare de 10 ori, cu
 * 10 placeId-uri diferite. Pentru vânzare însă e UN client — suni o dată,
 * vorbești cu un singur om. Aici decidem când două rezultate sunt aceeași
 * firmă și cum le adunăm într-un singur lead, cu toate locațiile în el.
 *
 * Fără dependențe de server — se folosește și la extragere, și la unirea
 * dublurilor deja salvate.
 */

import { esteSocial } from './social.js'

// ============================================================
// CHEILE UNEI FIRME
// ============================================================

/** „+373 79 604 070", „079604070" → „79604070" (ultimele 8 cifre). */
export function cheieTelefon(telefon) {
  const cifre = String(telefon || '').replace(/\D/g, '')
  return cifre.length >= 8 ? cifre.slice(-8) : null
}

// Platforme pe care stau MULTE firme diferite — domeniul lor nu spune nimic
const PLATFORME = [
  'google.com', 'sites.google.com', 'goo.gl', 'g.page', 'maps.app.goo.gl', 'business.site',
  '999.md', 'wa.me', 't.me', 'm.me', 'taplink.cc', 'linktr.ee', 'youtube.com', 'tiktok.com',
  'glovoapp.com', 'wolt.com', 'booking.com', 'tripadvisor.com', 'yelp.com', 'point.md',
  'makler.md', 'wixsite.com', 'blogspot.com', 'wordpress.com', 'tilda.ws', 'webnode.page',
]

/** „https://www.fornetti.md/chisinau" → „fornetti.md". Null pentru social / platforme. */
export function domeniuSite(url) {
  if (!url || esteSocial(url)) return null
  let gazda
  try {
    gazda = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase()
  } catch {
    return null
  }
  gazda = gazda.replace(/^www\d?\./, '').replace(/^m\./, '')
  if (PLATFORME.some((p) => gazda === p || gazda.endsWith(`.${p}`))) return null
  return gazda
}

// Formele juridice nu fac parte din nume: „Fornetti SRL" = „Fornetti"
const FORME_JURIDICE =
  /\b(s ?r ?l|s ?a|i ?i|i ?c ?s|o ?o ?o|ltd|llc|inc|gmbh|plc|co|corp|s ?c|s ?p ?a|s ?l)\b/g

/** „Fornetti S.R.L." → „fornetti". */
export function numeNormalizat(nume) {
  return String(nume || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(FORME_JURIDICE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Primul cuvânt nu identifică firma când e doar tipul ei („Salon Bella", „Farmacia Felicia")
const CUVINTE_GENERICE = new Set([
  'magazin', 'magazinul', 'salon', 'salonul', 'farmacia', 'farmacie', 'cafenea', 'cafeneaua',
  'restaurant', 'restaurantul', 'centrul', 'centru', 'scoala', 'gradinita', 'clinica', 'cabinet',
  'cabinetul', 'atelier', 'atelierul', 'studio', 'studioul', 'casa', 'the', 'la', 'de', 'shop',
  'store', 'cafe', 'bar', 'hotel', 'pizza', 'auto', 'service', 'beauty', 'club', 'academia',
  'liceul', 'firma', 'compania', 'grupul', 'agentia', 'biroul', 'my', 'new', 'best',
])

/** Ce identifică firma în nume: „fornetti botanica" → „fornetti"; „salon bella" → „salon bella". */
function radacinaNume(nume) {
  const cuvinte = nume.split(' ').filter(Boolean)
  if (!cuvinte.length) return ''
  if (CUVINTE_GENERICE.has(cuvinte[0]) || cuvinte[0].length < 3) return cuvinte.slice(0, 2).join(' ')
  return cuvinte[0]
}

/** Tot ce ne trebuie ca să comparăm două firme, calculat o singură dată. */
export function cheiFirma(f) {
  const nume = numeNormalizat(f.denumire)
  return {
    tara: f.tara || 'MD',
    oras: numeNormalizat(f.oras),
    nume,
    radacina: radacinaNume(nume),
    telefon: cheieTelefon(f.telefon) || cheieTelefon(f.telefonLocal),
    domeniu: domeniuSite(f.siteUrl),
  }
}

/**
 * Sunt aceeași firmă?
 *
 *   1. același site propriu (nu Facebook, nu o platformă comună)        → da
 *   2. același nume, în același oraș                                   → da
 *   3. același telefon ȘI nume înrudit („Fornetti" / „Fornetti Botanica") → da
 *
 * Telefonul singur nu ajunge: un mall sau un centru de afaceri poate avea
 * același număr pentru zeci de firme diferite.
 */
export function aceeasiFirma(a, b) {
  if (a.domeniu && a.domeniu === b.domeniu) return true
  if (a.tara !== b.tara) return false
  // Același nume distinctiv în orașe diferite = rețea („Viorica Cosmetic" în Cahul și Chișinău).
  // Nu și pentru nume care încep cu tipul firmei („Salon Bella" e la fel de comun ca „Salon Lux").
  if (a.nume.length >= 6 && a.nume === b.nume && !CUVINTE_GENERICE.has(a.nume.split(' ')[0])) return true
  if (a.nume.length >= 3 && a.nume === b.nume && a.oras && a.oras === b.oras) return true
  if (a.telefon && a.telefon === b.telefon) {
    if (a.nume === b.nume) return true
    if (a.radacina.length >= 3 && a.radacina === b.radacina) return true
    if (a.nume.length >= 4 && b.nume.length >= 4 && (a.nume.includes(b.nume) || b.nume.includes(a.nume))) {
      return true
    }
  }
  return false
}

/**
 * Împarte o listă de firme în grupe — fiecare grupă e o singură firmă.
 * Unirea e tranzitivă: dacă A=B (același site) și B=C (același telefon), A=B=C.
 *
 * @returns {Array<Array<T>>}
 */
export function grupeazaFirme(firme) {
  const chei = firme.map(cheiFirma)
  const parinte = firme.map((_, i) => i)
  const radacina = (i) => (parinte[i] === i ? i : (parinte[i] = radacina(parinte[i])))

  // Comparăm doar ce are măcar o cheie comună — altfel ar fi n² pe mii de firme
  const index = new Map()
  chei.forEach((k, i) => {
    for (const cheie of [
      k.domeniu && `d:${k.domeniu}`,
      k.telefon && `t:${k.telefon}`,
      k.nume && `n:${k.tara}:${k.nume}`,
    ]) {
      if (!cheie) continue
      if (!index.has(cheie)) index.set(cheie, [])
      index.get(cheie).push(i)
    }
  })

  for (const indici of index.values()) {
    for (let x = 0; x < indici.length; x++) {
      for (let y = x + 1; y < indici.length; y++) {
        const i = indici[x]
        const j = indici[y]
        if (radacina(i) !== radacina(j) && aceeasiFirma(chei[i], chei[j])) {
          parinte[radacina(i)] = radacina(j)
        }
      }
    }
  }

  const grupe = new Map()
  firme.forEach((f, i) => {
    const r = radacina(i)
    if (!grupe.has(r)) grupe.set(r, [])
    grupe.get(r).push(f)
  })
  return [...grupe.values()]
}

// ============================================================
// LOCAȚIILE UNUI LEAD
// ============================================================

/** O locație, cum o ținem în lead.locatii. */
export function locatieDin(f) {
  return {
    placeId: f.placeId,
    denumire: f.denumire || null,
    adresa: f.adresa || null,
    oras: f.oras || null,
    telefon: f.telefon || f.telefonLocal || null,
    rating: typeof f.rating === 'number' ? f.rating : null,
    nrRecenzii: f.nrRecenzii || 0,
    linkMaps: f.linkMaps || null,
  }
}

/** Locațiile unui lead — cele vechi, dintr-o singură locație, n-au lista scrisă. */
export function locatiileLui(lead) {
  if (Array.isArray(lead.locatii) && lead.locatii.length) return lead.locatii
  return lead.placeId && !String(lead.placeId).startsWith('manual:') ? [locatieDin(lead)] : []
}

/** Reunește locațiile, fără dubluri; cea mai nouă informație câștigă. */
export function unesteLocatii(...liste) {
  const dupaId = new Map()
  for (const lista of liste) {
    for (const l of lista || []) if (l?.placeId) dupaId.set(l.placeId, l)
  }
  return [...dupaId.values()]
}

/**
 * Cifrele firmei din toate locațiile:
 *   recenzii = suma lor — atâția clienți au lăsat o părere firmei;
 *   rating   = media ponderată cu recenziile, ca o locație cu 3 recenzii să nu tragă la fel ca una cu 300.
 */
export function cifreDinLocatii(locatii) {
  const nrRecenzii = locatii.reduce((s, l) => s + (l.nrRecenzii || 0), 0)
  const cuRating = locatii.filter((l) => typeof l.rating === 'number')

  let rating = null
  if (cuRating.length) {
    const ponderi = cuRating.reduce((s, l) => s + (l.nrRecenzii || 0), 0)
    rating = ponderi
      ? cuRating.reduce((s, l) => s + l.rating * (l.nrRecenzii || 0), 0) / ponderi
      : cuRating.reduce((s, l) => s + l.rating, 0) / cuRating.length
    rating = Math.round(rating * 10) / 10
  }

  return { nrRecenzii, rating, nrLocatii: Math.max(locatii.length, 1) }
}

/** Valoarea care apare cel mai des (la egalitate, prima din listă). */
export function celMaiDes(valori) {
  const numar = new Map()
  for (const v of valori) if (v) numar.set(v, (numar.get(v) || 0) + 1)
  let castig = null
  let maxim = 0
  for (const [v, n] of numar) {
    if (n > maxim) {
      castig = v
      maxim = n
    }
  }
  return castig
}

/** Numele firmei dintr-o grupă: cel mai des întâlnit, la egalitate cel mai scurt („Fornetti", nu „Fornetti Botanica"). */
export function numeFirma(denumiri) {
  const numar = new Map()
  for (const d of denumiri.filter(Boolean)) numar.set(d, (numar.get(d) || 0) + 1)
  return [...numar.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0]?.[0] || denumiri[0]
}
