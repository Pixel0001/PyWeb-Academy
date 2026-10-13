/**
 * Task sau programare dictată: audio → text (OpenAI) → câmpuri structurate.
 * Rezultatul NU se salvează singur: completează formularul, omul verifică
 * și apasă „Salvează".
 */

import { cereOpenAI } from '@/lib/leads/pitch-openai'
import { cheieZi, adaugaZile, numeZi } from './timp'
import { VALORI_PRIORITATE, CHEI_REMINDER } from './constante'

const URL_TRANSCRIERE = 'https://api.openai.com/v1/audio/transcriptions'

export class EroareVoce extends Error {}

/** Transcrie în română; dacă modelul nou nu e disponibil, cade pe whisper-1. */
export async function transcrie(buffer, mime = 'audio/webm', numeFisier = 'voce.webm') {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new EroareVoce('AI nu e configurat: lipsește OPENAI_API_KEY.')

  const modele = [process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe', 'whisper-1']
  let ultima = ''
  for (const model of [...new Set(modele)]) {
    const fd = new FormData()
    fd.append('file', new Blob([buffer], { type: mime }), numeFisier)
    fd.append('model', model)
    fd.append('language', 'ro')
    const r = await fetch(URL_TRANSCRIERE, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: fd })
    if (r.ok) {
      const date = await r.json().catch(() => ({}))
      return String(date.text || '').trim()
    }
    ultima = `${r.status} ${(await r.text().catch(() => '')).slice(0, 200)}`
    if (![400, 404].includes(r.status)) break
  }
  throw new EroareVoce(`Transcrierea a eșuat (${ultima}).`)
}

function calendarScurt(azi) {
  const zile = []
  for (let i = 0; i < 8; i++) {
    const k = adaugaZile(azi, i)
    zile.push(`${numeZi(k)}=${k}`)
  }
  return zile.join(', ')
}

function extrageJson(text) {
  const curat = String(text || '').replace(/```json|```/g, '').trim()
  const start = curat.indexOf('{')
  const sfarsit = curat.lastIndexOf('}')
  if (start < 0 || sfarsit < start) return null
  try {
    return JSON.parse(curat.slice(start, sfarsit + 1))
  } catch {
    return null
  }
}

/**
 * @param {string} transcriere
 * @param {{ echipa: {id,name}[], proiecte: {id,name}[], categorii: {id,name}[] }} context
 * @param {'task'|'programare'|'auto'} tip
 */
