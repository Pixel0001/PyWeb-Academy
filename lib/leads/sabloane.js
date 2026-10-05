/**
 * Șabloanele de mesaj: variabilele și înlocuirea lor.
 *
 * Un șablon e text normal, cu trei lucruri speciale:
 *
 *   {{firma}}          o variabilă — se înlocuiește cu datele firmei
 *   [[ ... ]]          o frază opțională — dispare ÎNTREAGĂ dacă vreo variabilă
 *                      din ea n-are valoare. Așa „aveți 4,8 stele din 340 de
 *                      recenzii" apare doar la firmele care chiar le au, iar la
 *                      celelalte nu rămâne o propoziție ciuntită.
 *   ((Sunt|Mă numesc)) variante — se alege una, aceeași pentru o firmă dată.
 *                      50 de mesaje trimise în aceeași zi nu mai sunt identice,
 *                      iar WhatsApp nu le vede ca un mesaj în masă.
 *
 * Fără dependențe de server: rulează la fel în browser și pe server.
 */

// ============================================================
// LIMBI, ETAPE, SITUAȚII
// ============================================================

export const LIMBI = [
  { value: 'ro', label: 'Română' },
  { value: 'ru', label: 'Rusă' },
  { value: 'en', label: 'Engleză' },
]

/** În ce moment al discuției se trimite mesajul. */
export const ETAPE = [
  { value: 'PRIMUL_CONTACT', label: 'Primul mesaj', emoji: '👋' },
  { value: 'NU_RASPUNDE', label: 'Nu răspunde la telefon', emoji: '📵' },
  { value: 'DUPA_APEL', label: 'După apel', emoji: '📞' },
  { value: 'REVENIRE', label: 'Revenire', emoji: '🔁' },
  { value: 'DUPA_RASPUNS', label: 'După ce a răspuns', emoji: '💬' },
]

export const getEtapa = (value) => ETAPE.find((e) => e.value === value) || ETAPE[0]

/** Etapa potrivită după statusul lead-ului — ca fereastra să se deschidă unde trebuie. */
export function etapaPentruStatus(status) {
  if (status === 'FARA_RASPUNS') return 'NU_RASPUNDE'
  if (status === 'SUNAT') return 'DUPA_APEL'
  if (['FOLLOW_UP_1', 'FOLLOW_UP_2', 'FOLLOW_UP_2_PLUS', 'SE_GANDESTE', 'DE_REVENIT'].includes(status)) {
    return 'REVENIRE'
  }
  if (['INTERESAT', 'INTALNIRE_PROGRAMATA', 'OFERTA_TRIMISA', 'NEGOCIERE', 'ASTEPTAM_PLATA'].includes(status)) {
    return 'DUPA_RASPUNS'
  }
  return 'PRIMUL_CONTACT'
}

/** Pentru ce fel de site e scris un șablon (gol = orice). */
export const SITUATII = [
  { value: 'LIPSA', label: 'Fără site' },
  { value: 'DOAR_SOCIAL', label: 'Doar social' },
  { value: 'MORT', label: 'Site mort' },
  { value: 'FARA_HTTPS', label: 'Nesigur' },
  { value: 'NEADAPTAT_MOBIL', label: 'Nemobil' },
  { value: 'LENT', label: 'Lent' },
  { value: 'OK', label: 'Site OK' },
  { value: 'NECLAR', label: 'Neclar' },
]

// ============================================================
// VALORILE VARIABILELOR
// ============================================================

