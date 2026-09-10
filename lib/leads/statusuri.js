/**
 * Sursa unică de adevăr pentru pipeline-ul de lead-uri web.
 * Folosită deopotrivă de interfață (etichete, culori, filtre) și de API (validare).
 *
 * Ordinea de aici e ordinea din toate dropdown-urile.
 */

// ── Statusuri ────────────────────────────────────────────────────────────
export const STATUSURI = [
  {
    value: 'DE_SUNAT',
    label: 'De sunat',
    scurt: 'De sunat',
    emoji: '📞',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    grup: 'nou',
  },
  {
    value: 'FARA_RASPUNS',
    label: 'Fără răspuns',
    scurt: 'N-a răspuns',
    emoji: '🔘',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    grup: 'lucru',
  },
  {
    value: 'SUNAT',
    label: 'Sunat — am vorbit',
    scurt: 'Sunat',
    emoji: '☎️',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    grup: 'lucru',
  },
  {
    value: 'DE_REVENIT',
    label: 'De revenit',
    scurt: 'De revenit',
    emoji: '🔁',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    grup: 'lucru',
  },
  {
    value: 'INTERESAT',
    label: 'Interesat',
    scurt: 'Interesat',
    emoji: '🟢',
    color: 'bg-green-100 text-green-800 border-green-300',
    grup: 'lucru',
  },
  {
    value: 'OFERTA_TRIMISA',
    label: 'Ofertă trimisă',
    scurt: 'Ofertă',
    emoji: '📄',
    color: 'bg-sky-100 text-sky-800 border-sky-300',
    grup: 'lucru',
  },
  {
    value: 'NEGOCIERE',
    label: 'Negociere',
    scurt: 'Negociere',
    emoji: '🤝',
    color: 'bg-violet-100 text-violet-800 border-violet-300',
    grup: 'lucru',
  },
  {
    value: 'CLIENT',
    label: 'Client — a semnat',
    scurt: 'CLIENT',
    emoji: '💰',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-400',
    grup: 'castigat',
  },
  {
    value: 'REFUZ',
    label: 'Refuz',
    scurt: 'Refuz',
    emoji: '🔴',
    color: 'bg-red-100 text-red-800 border-red-300',
    grup: 'pierdut',
  },
  {
    value: 'NU_MA_SUNA',
    label: 'Nu mă suna',
    scurt: 'Nu suna',
    emoji: '⛔',
    color: 'bg-gray-200 text-gray-700 border-gray-400',
    grup: 'pierdut',
  },
]

export const VALORI_STATUS = STATUSURI.map((s) => s.value)

export const getStatus = (value) =>
  STATUSURI.find((s) => s.value === value) || {
    value,
    label: value,
    emoji: '⚪',
    color: 'bg-gray-100 text-gray-600 border-gray-300',
    grup: 'lucru',
  }

// ── Calitatea site-ului ──────────────────────────────────────────────────
// `puncte` = cât aduce la scor. Ordinea = de la cel mai valoros lead în jos.
export const CALITATI = [
  { value: 'LIPSA', label: 'Fără site', emoji: '🚫', color: 'bg-red-100 text-red-800', puncte: 50 },
  { value: 'MORT', label: 'Site mort', emoji: '💀', color: 'bg-orange-100 text-orange-800', puncte: 45 },
  { value: 'DOAR_SOCIAL', label: 'Doar social', emoji: '📱', color: 'bg-amber-100 text-amber-800', puncte: 40 },
  { value: 'FARA_HTTPS', label: 'Fără HTTPS', emoji: '🔓', color: 'bg-yellow-100 text-yellow-800', puncte: 25 },
  { value: 'NEADAPTAT_MOBIL', label: 'Nemobil', emoji: '📵', color: 'bg-lime-100 text-lime-800', puncte: 20 },
  { value: 'LENT', label: 'Lent', emoji: '🐌', color: 'bg-sky-100 text-sky-800', puncte: 15 },
  { value: 'OK', label: 'Site OK', emoji: '✅', color: 'bg-gray-100 text-gray-600', puncte: 0 },
]

export const getCalitate = (value) =>
  CALITATI.find((c) => c.value === value) || {
    value,
    label: 'Neverificat',
    emoji: '⏳',
    color: 'bg-gray-100 text-gray-500',
    puncte: 0,
  }

// ── Filtrul de recontactare ──────────────────────────────────────────────
export const FILTRE_FOLLOWUP = [
  { value: '', label: 'Follow-up: toate' },
  { value: 'restante', label: '🔴 Restante' },
  { value: 'azi', label: '🟠 Azi' },
  { value: 'urmeaza', label: '🔵 Urmează' },
  { value: 'fara', label: '⚪ Fără follow-up' },
]

// ── Perioade ─────────────────────────────────────────────────────────────
export const PERIOADE = [
  { value: '', label: 'Oricând' },
  { value: 'azi', label: 'Azi' },
  { value: '7', label: '7 zile' },
  { value: '30', label: '30 zile' },
  { value: '90', label: '3 luni' },
]

// ── Sortări ──────────────────────────────────────────────────────────────
export const SORTARI = [
  { value: 'scor', label: 'Scor (mare → mic)' },
  { value: 'followup', label: 'Follow-up apropiat' },
  { value: 'noi', label: 'Cele mai noi' },
  { value: 'recenzii', label: 'Cele mai multe recenzii' },
  { value: 'nume', label: 'Nume (A–Z)' },
]

// ── Ajutoare pentru follow-up ────────────────────────────────────────────

/** Începutul zilei de azi, ora locală. */
export function inceputulZilei(d = new Date()) {
  const z = new Date(d)
  z.setHours(0, 0, 0, 0)
  return z
}

/**
 * În ce stare e recontactarea unui lead.
 * @returns {'restant'|'azi'|'urmeaza'|null}
 */
export function stareFollowUp(nextFollowUpAt, acum = new Date()) {
  if (!nextFollowUpAt) return null

  const data = new Date(nextFollowUpAt)
  if (Number.isNaN(data.getTime())) return null

  const aziInceput = inceputulZilei(acum)
  const maineInceput = new Date(aziInceput)
  maineInceput.setDate(maineInceput.getDate() + 1)

  // Restant = ora a trecut deja, indiferent de zi.
  if (data < acum) return 'restant'
  if (data < maineInceput) return 'azi'
  return 'urmeaza'
}

/** Cum arată starea de follow-up în interfață. */
export const STILURI_FOLLOWUP = {
  restant: { eticheta: 'Restant', emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-300' },
  azi: { eticheta: 'Azi', emoji: '🟠', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  urmeaza: { eticheta: 'Urmează', emoji: '🔵', color: 'bg-blue-50 text-blue-700 border-blue-200' },
}

/** „azi 14:30", „mâine 09:00", „12.09 la 16:00" — cum scrie un om. */
export function formateazaFollowUp(valoare, acum = new Date()) {
  if (!valoare) return ''

  const d = new Date(valoare)
  if (Number.isNaN(d.getTime())) return ''

  const ora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const zileDiferenta = Math.round((inceputulZilei(d) - inceputulZilei(acum)) / 86400000)

  if (zileDiferenta === 0) return `azi ${ora}`
  if (zileDiferenta === 1) return `mâine ${ora}`
  if (zileDiferenta === -1) return `ieri ${ora}`

  const zi = String(d.getDate()).padStart(2, '0')
  const luna = String(d.getMonth() + 1).padStart(2, '0')

  if (zileDiferenta < 0) return `${zi}.${luna} (acum ${Math.abs(zileDiferenta)} zile)`
  return `${zi}.${luna} la ${ora}`
}
