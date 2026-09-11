/**
 * Șabloanele de mesaj: variabilele și înlocuirea lor.
 *
 * Un șablon e text normal cu variabile de forma {{firma}}. La trimitere,
 * fiecare variabilă se înlocuiește cu datele firmei respective. O variabilă
 * pentru care nu avem date dispare curat, fără să lase „{{rating}}" în mesaj
 * — altfel omul primește un text care arată a robot stricat.
 *
 * Fără dependențe de server: rulează la fel în browser și pe server.
 */

/** Ce descrie fiecare calitate a site-ului, în cuvinte de om. */
const PROBLEME = {
  LIPSA: 'nu aveți încă un site',
  MORT: 'site-ul nu se deschide',
  DOAR_SOCIAL: 'aveți doar pagină de social media, fără site',
  FARA_HTTPS: 'site-ul apare ca nesigur în browser',
  NEADAPTAT_MOBIL: 'site-ul nu se vede bine pe telefon',
  LENT: 'site-ul se încarcă greu',
  OK: 'site-ul se poate moderniza',
}

/**
 * Variabilele disponibile, cu descriere și exemplu — afișate în editor ca să
 * știi ce poți folosi fără să ghicești.
 */
export const VARIABILE = [
  { cod: '{{firma}}', descriere: 'numele firmei', exemplu: 'GastHaus' },
  { cod: '{{oras}}', descriere: 'orașul', exemplu: 'Chișinău' },
  { cod: '{{rating}}', descriere: 'ratingul de pe Google', exemplu: '4,5' },
  { cod: '{{recenzii}}', descriere: 'numărul de recenzii', exemplu: '544' },
  { cod: '{{problema}}', descriere: 'ce e în neregulă cu site-ul', exemplu: 'nu aveți încă un site' },
  { cod: '{{categorie}}', descriere: 'domeniul de activitate', exemplu: 'restaurant' },
  { cod: '{{numele_meu}}', descriere: 'numele tău (cine trimite)', exemplu: 'Tudor' },
]

/** Valorile concrete pentru o firmă. */
export function valoriPentruLead(lead, numeleMeu) {
  return {
    firma: lead?.denumire || '',
    oras: lead?.oras || '',
    rating: typeof lead?.rating === 'number' ? String(lead.rating).replace('.', ',') : '',
    recenzii: lead?.nrRecenzii ? String(lead.nrRecenzii) : '',
    problema: PROBLEME[lead?.calitateSite] || '',
    categorie: lead?.categoriePrincipala || lead?.categorii?.[0] || '',
    numele_meu: numeleMeu || '',
  }
}

/** Valorile de exemplu — pentru previzualizarea din editorul de șabloane. */
export function valoriExemplu(numeleMeu) {
  const v = Object.fromEntries(VARIABILE.map((x) => [x.cod.slice(2, -2), x.exemplu]))
  if (numeleMeu) v.numele_meu = numeleMeu
  return v
}

/**
 * Înlocuiește variabilele din text.
 *
 * Variabilele fără valoare dispar, iar spațiile și punctuația rămase în urma
 * lor se curăță: „aveți {{rating}} stele" fără rating nu devine „aveți  stele".
 */
export function completeaza(text, valori) {
  if (!text) return ''

  const rezultat = String(text).replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (potrivire, nume) => {
    const cheie = nume.toLowerCase()
    return cheie in valori ? valori[cheie] : potrivire // variabilă necunoscută: o lăsăm vizibilă
  })

  return rezultat
    .replace(/[ \t]{2,}/g, ' ') // spații duble lăsate de variabile goale
    .replace(/ +([,.!?;:])/g, '$1') // spațiu înainte de punctuație
    .replace(/\( *\)/g, '') // paranteze rămase goale
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

/** Variabilele pe care textul le folosește dar care nu există — greșeli de scriere. */
export function variabileNecunoscute(text) {
  const cunoscute = new Set(VARIABILE.map((v) => v.cod.slice(2, -2)))
  const gasite = [...String(text || '').matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)].map((m) =>
    m[1].toLowerCase()
  )
  return [...new Set(gasite.filter((n) => !cunoscute.has(n)))]
}

/**
 * Numărul în forma pe care o vrea WhatsApp: doar cifre, cu prefixul țării.
 *
 * Google ne dă de obicei „+37378076073", dar dacă avem doar varianta locală
 * („078076073"), punem noi prefixul Moldovei.
 */
export function numarWhatsApp(lead) {
  const brut = lead?.telefon || lead?.telefonLocal || ''
  let cifre = String(brut).replace(/\D/g, '')

  if (!cifre) return null

  // Număr local moldovenesc: 0 urmat de 8 cifre → +373
  if (cifre.startsWith('0') && cifre.length === 9) cifre = `373${cifre.slice(1)}`
  // 8 cifre fără 0 (ex. 78076073) → tot Moldova
  else if (cifre.length === 8) cifre = `373${cifre}`

  // Prea scurt ca să fie un număr real
  return cifre.length >= 10 ? cifre : null
}

/** Linkul care deschide WhatsApp cu mesajul gata scris. */
export function linkWhatsApp(numar, text) {
  if (!numar) return null
  return `https://wa.me/${numar}?text=${encodeURIComponent(text || '')}`
}