/** Ce descrie fiecare calitate a site-ului, în cuvinte de om, pe limbi. */
const PROBLEME = {
  ro: {
    LIPSA: 'nu aveți încă un site',
    MORT: 'site-ul nu se deschide',
    DOAR_SOCIAL: 'aveți doar pagină de social media, fără site',
    FARA_HTTPS: 'site-ul apare ca nesigur în browser',
    NEADAPTAT_MOBIL: 'site-ul nu se vede bine pe telefon',
    LENT: 'site-ul se încarcă greu',
    NECLAR: 'site-ul se poate moderniza',
    OK: 'site-ul se poate moderniza',
  },
  ru: {
    LIPSA: 'у вас пока нет сайта',
    MORT: 'сайт не открывается',
    DOAR_SOCIAL: 'у вас только страница в соцсетях, без сайта',
    FARA_HTTPS: 'браузер помечает сайт как небезопасный',
    NEADAPTAT_MOBIL: 'сайт плохо отображается на телефоне',
    LENT: 'сайт долго загружается',
    NECLAR: 'сайт можно сделать современнее',
    OK: 'сайт можно сделать современнее',
  },
  en: {
    LIPSA: "you don't have a website yet",
    MORT: "it doesn't load",
    DOAR_SOCIAL: 'you only have a social media page, no website',
    FARA_HTTPS: 'the browser marks it as not secure',
    NEADAPTAT_MOBIL: "it doesn't display properly on phones",
    LENT: 'it takes a long time to load',
    NECLAR: 'it could use a refresh',
    OK: 'it could use a refresh',
  },
}

// Orașele Moldovei, cum le scrie un vorbitor de rusă
const ORASE_RU = {
  Chișinău: 'Кишинёв', Bălți: 'Бельцы', Tiraspol: 'Тирасполь', Cahul: 'Кагул', Orhei: 'Орхей',
  Comrat: 'Комрат', Ungheni: 'Унгены', Soroca: 'Сороки', Căușeni: 'Каушаны', Strășeni: 'Страшены',
  Edineț: 'Единцы', Hîncești: 'Хынчешты', Ialoveni: 'Яловены', Florești: 'Флорешты', Drochia: 'Дрокия',
  Cimișlia: 'Чимишлия', Bender: 'Бендеры', Tighina: 'Бендеры', 'Ceadîr-Lunga': 'Чадыр-Лунга',
  Vulcănești: 'Вулканешты', Rîbnița: 'Рыбница', Dubăsari: 'Дубоссары', Rezina: 'Резина',
}

/** 4.8 → „4,8" (ro, ru) sau „4.8" (en). */
function formatRating(rating, limba) {
  const text = String(Math.round(rating * 10) / 10)
  return limba === 'en' ? text : text.replace('.', ',')
}

/**
 * Numărul de recenzii, cu gramatica limbii:
 *   ro: „o recenzie", „7 recenzii", „312 recenzii", „340 de recenzii"
 *   ru: „1 отзыв", „3 отзыва", „312 отзывов"
 *   en: „1 review", „312 reviews"
 */
export function recenziiText(n, limba = 'ro') {
  const nr = Number(n) || 0
  if (nr <= 0) return ''

  if (limba === 'ru') {
    const zeci = nr % 100
    const unitati = nr % 10
    if (unitati === 1 && zeci !== 11) return `${nr} отзыв`
    if (unitati >= 2 && unitati <= 4 && (zeci < 12 || zeci > 14)) return `${nr} отзыва`
    return `${nr} отзывов`
  }
  if (limba === 'en') return nr === 1 ? '1 review' : `${nr} reviews`

  if (nr === 1) return 'o recenzie'
  // În română: „de" după 20 și peste, mai puțin 101–119, 201–219 ...
  const ultimeleDoua = nr % 100
  const cuDe = nr >= 20 && (ultimeleDoua === 0 || ultimeleDoua >= 20)
  return `${nr}${cuDe ? ' de' : ''} recenzii`
}

/**
 * Lauda din recenzii — doar când chiar merită spusă. Un 4,4 din 7 recenzii
 * nu e un compliment; spus ca unul, sună a robot care citește cifre.
 */
function notaGoogle(lead, limba) {
  const r = lead?.rating
  const n = lead?.nrRecenzii || 0
  const merita = typeof r === 'number' && ((r >= 4.3 && n >= 20) || (r >= 4.6 && n >= 10))
  if (!merita) return ''

  const rating = formatRating(r, limba)
  const recenzii = recenziiText(n, limba)
  if (limba === 'ru') return `оценка ${rating} и ${recenzii}`
  if (limba === 'en') return `${rating} stars from ${recenzii}`
  return `${rating} stele din ${recenzii}`
}

