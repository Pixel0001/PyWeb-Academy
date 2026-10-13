/**
 * Etichete și culori pentru taskuri, proiecte și programări.
 * Fără nimic de server — se importă și în componentele client.
 */

export const STATUSURI_TASK = [
  { value: 'NEW', label: 'Nou', emoji: '🆕', culoare: 'bg-slate-100 text-slate-700 border-slate-200', punct: '#64748b' },
  { value: 'ASSIGNED', label: 'Asignat', emoji: '👤', culoare: 'bg-indigo-50 text-indigo-700 border-indigo-200', punct: '#6366f1' },
  { value: 'READ', label: 'Citit', emoji: '👀', culoare: 'bg-sky-50 text-sky-700 border-sky-200', punct: '#0ea5e9' },
  { value: 'IN_PROGRESS', label: 'În lucru', emoji: '🛠️', culoare: 'bg-blue-50 text-blue-700 border-blue-200', punct: '#2563eb' },
  { value: 'ON_HOLD', label: 'În așteptare', emoji: '⏸️', culoare: 'bg-amber-50 text-amber-700 border-amber-200', punct: '#f59e0b' },
  { value: 'REVIEW', label: 'În verificare', emoji: '🔍', culoare: 'bg-purple-50 text-purple-700 border-purple-200', punct: '#a855f7' },
  { value: 'DONE', label: 'Finalizat', emoji: '✅', culoare: 'bg-green-50 text-green-700 border-green-200', punct: '#22c55e' },
  { value: 'CANCELLED', label: 'Anulat', emoji: '❌', culoare: 'bg-red-50 text-red-700 border-red-200', punct: '#ef4444' },
]

export const VALORI_STATUS_TASK = STATUSURI_TASK.map((s) => s.value)
export const STATUSURI_TASK_INCHISE = ['DONE', 'CANCELLED']

export const PRIORITATI = [
  { value: 'LOW', label: 'Scăzută', emoji: '⚪', culoare: 'bg-gray-100 text-gray-600' },
  { value: 'MEDIUM', label: 'Medie', emoji: '🔵', culoare: 'bg-blue-50 text-blue-700' },
  { value: 'HIGH', label: 'Ridicată', emoji: '🟠', culoare: 'bg-orange-50 text-orange-700' },
  { value: 'URGENT', label: 'Urgentă', emoji: '🔴', culoare: 'bg-red-100 text-red-700' },
]
export const VALORI_PRIORITATE = PRIORITATI.map((p) => p.value)
export const ORDINE_PRIORITATE = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export const INTERVALE_REAMINTIRE = [
  { value: 0, label: 'Fără reamintire' },
  { value: 10, label: 'La 10 minute' },
  { value: 30, label: 'La 30 de minute' },
  { value: 60, label: 'La o oră' },
  { value: 180, label: 'La 3 ore' },
  { value: 360, label: 'La 6 ore' },
  { value: 720, label: 'La 12 ore' },
  { value: 1440, label: 'O dată pe zi' },
  { value: 10080, label: 'O dată pe săptămână' },
]

export const TERMENE = [
  { value: 'overdue', label: 'Întârziate' },
  { value: 'today', label: 'Azi' },
  { value: 'tomorrow', label: 'Mâine' },
  { value: 'week', label: 'Săptămâna asta' },
  { value: 'month', label: 'Luna asta' },
  { value: 'none', label: 'Fără termen' },
]

export const STATUSURI_PROIECT = [
  { value: 'ACTIVE', label: 'Activ', culoare: 'bg-blue-50 text-blue-700 border-blue-200', punct: '#2563eb' },
  { value: 'ON_HOLD', label: 'În pauză', culoare: 'bg-amber-50 text-amber-700 border-amber-200', punct: '#f59e0b' },
  { value: 'DONE', label: 'Finalizat', culoare: 'bg-green-50 text-green-700 border-green-200', punct: '#22c55e' },
  { value: 'ARCHIVED', label: 'Arhivat', culoare: 'bg-gray-100 text-gray-600 border-gray-200', punct: '#9ca3af' },
]
export const VALORI_STATUS_PROIECT = STATUSURI_PROIECT.map((s) => s.value)

export const STATUSURI_PROGRAMARE = [
  { value: 'NEW', label: 'Nouă', emoji: '🆕', culoare: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'CONFIRMED', label: 'Confirmată', emoji: '✅', culoare: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'IN_PROGRESS', label: 'În desfășurare', emoji: '▶️', culoare: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'DONE', label: 'Încheiată', emoji: '🏁', culoare: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'CANCELLED', label: 'Anulată', emoji: '❌', culoare: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'NO_SHOW', label: 'Nu a venit', emoji: '🚫', culoare: 'bg-orange-50 text-orange-700 border-orange-200' },
]
export const VALORI_STATUS_PROGRAMARE = STATUSURI_PROGRAMARE.map((s) => s.value)
export const STATUSURI_PROGRAMARE_INCHISE = ['DONE', 'CANCELLED', 'NO_SHOW']

/** Când pleacă reminderul pe Telegram, raportat la începutul programării. */
export const PRESETURI_REMINDER = [
  { key: 'DAY_BEFORE_8AM', label: 'Cu o zi înainte (08:00)' },
  { key: 'H3', label: 'Cu 3 ore înainte' },
  { key: 'H1', label: 'Cu o oră înainte' },
  { key: 'M30', label: 'Cu 30 de minute înainte' },
  { key: 'M10', label: 'Cu 10 minute înainte' },
]
export const CHEI_REMINDER = PRESETURI_REMINDER.map((p) => p.key)
export const REMINDERE_IMPLICITE = ['DAY_BEFORE_8AM', 'H3']

export const CULORI_CATEGORII = [
  '#6366f1', '#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#84cc16',
  '#eab308', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#64748b',
]

/** ID MongoDB valid sau null — un ID stricat nu ajunge la Prisma. */
export function idSauNull(v) {
  return typeof v === 'string' && /^[a-f\d]{24}$/i.test(v) ? v : null
}

export function dupaValoare(lista, valoare) {
  return lista.find((x) => x.value === valoare) || null
}

export const statusTask = (v) => dupaValoare(STATUSURI_TASK, v) || STATUSURI_TASK[0]
export const prioritate = (v) => dupaValoare(PRIORITATI, v) || PRIORITATI[1]
export const statusProiect = (v) => dupaValoare(STATUSURI_PROIECT, v) || STATUSURI_PROIECT[0]
export const statusProgramare = (v) => dupaValoare(STATUSURI_PROGRAMARE, v) || STATUSURI_PROGRAMARE[0]

/** „#007" — numărul scurt al unui task/proiect. */
export function refScurt(seq) {
  return seq != null ? `#${String(seq).padStart(3, '0')}` : ''
}

/** Linkuri de navigare pentru o locație (coordonate sau doar adresă). */
export function linkuriHarta({ lat, lng, address }) {
  if (lat != null && lng != null) {
    return {
      google: `https://www.google.com/maps?q=${lat},${lng}`,
      waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
      apple: `https://maps.apple.com/?ll=${lat},${lng}`,
    }
  }
  if (address) {
    const q = encodeURIComponent(address)
    return {
      google: `https://www.google.com/maps?q=${q}`,
      waze: `https://waze.com/ul?q=${q}&navigate=yes`,
      apple: `https://maps.apple.com/?q=${q}`,
    }
  }
  return null
}

export function marimeFisier(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
