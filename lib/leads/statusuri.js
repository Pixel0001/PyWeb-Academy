/**
 * Sursa unică de adevăr pentru pipeline-ul de lead-uri web.
 * Folosită deopotrivă de interfață (etichete, culori, filtre) și de API (validare).
 *
 * Ordinea de aici e ordinea din toate dropdown-urile.
 */

// ── Statusuri ────────────────────────────────────────────────────────────
// Același drum ca în CRM-ul Olla English, adaptat vânzării de site-uri:
// New lead → contactat → follow up-uri → interesat → întâlnire → ofertă →
// avans → client → site în lucru → livrat.
//
// Valorile vechi (DE_SUNAT, SUNAT, DE_REVENIT, CLIENT...) au rămas aceleași,
// doar cu etichete noi — lead-urile deja salvate nu trebuie mutate nicăieri.
//
// `apel: true` = statusul înseamnă o încercare de apel, deci se notează
// automat data ultimului apel.
export const STATUSURI = [
  { value: 'DE_SUNAT', label: 'New lead', scurt: 'New lead', emoji: '🔵', color: 'bg-blue-100 text-blue-800 border-blue-300', grup: 'nou' },
  { value: 'FARA_RASPUNS', label: 'Fără răspuns', scurt: 'Fără răspuns', emoji: '🔘', color: 'bg-gray-100 text-gray-700 border-gray-300', grup: 'lucru', apel: true },
  { value: 'SUNAT', label: 'Contactat', scurt: 'Contactat', emoji: '🟡', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', grup: 'lucru', apel: true },
  // Revenirile după primul contact — cu cât mai multe, cu atât mai cald colorat
  { value: 'FOLLOW_UP_1', label: 'Follow up 1', scurt: 'Follow up 1', emoji: '📞', color: 'bg-yellow-50 text-yellow-800 border-yellow-200', grup: 'lucru', apel: true },
  { value: 'FOLLOW_UP_2', label: 'Follow up 2', scurt: 'Follow up 2', emoji: '📲', color: 'bg-amber-50 text-amber-800 border-amber-200', grup: 'lucru', apel: true },
  { value: 'FOLLOW_UP_2_PLUS', label: 'Follow up 2+', scurt: 'Follow up 2+', emoji: '🔁', color: 'bg-orange-50 text-orange-800 border-orange-200', grup: 'lucru', apel: true },
  { value: 'INTERESAT', label: 'Interesat', scurt: 'Interesat', emoji: '🟢', color: 'bg-green-100 text-green-800 border-green-300', grup: 'lucru' },
  { value: 'INTALNIRE_PROGRAMATA', label: 'Întâlnire programată', scurt: 'Întâlnire', emoji: '📅', color: 'bg-sky-100 text-sky-800 border-sky-300', grup: 'lucru' },
  { value: 'OFERTA_TRIMISA', label: 'Ofertă trimisă', scurt: 'Ofertă', emoji: '📄', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', grup: 'lucru' },
  { value: 'NEGOCIERE', label: 'Negociere', scurt: 'Negociere', emoji: '🤝', color: 'bg-violet-100 text-violet-800 border-violet-300', grup: 'lucru' },
  { value: 'SE_GANDESTE', label: 'Se gândește', scurt: 'Se gândește', emoji: '🤔', color: 'bg-gray-100 text-gray-600 border-gray-300', grup: 'lucru' },
  { value: 'DE_REVENIT', label: 'Interesat mai târziu', scurt: 'Mai târziu', emoji: '🗓️', color: 'bg-stone-100 text-stone-700 border-stone-300', grup: 'lucru' },
  { value: 'ASTEPTAM_PLATA', label: 'Așteptăm avansul', scurt: 'Avans', emoji: '💵', color: 'bg-amber-100 text-amber-800 border-amber-300', grup: 'lucru' },
  { value: 'CLIENT', label: 'A plătit', scurt: 'A plătit', emoji: '💰', color: 'bg-emerald-100 text-emerald-800 border-emerald-400', grup: 'castigat' },
  { value: 'IN_LUCRU', label: 'Site în lucru', scurt: 'În lucru', emoji: '🟣', color: 'bg-purple-100 text-purple-800 border-purple-300', grup: 'castigat' },
  { value: 'LIVRAT', label: 'Site livrat', scurt: 'Livrat', emoji: '✅', color: 'bg-slate-200 text-slate-800 border-slate-400', grup: 'castigat' },
  { value: 'REFUZ', label: 'Refuz', scurt: 'Refuz', emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-300', grup: 'pierdut' },
  { value: 'NU_MA_SUNA', label: 'Lead pierdut', scurt: 'Pierdut', emoji: '❌', color: 'bg-red-200 text-red-900 border-red-400', grup: 'pierdut' },
  { value: 'NUMAR_GRESIT', label: 'Număr greșit / închis', scurt: 'Nr. greșit', emoji: '📵', color: 'bg-gray-200 text-gray-700 border-gray-400', grup: 'pierdut' },
  { value: 'TEST', label: 'Test', scurt: 'Test', emoji: '🧪', color: 'bg-cyan-100 text-cyan-800 border-cyan-300', grup: 'lucru' },
]

export const VALORI_STATUS = STATUSURI.map((s) => s.value)

/** Statusurile din care nu mai vrem mementouri de recontactare. */
export const STATUSURI_INCHISE = STATUSURI.filter((s) => s.grup === 'pierdut').map((s) => s.value)

/** Statusurile care înseamnă o încercare de apel (notează data apelului). */
export const STATUSURI_APEL = STATUSURI.filter((s) => s.apel).map((s) => s.value)

export const getStatus = (value) =>
  STATUSURI.find((s) => s.value === value) || {
    value,
    label: value,
    scurt: value,
    emoji: '⚪',
    color: 'bg-gray-100 text-gray-600 border-gray-300',
    grup: 'lucru',
  }

// ── Surse ────────────────────────────────────────────────────────────────
// De unde a venit firma. Cele găsite de extragere sunt GOOGLE_MAPS; restul
// se aleg la „Lead nou". `detaliu` = ce se cere în câmpul liber.
// `link` = cum deschizi conversația direct din CRM.
export const SURSE = [
  {
    value: 'GOOGLE_MAPS', label: 'Google Maps', emoji: '🗺️', color: 'bg-blue-50 text-blue-700',
    detaliu: 'Detalii', link: (l) => l.linkMaps || null,
  },
  {
    value: 'MANUAL', label: 'Adăugat manual', emoji: '✍️', color: 'bg-gray-100 text-gray-700',
    detaliu: 'De unde știm de ea', link: () => null,
  },
  {
    value: 'RECOMANDARE', label: 'Recomandare', emoji: '🤝', color: 'bg-violet-100 text-violet-800',
    detaliu: 'Cine a recomandat', link: () => null,
  },
  {
    value: 'FACEBOOK', label: 'Facebook', emoji: '📘', color: 'bg-blue-100 text-blue-800',
    detaliu: 'Pagina Facebook (link)',
    link: (l) => (l.sursaDetaliu?.startsWith('http') ? l.sursaDetaliu : null),
  },
  {
    value: 'INSTAGRAM', label: 'Instagram', emoji: '📸', color: 'bg-pink-100 text-pink-800',
    detaliu: 'Utilizator Instagram (ex: @firma)',
    link: (l) => {
      if (!l.sursaDetaliu) return null
      if (l.sursaDetaliu.startsWith('http')) return l.sursaDetaliu
      return `https://instagram.com/${l.sursaDetaliu.replace(/^@/, '')}`
    },
  },
  {
    value: 'WHATSAPP', label: 'WhatsApp', emoji: '🟢', color: 'bg-green-100 text-green-800',
    detaliu: 'Număr WhatsApp (dacă diferă de telefon)', link: () => null,
  },
  {
    value: 'TELEFON', label: 'Ne-a sunat', emoji: '📞', color: 'bg-teal-100 text-teal-800',
    detaliu: 'Detalii apel', link: () => null,
  },
  {
    value: 'SITE', label: 'Formular site', emoji: '🌐', color: 'bg-cyan-100 text-cyan-800',
    detaliu: 'Pagina de proveniență', link: () => null,
  },
  {
    value: 'APOLLO', label: 'Apollo', emoji: '📧', color: 'bg-indigo-100 text-indigo-800',
    detaliu: 'Campania / contactul', link: () => null,
  },
  {
    value: 'EVENIMENT', label: 'Eveniment', emoji: '🎪', color: 'bg-orange-100 text-orange-800',
    detaliu: 'Ce eveniment', link: () => null,
  },
  {
    value: 'ALTA', label: 'Altă sursă', emoji: '❓', color: 'bg-gray-100 text-gray-700',
    detaliu: 'Descrie sursa', link: () => null,
  },
]

export const VALORI_SURSA = SURSE.map((s) => s.value)

// Lead-urile dinainte de câmpul „sursă" au venit toate din extragerea Google.
export const getSursa = (value) =>
  SURSE.find((s) => s.value === (value || 'GOOGLE_MAPS')) || SURSE[SURSE.length - 1]

// ── Țări ─────────────────────────────────────────────────────────────────
/** Steagul din codul țării: „RO" → 🇷🇴. Gol pentru cod invalid. */
export function steagTara(cod) {
  if (!/^[A-Z]{2}$/.test(cod || '')) return ''
  return String.fromCodePoint(...[...cod].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
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
  // Site protejat de roboți (Cloudflare etc.) sau care nu răspunde serverelor noastre —
  // poate merge perfect. Se verifică de mână, nu se presupune că e mort.
  { value: 'NECLAR', label: 'Neclar (protejat)', emoji: '🛡️', color: 'bg-violet-100 text-violet-800', puncte: 10 },
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

// ── Perioade (când a intrat lead-ul în CRM) ─────────────────────────────
export const PERIOADE = [
  { value: '', label: 'Perioadă: toate' },
  { value: 'azi', label: 'Azi' },
  { value: 'ieri', label: 'Ieri' },
  { value: 'saptamana', label: 'Săptămâna aceasta' },
  { value: 'luna', label: 'Luna aceasta' },
  { value: 'luna-trecuta', label: 'Luna trecută' },
  { value: 'interval', label: 'Interval…' },
]

// ── Sortări ──────────────────────────────────────────────────────────────
export const SORTARI = [
  { value: 'scor', label: 'Scor (mare → mic)' },
  { value: 'noi', label: 'Cele mai noi' },
  { value: 'vechi', label: 'Cele mai vechi' },
  { value: 'followup', label: 'Follow-up apropiat' },
  { value: 'recenzii', label: 'Cele mai multe recenzii' },
  { value: 'nume', label: 'Nume (A–Z)' },
]

// ── Scor minim ───────────────────────────────────────────────────────────
export const SCORURI_MINIME = [
  { value: '', label: 'Scor: oricare' },
  { value: '40', label: 'Scor 40+' },
  { value: '60', label: 'Scor 60+' },
  { value: '70', label: 'Scor 70+' },
  { value: '80', label: 'Scor 80+' },
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