/** „Bună ziua" dimineața și la prânz, „Bună seara" seara — ca un om. */
function salut(limba, acum = new Date()) {
  const ora = acum.getHours()
  if (limba === 'ru') return ora < 11 ? 'Доброе утро' : ora >= 18 ? 'Добрый вечер' : 'Добрый день'
  if (limba === 'en') return 'Hi'
  return ora < 10 ? 'Bună dimineața' : ora >= 18 ? 'Bună seara' : 'Bună ziua'
}

/**
 * Variabilele disponibile, cu descriere și exemplu — afișate în editor ca să
 * știi ce poți folosi fără să ghicești.
 */
export const VARIABILE = [
  { cod: '{{salut}}', descriere: '„Bună ziua" / „Bună seara", după ora la care trimiți', exemplu: 'Bună ziua' },
  { cod: '{{firma}}', descriere: 'numele firmei', exemplu: 'GastHaus' },
  { cod: '{{oras}}', descriere: 'orașul', exemplu: 'Chișinău' },
  {
    cod: '{{nota_google}}',
    descriere: 'lauda din recenzii — DOAR dacă e bună (ex. 4,3+ din 20+ recenzii); pune-o în [[ ]]',
    exemplu: '4,8 stele din 340 de recenzii',
  },
  { cod: '{{recenzii_text}}', descriere: 'numărul de recenzii, cu gramatica corectă', exemplu: '340 de recenzii' },
  { cod: '{{rating}}', descriere: 'ratingul de pe Google', exemplu: '4,8' },
  { cod: '{{recenzii}}', descriere: 'numărul de recenzii (doar cifra)', exemplu: '340' },
  { cod: '{{problema}}', descriere: 'ce e în neregulă cu site-ul', exemplu: 'nu aveți încă un site' },
  { cod: '{{categorie}}', descriere: 'domeniul de activitate (de la Google)', exemplu: 'restaurant' },
  { cod: '{{numele_meu}}', descriere: 'numele tău (cine trimite)', exemplu: 'Tudor' },
]

/**
 * Valorile concrete pentru o firmă, în limba șablonului.
 * @param {object} lead
 * @param {string} numeleMeu
 * @param {'ro'|'ru'|'en'} [limba]
 * @param {Date} [acum] ora la care se trimite (pentru salut)
 */
export function valoriPentruLead(lead, numeleMeu, limba = 'ro', acum = new Date()) {
  const l = ['ro', 'ru', 'en'].includes(limba) ? limba : 'ro'
  const oras = lead?.oras || ''
  return {
    salut: salut(l, acum),
    firma: lead?.denumire || '',
    oras: l === 'ru' ? ORASE_RU[oras] || oras : oras,
    nota_google: notaGoogle(lead, l),
    recenzii_text: recenziiText(lead?.nrRecenzii, l),
    rating: typeof lead?.rating === 'number' ? formatRating(lead.rating, l) : '',
    recenzii: lead?.nrRecenzii ? String(lead.nrRecenzii) : '',
    problema: PROBLEME[l][lead?.calitateSite] || '',
    categorie: lead?.categoriePrincipala || lead?.categorii?.[0] || '',
    numele_meu: numeleMeu || '',
  }
}

/** Valorile de exemplu — pentru previzualizarea din editorul de șabloane. */
export function valoriExemplu(numeleMeu, limba = 'ro') {
  return valoriPentruLead(
    {
      denumire: 'GastHaus',
      oras: 'Chișinău',
      rating: 4.8,
      nrRecenzii: 340,
      calitateSite: 'LIPSA',
      categoriePrincipala: 'restaurant',
    },
    numeleMeu || 'Tudor',
    limba,
    new Date(2026, 0, 1, 12)
  )
}

// ============================================================
// COMPLETAREA ȘABLONULUI
// ============================================================

const RE_VARIABILA = /\{\{\s*([a-z_]+)\s*\}\}/gi

/** Un număr stabil din text (FNV-1a) — aceeași firmă primește mereu aceeași variantă. */
function hash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Înlocuiește variantele, frazele opționale și variabilele din text.
 *
 * @param {string} text
 * @param {object} valori      din valoriPentruLead / valoriExemplu
 * @param {object} [optiuni]
 * @param {string} [optiuni.samanta]  ce alege varianta: același text → aceeași variantă
 */