export async function interpreteaza(transcriere, context, tip = 'auto') {
  if (!transcriere) return { entity: tip === 'programare' ? 'programare' : 'task' }
  const azi = cheieZi()
  const lista = (l) => (l.length ? l.map((x) => `${x.id}=${x.name}`).join('; ') : '—')

  const instructiuni = [
    'Ești asistentul unui mic studio web din Moldova. Primești o comandă dictată în română (uneori cu rusisme) și extragi date structurate.',
    'Răspunde DOAR cu un obiect JSON valid, fără alt text.',
    '',
    tip === 'auto'
      ? "entity: 'programare' dacă e o întâlnire/apel/programare cu cineva la o anumită oră, altfel 'task'."
      : `entity: '${tip}' (fix).`,
    '',
    'Câmpuri pentru task:',
    '  title — scurt, la imperativ (ex. „Trimite oferta la Dulcinella")',
    '  description — detaliile rămase (opțional)',
    `  priority — ${VALORI_PRIORITATE.join('|')} (urgent/critic→URGENT, important→HIGH)`,
    `  dueDate — YYYY-MM-DD. Azi=${azi}, mâine=${adaugaZile(azi, 1)}. Zile: ${calendarScurt(azi)}`,
    "  dueTime — HH:mm, 24h ('la 3' în context de lucru = 15:00)",
    `  assigneeIds — listă de ID-uri exacte din: ${lista(context.echipa)} (potrivire după nume, fără diacritice; „eu"/„mie" = nimic)`,
    `  projectId — ID exact din: ${lista(context.proiecte)} dacă proiectul există`,
    '  newProjectName — doar dacă se cere explicit un proiect care NU e în listă',
    `  categoryId — ID exact din: ${lista(context.categorii)}`,
    '  reminderIntervalMinutes — dacă cere „amintește-mi la fiecare X" (minute)',
    '',
    'Câmpuri pentru programare:',
    '  title — scopul întâlnirii (ex. „Discuție site", „Prezentare ofertă")',
    '  contactName — cu cine (persoană)',
    '  company — firma, dacă se spune',
    '  contactPhone — telefonul, dacă se spune',
    '  location — unde (adresă / oraș / „online", „Zoom")',
    '  dateKey — YYYY-MM-DD, time — HH:mm, durationMinutes — întreg',
    `  responsabilId — ID exact din: ${lista(context.echipa)} dacă merge altcineva`,
    `  projectId — ID exact din proiecte, dacă se pomenește`,
    `  reminderOffsets — submulțime din ${CHEI_REMINDER.join(', ')} doar dacă cere explicit`,
    '  message — notițe',
    '',
    'Reguli: omite câmpurile care nu se spun. Nu inventa ID-uri.',
  ].join('\n')

  const { text } = await cereOpenAI({ instructiuni, continut: transcriere, maxTokeni: 2500 })
  const obj = extrageJson(text)
  if (!obj) throw new EroareVoce('AI-ul a răspuns într-un format necunoscut. Încearcă din nou.')

  // Păstrăm doar ID-urile care chiar există
  const ids = (l) => new Set(l.map((x) => x.id))
  const oameni = ids(context.echipa)
  const proiecte = ids(context.proiecte)
  const categorii = ids(context.categorii)
  const rez = { entity: obj.entity === 'programare' ? 'programare' : 'task' }
  if (tip !== 'auto') rez.entity = tip

  const str = (v, max = 300) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined)
  rez.title = str(obj.title, 200)
  rez.description = str(obj.description, 2000)
  rez.message = str(obj.message, 2000)
  if (VALORI_PRIORITATE.includes(obj.priority)) rez.priority = obj.priority
  if (/^\d{4}-\d{2}-\d{2}$/.test(obj.dueDate || '')) rez.dueDate = obj.dueDate
  if (/^\d{1,2}:\d{2}$/.test(obj.dueTime || '')) rez.dueTime = obj.dueTime.padStart(5, '0')
  if (Array.isArray(obj.assigneeIds)) rez.assigneeIds = obj.assigneeIds.filter((id) => oameni.has(id))
  if (proiecte.has(obj.projectId)) rez.projectId = obj.projectId
  else if (str(obj.newProjectName)) rez.newProjectName = str(obj.newProjectName, 150)
  if (categorii.has(obj.categoryId)) rez.categoryId = obj.categoryId
  if (Number(obj.reminderIntervalMinutes) > 0) rez.reminderIntervalMinutes = Number(obj.reminderIntervalMinutes)

  rez.contactName = str(obj.contactName, 150)
  rez.company = str(obj.company, 150)
  rez.contactPhone = str(obj.contactPhone, 40)
  rez.location = str(obj.location, 300)
  if (/^\d{4}-\d{2}-\d{2}$/.test(obj.dateKey || '')) rez.dateKey = obj.dateKey
  if (/^\d{1,2}:\d{2}$/.test(obj.time || '')) rez.time = obj.time.padStart(5, '0')
  if (Number(obj.durationMinutes) > 0) rez.durationMinutes = Math.round(Number(obj.durationMinutes))
  if (oameni.has(obj.responsabilId)) rez.responsabilId = obj.responsabilId
  if (Array.isArray(obj.reminderOffsets)) rez.reminderOffsets = obj.reminderOffsets.filter((k) => CHEI_REMINDER.includes(k))

  return Object.fromEntries(Object.entries(rez).filter(([, v]) => v !== undefined))
}
