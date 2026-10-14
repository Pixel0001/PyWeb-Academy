/**
 * Telegram pentru taskuri și programări — același bot ca la leaduri
 * (TELEGRAM_LESSONS_BOT_TOKEN), mesaje în privat către cine și-a legat contul
 * din Securitate → Telegram. Formatul mesajelor și butoanele sunt cele din
 * StefanPWA.
 *
 * Butoanele trimit `callback_data` scurte, tratate în lib/lucru/bot.js:
 *   TST:<STATUS>:<taskId>   — schimbă statusul taskului
 *   TPR:<procent>:<taskId>  — schimbă progresul
 *   TCOMM:<taskId>          — scrie un comentariu
 *   TDET:<taskId>           — detaliile taskului
 *   pg:<STATUS>:<apptId>    — schimbă statusul programării
 *   MY_TASKS / TODAY / TOMORROW / WEEK / ADD / VOICE — meniul
 */

import { statusTask, prioritate, statusProgramare, linkuriHarta } from './constante'
import { dataOra, oraLocala, eticheta, cheieZi } from './timp'

const api = (metoda) => `https://api.telegram.org/bot${process.env.TELEGRAM_LESSONS_BOT_TOKEN}/${metoda}`

export const telegramConfigurat = () => Boolean(process.env.TELEGRAM_LESSONS_BOT_TOKEN)

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function cheama(metoda, corp) {
  if (!telegramConfigurat()) {
    console.error(`[telegram/${metoda}] omis: lipsește TELEGRAM_LESSONS_BOT_TOKEN`)
    return null
  }
  try {
    const r = await fetch(api(metoda), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corp),
    })
    const date = await r.json().catch(() => null)
    if (!date?.ok) {
      console.error(`[telegram/${metoda}]`, date?.description || r.status)
      return null
    }
    return date.result
  } catch (e) {
    console.error(`[telegram/${metoda}]`, e?.message)
    return null
  }
}

/** Trimite un mesaj; întoarce message_id sau null. */
export async function trimite(chatId, text, tastatura = null) {
  if (!chatId) return null
  const rez = await cheama('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(tastatura ? { reply_markup: { inline_keyboard: tastatura } } : {}),
  })
  return rez?.message_id ?? null
}

export async function editeaza(chatId, messageId, text, tastatura = null) {
  return cheama('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: tastatura ? { inline_keyboard: tastatura } : { inline_keyboard: [] },
  })
}

export async function sterge(chatId, messageId) {
  return cheama('deleteMessage', { chat_id: chatId, message_id: messageId })
}

export async function raspundeButon(callbackId, text) {
  return cheama('answerCallbackQuery', { callback_query_id: callbackId, text, cache_time: 0 })
}

/** Mesaj care cere un răspuns (Telegram deschide direct tastatura de reply). */
export async function trimiteCuRaspuns(chatId, text, placeholder) {
  const rez = await cheama('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: { force_reply: true, input_field_placeholder: (placeholder || '').slice(0, 64) },
  })
  return rez?.message_id ?? null
}

/** Descarcă un fișier trimis botului (ex. mesaj vocal). */
export async function descarcaFisier(fileId) {
  const f = await cheama('getFile', { file_id: fileId })
  if (!f?.file_path) return null
  const r = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_LESSONS_BOT_TOKEN}/${f.file_path}`)
  return r.ok ? r.arrayBuffer() : null
}

const baza = () => process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://pyweb.online'

export const linkTask = (id) => `${baza()}/admin/tasks/${id}`
export const linkProgramari = (cheie) => `${baza()}/admin/programari${cheie ? `?zi=${cheie}` : ''}`

// ── Taskuri ─────────────────────────────────────────────────────────

/** „#7" ca link spre pagina taskului — clic-abil direct în Telegram. */
export function refTask(task) {
  const text = task.seq != null ? `#${task.seq}` : '#—'
  return `<a href="${linkTask(task.id)}">${text}</a>`
}

export function butonDeschide(task) {
  return [[{ text: task.seq != null ? `🔗 Deschide task #${task.seq}` : '🔗 Deschide task', url: linkTask(task.id) }]]
}

/** Butoanele de pe mesajul taskului (aceleași ca în StefanPWA). */
export function butoaneTask(task) {
  const id = task.id
  if (['DONE', 'CANCELLED'].includes(task.status)) {
    return [[{ text: '↩️ Redeschide task', callback_data: `TST:IN_PROGRESS:${id}` }], ...butonDeschide(task)]
  }
  return [
    [
      { text: '👁 Am citit', callback_data: `TST:READ:${id}` },
      { text: '▶️ Încep lucrul', callback_data: `TST:IN_PROGRESS:${id}` },
    ],
    [
      { text: '⏸ În așteptare', callback_data: `TST:ON_HOLD:${id}` },
      { text: '👀 La verificare', callback_data: `TST:REVIEW:${id}` },
    ],
    [
      { text: '✅ Am finalizat', callback_data: `TST:DONE:${id}` },
      { text: '✖️ Nu pot executa', callback_data: `TST:CANCELLED:${id}` },
    ],
    [0, 25, 50, 75, 100].map((p) => ({ text: `${p}%`, callback_data: `TPR:${p}:${id}` })),
    [
      { text: '💬 Comentariu', callback_data: `TCOMM:${id}` },
      { text: '🔗 Deschide', url: linkTask(id) },
    ],
  ]
}

/**
 * Textul complet al unui task — același la task nou, reamintire și după
 * apăsarea unui buton (mesajul se editează pe loc).
 */
