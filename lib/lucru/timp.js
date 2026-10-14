/**
 * Data și ora la Chișinău pentru taskuri și programări.
 * Serverul (Vercel) rulează în UTC; tot ce vede omul e ora Moldovei.
 * Fără dependențe de server — merge și în browser.
 */

export const ZONA = 'Europe/Chisinau'

const format = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function parti(data) {
  return Object.fromEntries(format.formatToParts(data).map((p) => [p.type, Number(p.value)]))
}

function decalajMinute(data) {
  const p = parti(data)
  const caUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((caUtc - Math.floor(data.getTime() / 1000) * 1000) / 60000)
}

const doua = (n) => String(n).padStart(2, '0')

/** Date → „2026-10-13" (ziua la Chișinău). */
export function cheieZi(data = new Date()) {
  const p = parti(new Date(data))
  return `${p.year}-${doua(p.month)}-${doua(p.day)}`
}

/** Date → „14:30" (ora la Chișinău). */
export function oraLocala(data) {
  const p = parti(new Date(data))
  return `${doua(p.hour)}:${doua(p.minute)}`
}

/** („2026-10-13", „14:30") → momentul exact (UTC), ținând cont de ora de vară. */
export function momentLocal(cheie, ora = '00:00') {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cheie || '')
  if (!m) return null
  const [h, mi] = String(ora || '00:00').split(':').map(Number)
  const naiv = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h || 0, mi || 0)
  const prima = naiv - decalajMinute(new Date(naiv)) * 60000
  return new Date(naiv - decalajMinute(new Date(prima)) * 60000)
}

/** „2026-10-13" + 3 zile → „2026-10-16". */
export function adaugaZile(cheie, zile) {
  const [a, l, z] = cheie.split('-').map(Number)
  const d = new Date(Date.UTC(a, l - 1, z + zile, 12))
  return `${d.getUTCFullYear()}-${doua(d.getUTCMonth() + 1)}-${doua(d.getUTCDate())}`
}

/** Ziua săptămânii (0 = duminică) pentru o cheie de zi. */
export function ziSaptamana(cheie) {
  const [a, l, z] = cheie.split('-').map(Number)
  return new Date(Date.UTC(a, l - 1, z, 12)).getUTCDay()
}

/** Lunea săptămânii din care face parte ziua. */
export function inceputSaptamana(cheie) {
  return adaugaZile(cheie, -((ziSaptamana(cheie) + 6) % 7))
}

const ZILE = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă']
const ZILE_SCURT = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ']
const LUNI = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec']
const LUNI_LUNG = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
]

export function numeZi(cheie, scurt = false) {
  return (scurt ? ZILE_SCURT : ZILE)[ziSaptamana(cheie)]
}

export function numeLuna(luna, lung = false) {
  return (lung ? LUNI_LUNG : LUNI)[luna]
}

/** „marți, 13 oct" — cu „Azi"/„Mâine" unde se potrivește. */
export function eticheta(cheie, azi = cheieZi()) {
  const [, l, z] = cheie.split('-').map(Number)
  const baza = `${numeZi(cheie)}, ${z} ${LUNI[l - 1]}`
  if (cheie === azi) return `Azi · ${baza}`
  if (cheie === adaugaZile(azi, 1)) return `Mâine · ${baza}`
  if (cheie === adaugaZile(azi, -1)) return `Ieri · ${baza}`
  return baza
}

/** „13 oct, 14:30" pentru un moment oarecare. */
export function dataOra(data) {
  if (!data) return ''
  const d = new Date(data)
  const [, l, z] = cheieZi(d).split('-').map(Number)
  return `${z} ${LUNI[l - 1]}, ${oraLocala(d)}`
}

/** „13 oct 2026" */
export function dataScurta(data) {
  if (!data) return ''
  const [a, l, z] = cheieZi(new Date(data)).split('-').map(Number)
  return `${z} ${LUNI[l - 1]} ${a}`
}

/** „acum 5 min", „acum 3 ore", „ieri"… */
export function relativ(data, acum = new Date()) {
  const dif = (acum.getTime() - new Date(data).getTime()) / 60000
  if (dif < 1) return 'chiar acum'
  if (dif < 60) return `acum ${Math.round(dif)} min`
  if (dif < 24 * 60) return `acum ${Math.round(dif / 60)} h`
  if (dif < 48 * 60) return 'ieri'
  return dataScurta(data)
}

/** Termenul unui task față de acum: întârziat / azi / mâine / viitor. */
export function stareTermen(dueAt, acum = new Date()) {
  if (!dueAt) return null
  const d = new Date(dueAt)
  if (d < acum) return 'intarziat'
  const azi = cheieZi(acum)
  const zi = cheieZi(d)
  if (zi === azi) return 'azi'
  if (zi === adaugaZile(azi, 1)) return 'maine'
  return 'viitor'
}

/** „13.10.2026 14:30" — fără oră dacă e miezul nopții (ca în StefanPWA). */
export function fmtDue(data) {
  if (!data) return ''
  const d = new Date(data)
  const [a, l, z] = cheieZi(d).split('-')
  const ora = oraLocala(d)
  const zi = `${z}.${l}.${a}`
  return ora === '00:00' ? zi : `${zi} ${ora}`
}

/** „13.10.2026, 14:30" */
export function fmtDataOra(data) {
  if (!data) return ''
  const d = new Date(data)
  const [a, l, z] = cheieZi(d).split('-')
  return `${z}.${l}.${a}, ${oraLocala(d)}`
}

/** Durată lizibilă: „< 1 min", „25 min", „3h 10min", „2z 4h". */
export function fmtDurata(ms) {
  const min = Math.floor(ms / 60000)
  if (min < 1) return '< 1 min'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ${min % 60}min`
  const z = Math.floor(h / 24)
  return h % 24 > 0 ? `${z}z ${h % 24}h` : `${z}z`
}
