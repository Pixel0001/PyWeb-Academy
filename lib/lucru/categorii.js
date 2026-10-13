/** Validarea unei categorii (nume, culoare, durata implicită a programărilor). */

export function curataCategorie(corp) {
  const date = {}
  if (corp.name !== undefined) {
    const n = String(corp.name || '').trim().slice(0, 60)
    if (!n) throw new Error('Scrie numele categoriei.')
    date.name = n
  }
  if (corp.color !== undefined) {
    if (!/^#[0-9a-f]{6}$/i.test(corp.color || '')) throw new Error('Culoare invalidă.')
    date.color = corp.color
  }
  if (corp.defaultDurationMinutes !== undefined) {
    date.defaultDurationMinutes = Math.max(5, Math.min(Number(corp.defaultDurationMinutes) || 30, 600))
  }
  return date
}