export function textTask(task, { antet, nume = {}, proiect = null } = {}) {
  const st = statusTask(task.status)
  const pr = prioritate(task.priority)
  const linii = [antet || `📋 <b>Task</b> (${refTask(task)})`, `<b>${escapeHtml(task.title)}</b>`]
  if (task.description?.trim()) linii.push('', escapeHtml(task.description.trim().slice(0, 700)))
  linii.push('', `⚑ Prioritate: <b>${pr.label}</b>`)
  const asignati = (task.assigneeIds || []).map((id) => nume[id]).filter(Boolean)
  if (asignati.length) linii.push(`👤 Asignat: ${escapeHtml(asignati.join(', '))}`)
  if (proiect?.name) linii.push(`📁 Proiect: ${escapeHtml(proiect.name)}`)
  if (task.dueAt) {
    const intarziat = new Date(task.dueAt) < new Date() && !['DONE', 'CANCELLED'].includes(task.status)
    linii.push(`${intarziat ? '⚠️ Deadline depășit' : '📅 Deadline'}: <b>${dataOra(task.dueAt)}</b>`)
  }
  linii.push(`Status: <b>${st.label}</b>${task.progress ? ` · ${task.progress}%` : ''}`)
  const harta = proiect ? linkuriHarta(proiect) : null
  if (harta) {
    linii.push(
      `📍 <a href="${harta.google}">Google Maps</a> | <a href="${harta.waze}">Waze</a> | <a href="${harta.apple}">Apple Maps</a>`
    )
  }
  return linii.join('\n')
}

/** „🔔 Actualizare task" — status, progres sau comentariu (formatul din StefanPWA). */
export function textActualizare({ actor, task, eticheta: camp = 'Status', valoare }) {
  return [
    '🔔 <b>Actualizare task</b>',
    '',
    `Lucrător: ${escapeHtml(actor || 'Cineva')}`,
    `Task: ${escapeHtml(task.title)} (${refTask(task)})`,
    `${camp}: <b>${escapeHtml(valoare)}</b>`,
    `Ora: ${oraLocala(new Date())}`,
  ].join('\n')
}

/** Notificare scurtă pentru admini („observatori"). */
export function textScurt(titlu, corp) {
  return `🔔 <b>${titlu}</b>${corp ? `\n${escapeHtml(corp)}` : ''}`
}

// ── Meniul botului ──────────────────────────────────────────────────

export function meniu() {
  return [
    [{ text: '📋 Task-urile mele', callback_data: 'MY_TASKS' }],
    [
      { text: '📅 Azi', callback_data: 'TODAY' },
      { text: '📆 Mâine', callback_data: 'TOMORROW' },
    ],
    [
      { text: '🗓 Săptămâna', callback_data: 'WEEK' },
      { text: '➕ Adaugă', callback_data: 'ADD' },
    ],
    [{ text: '🎤 Voce', callback_data: 'VOICE' }],
  ]
}

// ── Programări ──────────────────────────────────────────────────────

/** Butoane per programare (în listele din bot). */
export function butoaneProgramareScurt(id) {
  return [
    [
      { text: '✅ Confirmă', callback_data: `pg:CONFIRMED:${id}` },
      { text: '✔️ Finalizat', callback_data: `pg:DONE:${id}` },
    ],
    [
      { text: '❌ Anulează', callback_data: `pg:CANCELLED:${id}` },
      { text: '🚫 No-show', callback_data: `pg:NO_SHOW:${id}` },
    ],
  ]
}

export function butoaneProgramare(p) {
  if (['DONE', 'CANCELLED', 'NO_SHOW'].includes(p.status)) {
    return [[{ text: '📅 Calendar', url: linkProgramari(p.dateKey) }]]
  }
  return [...butoaneProgramareScurt(p.id), [{ text: '📅 Calendar', url: linkProgramari(p.dateKey) }]]
}

export function textProgramare(p, { antet, nume = {}, proiect = null, lead = null } = {}) {
  const st = statusProgramare(p.status)
  const linii = [
    antet || '📅 <b>Programare</b>',
    `<b>${escapeHtml(p.title)}</b>`,
    '',
    `🗓 <b>${eticheta(p.dateKey, cheieZi())}</b>, ${oraLocala(p.startAt)}–${oraLocala(p.endAt)}`,
    `👤 ${escapeHtml(p.contactName)}${p.company ? ` · ${escapeHtml(p.company)}` : ''}`,
  ]
  if (p.contactPhone) linii.push(`📞 <a href="tel:${escapeHtml(p.contactPhone)}">${escapeHtml(p.contactPhone)}</a>`)
  if (p.contactEmail) linii.push(`✉️ ${escapeHtml(p.contactEmail)}`)
  if (lead?.denumire) linii.push(`🎯 Lead: ${escapeHtml(lead.denumire)}`)
  if (proiect?.name) linii.push(`📁 Proiect: ${escapeHtml(proiect.name)}`)
  if (p.location) {
    const h = linkuriHarta({ address: p.location })
    linii.push(`📍 ${escapeHtml(p.location)} — <a href="${h.google}">Maps</a> | <a href="${h.waze}">Waze</a>`)
  }
  if (p.message?.trim()) linii.push('', `📝 ${escapeHtml(p.message.trim().slice(0, 500))}`)
  if (p.responsabilId && nume[p.responsabilId]) linii.push(`🙋 Merge: ${escapeHtml(nume[p.responsabilId])}`)
  linii.push(`Status: <b>${st.label}</b>`)
  return linii.join('\n')
}
