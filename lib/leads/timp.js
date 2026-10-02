/**
 * Calendarul CRM-ului e cel din Chișinău, nu cel al serverului.
 *
 * Vercel rulează în UTC: fără asta, „azi" ar începe la 03:00 ora noastră și
 * un lead adăugat la 01:30 ar apărea la „ieri".
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

/** Cu câte minute e Chișinăul înaintea UTC la momentul dat (180 vara, 120 iarna). */
function decalajMinute(data) {
  const p = parti(data)
  const caUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((caUtc - Math.floor(data.getTime() / 1000) * 1000) / 60000)
}

/** Ziua din calendarul Chișinăului: { an, luna (0-11), zi, ziSaptamana (0 = duminică) }. */
export function ziuaLocala(data = new Date()) {
  const p = parti(data)
  const ziSaptamana = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()
  return { an: p.year, luna: p.month - 1, zi: p.day, ziSaptamana }
}

/** Momentul exact în care începe ziua dată, ora Chișinăului. Acceptă zile/luni „peste limită". */
export function inceputZi(an, luna, zi) {
  const naiv = Date.UTC(an, luna, zi)
  // Decalajul se citește la ora reală a miezului nopții, ca să prindă trecerea la ora de vară.
  const prima = naiv - decalajMinute(new Date(naiv)) * 60000
  return new Date(naiv - decalajMinute(new Date(prima)) * 60000)
}

/** „2026-10-02" (din <input type="date">) → începutul acelei zile la Chișinău. */
export function dinDataInput(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text || '')
  return m ? inceputZi(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

/** Intervalul [gte, lt) pentru filtrul de perioadă; null = fără filtru. */
export function intervalPerioada(perioada, de, pana, acum = new Date()) {
  const { an, luna, zi, ziSaptamana } = ziuaLocala(acum)

  switch (perioada) {
    case 'azi':
      return { gte: inceputZi(an, luna, zi) }
    case 'ieri':
      return { gte: inceputZi(an, luna, zi - 1), lt: inceputZi(an, luna, zi) }
    case 'saptamana': {
      // Săptămâna începe luni
      const inapoi = (ziSaptamana + 6) % 7
      return { gte: inceputZi(an, luna, zi - inapoi) }
    }
    case 'luna':
      return { gte: inceputZi(an, luna, 1) }
    case 'luna-trecuta':
      return { gte: inceputZi(an, luna - 1, 1), lt: inceputZi(an, luna, 1) }
    case 'interval': {
      const inceput = dinDataInput(de)
      const sfarsit = dinDataInput(pana)
      if (!inceput && !sfarsit) return null
      const rez = {}
      if (inceput) rez.gte = inceput
      // „până la 5 oct" înseamnă inclusiv ziua de 5
      if (sfarsit) rez.lt = inceputZiUrmatoare(sfarsit)
      return rez
    }
    default:
      return null
  }
}

function inceputZiUrmatoare(data) {
  const { an, luna, zi } = ziuaLocala(new Date(data.getTime() + 12 * 3600000))
  return inceputZi(an, luna, zi + 1)
}

/** Începutul zilei de azi și de mâine, ora Chișinăului. */
export function aziSiMaine(acum = new Date()) {
  const { an, luna, zi } = ziuaLocala(acum)
  return { azi: inceputZi(an, luna, zi), maine: inceputZi(an, luna, zi + 1) }
}