export function completeaza(text, valori, { samanta = '' } = {}) {
  if (!text) return ''

  // 1. Variantele ((a|b|c)) — una singură, aleasă după sămânță
  let index = 0
  let rezultat = String(text).replace(/\(\(([^()]*)\)\)/g, (_, interior) => {
    const optiuni = interior.split('|')
    const ales = samanta ? hash(`${samanta}:${index}`) % optiuni.length : 0
    index++
    return optiuni[ales]
  })

  // 2. Frazele opționale [[...]] — dispar dacă le lipsește vreo valoare
  rezultat = rezultat.replace(/\[\[([\s\S]*?)\]\]/g, (_, interior) => {
    const nume = [...interior.matchAll(RE_VARIABILA)].map((m) => m[1].toLowerCase())
    const lipseste = nume.some((n) => !String(valori[n] ?? '').trim())
    return lipseste ? '' : interior
  })

  // 3. Variabilele
  rezultat = rezultat.replace(RE_VARIABILA, (potrivire, nume) => {
    const cheie = nume.toLowerCase()
    return cheie in valori ? valori[cheie] : potrivire // variabilă necunoscută: o lăsăm vizibilă
  })

  return rezultat
    .replace(/[ \t]{2,}/g, ' ') // spații duble lăsate de variabile goale
    .replace(/ +([,.!?;:])/g, '$1') // spațiu înainte de punctuație
    .replace(/,(\s*[.!?])/g, '$1') // virgulă rămasă înainte de punct
    .replace(/\( *\)/g, '') // paranteze rămase goale
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Variabilele pe care textul le folosește dar care nu există — greșeli de scriere. */
export function variabileNecunoscute(text) {
  const cunoscute = new Set(VARIABILE.map((v) => v.cod.slice(2, -2)))
  const gasite = [...String(text || '').matchAll(RE_VARIABILA)].map((m) => m[1].toLowerCase())
  return [...new Set(gasite.filter((n) => !cunoscute.has(n)))]
}

/** Tot ce e greșit într-un șablon, în cuvinte — gol dacă e în regulă. */
export function problemeSablon(text) {
  const t = String(text || '')
  const probleme = []

  const necunoscute = variabileNecunoscute(t)
  if (necunoscute.length) {
    probleme.push(`Variabile necunoscute: ${necunoscute.map((n) => `{{${n}}}`).join(', ')}`)
  }

  const deschideri = (t.match(/\[\[/g) || []).length
  const inchideri = (t.match(/\]\]/g) || []).length
  if (deschideri !== inchideri) probleme.push('Paranteze [[ ]] neperechi — fiecare [[ trebuie închis cu ]]')
  if (/\[\[[^\]]*\[\[/.test(t)) probleme.push('O frază [[ ]] nu poate conține altă frază [[ ]]')

  const variante = (t.match(/\(\(/g) || []).length
  const variantePerechi = (t.match(/\(\([^()]*\)\)/g) || []).length
  if (variante !== variantePerechi) probleme.push('Variante (( | )) scrise greșit — ex. ((Sunt|Mă numesc))')

  return probleme
}

// ============================================================
// POTRIVIREA ȘABLON ↔ FIRMĂ
// ============================================================

/** „Cofetărie" → „cofetarie" — comparăm fără diacritice și majuscule. */
export function normalizeaza(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Țările unde vorbim română la telefon; restul primesc șabloane în engleză
const TARI_ROMANA = ['MD', 'RO']

/**
 * Cât de bine se potrivește un șablon cu o firmă — ca în fereastra de
 * WhatsApp cele potrivite să fie primele.
 *
 * @param {object} sablon
 * @param {object} lead
 * @param {string|null} grupLead   grupa de categorii a firmei („Magazine"...)
 * @returns {{ scor: number, potrivit: boolean, altSite: boolean }}
 */
export function potrivire(sablon, lead, grupLead) {
  let scor = 0
  const limba = sablon.limba || 'ro'

  // Limba: străinătate → engleză; Moldova/România → română (rusa rămâne la alegere)
  const strain = lead?.tara && !TARI_ROMANA.includes(lead.tara)
  if (strain) scor += limba === 'en' ? 5 : -6
  else if (limba === 'en') scor -= 6
  else if (limba === 'ro') scor += 1
  // Un nume scris cu chirilice = firmă care vorbește rusa — contează mai mult decât nișa
  if (/[а-яё]/i.test(lead?.denumire || '')) {
    if (limba === 'ru') scor += 6
    else if (limba === 'ro') scor -= 2
  }

  // Domeniul: aceeași grupă de categorii, și mai ales aceleași cuvinte cheie
  if (sablon.categorie && grupLead && sablon.categorie === grupLead) scor += 3
  else if (sablon.categorie && sablon.categorie !== 'Orice firmă' && grupLead) scor -= 2

  const textFirma = normalizeaza(
    [lead?.denumire, lead?.categoriePrincipala, ...(lead?.categorii || [])].filter(Boolean).join(' ')
  )
  if ((sablon.cuvinte || []).some((c) => c && textFirma.includes(normalizeaza(c)))) scor += 4

  // Situația site-ului: un șablon „site mort" la o firmă fără site ar fi o gafă
  const situatii = sablon.situatii || []
  let altSite = false
  if (situatii.length) {
    if (lead?.calitateSite && situatii.includes(lead.calitateSite)) scor += 3
    else {
      scor -= 5
      altSite = true
    }
  }

  return { scor, potrivit: scor >= 4 && !altSite, altSite }
}

// ============================================================
// WHATSAPP
// ============================================================

/**
 * Numărul în forma pe care o vrea WhatsApp: doar cifre, cu prefixul țării.
 *
 * Google ne dă de obicei „+37378076073", dar dacă avem doar varianta locală
 * („078076073"), punem noi prefixul Moldovei.
 */
// Prefixele țărilor din config, pentru numerele scrise în format local
const PREFIXE = { MD: '373', RO: '40', GB: '44', US: '1', IE: '353', IT: '39', DE: '49', ES: '34', FR: '33' }

export function numarWhatsApp(lead) {
  const brut = lead?.telefon || lead?.telefonLocal || ''
  let cifre = String(brut).replace(/\D/g, '')

  if (!cifre) return null

  // Numărul are deja prefix internațional (+44..., 0044...)
  if (String(brut).trim().startsWith('+')) return cifre.length >= 10 ? cifre : null
  if (cifre.startsWith('00')) return cifre.slice(2).length >= 10 ? cifre.slice(2) : null

  // Număr local dintr-o țară străină: 0 + număr → prefixul țării
  if (lead?.tara && lead.tara !== 'MD') {
    const prefix = PREFIXE[lead.tara]
    if (!prefix) return cifre.length >= 10 ? cifre : null
    if (cifre.startsWith(prefix)) return cifre
    return `${prefix}${cifre.replace(/^0/, '')}`
  }

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

// ============================================================
// CÂMPURILE UNUI ȘABLON, CURĂȚATE (pentru API)
// ============================================================

/**
 * Etapa, limba, situațiile și cuvintele cheie, verificate — doar ce e în
 * `corp` (la editare se schimbă numai câmpurile trimise).
 */
export function metaSablon(corp) {
  const date = {}
  if (corp.etapa !== undefined) {
    date.etapa = ETAPE.some((e) => e.value === corp.etapa) && corp.etapa !== 'PRIMUL_CONTACT' ? corp.etapa : null
  }
  if (corp.limba !== undefined) {
    date.limba = ['ru', 'en'].includes(corp.limba) ? corp.limba : null
  }
  if (corp.situatii !== undefined) {
    const valide = new Set(SITUATII.map((s) => s.value))
    date.situatii = [...new Set((Array.isArray(corp.situatii) ? corp.situatii : []).filter((s) => valide.has(s)))]
  }
  if (corp.cuvinte !== undefined) {
    const lista = Array.isArray(corp.cuvinte) ? corp.cuvinte : String(corp.cuvinte || '').split(',')
    date.cuvinte = [...new Set(lista.map((c) => String(c).trim().slice(0, 40)).filter(Boolean))].slice(0, 30)
  }
  return date
}
