/**
 * Telegram pentru taskuri și programări — același bot ca la leaduri
 * (TELEGRAM_LESSONS_BOT_TOKEN), mesaje în privat către cine și-a legat contul
 * din Securitate → Telegram.
 *
 * Butoanele trimit `callback_data` scurte, tratate în /api/telegram/webhook:
 *   tk:<STATUS>:<taskId>   — schimbă statusul taskului
 *   tp:<procent>:<taskId>  — schimbă progresul
 *   pg:<STATUS>:<apptId>   — schimbă statusul programării
 */

import { statusTask, prioritate, refScurt, statusProgramare, linkuriHarta } from './constante'
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
  if (!telegramConfigurat()) return null
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
  return cheama('answerCallbackQuery', { callback_query_id: callbackId, text })
}

const baza = () => process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://pyweb.online'

export const linkTask = (id) => `${baza()}/admin/tasks/${id}`
export const linkProgramari = (cheie) => `${baza()}/admin/programari${cheie ? `?zi=${cheie}` : ''}`

// ── Taskuri ─────────────────────────────────────────────────────────

export function butoaneTask(task) {
  if (['DONE', 'CANCELLED'].includes(task.status)) return null
  const id = task.id
  const rand1 = []
  if (task.status !== 'IN_PROGRESS') rand1.push({ text: '🛠️ În lucru', callback_data: `tk:IN_PROGRESS:${id}` })
  if (task.status !== 'ON_HOLD') rand1.push({ text: '⏸️ Pauză', callback_data: `tk:ON_HOLD:${id}` })
  rand1.push({ text: '✅ Gata', callback_data: `tk:DONE:${id}` })
  const rand2 = [25, 50, 75].map((p) => ({ text: `${p}%`, callback_data: `tp:${p}:${id}` }))
  if (task.status !== 'REVIEW') rand2.push({ text: '🔍 Verificare', callback_data: `tk:REVIEW:${id}` })
  return [rand1, rand2, [{ text: '🔗 Deschide', url: linkTask(id) }]]
}

/**
 * Textul complet al unui task — același la task nou, reamintire și după
 * apăsarea unui buton (mesajul se editează pe loc).
 */
export function textTask(task, { antet, nume = {}, proiect = null } = {}) {
  const st = statusTask(task.status)
  const pr = prioritate(task.priority)
  const linii = [antet || `📋 <b>Task</b> ${refScurt(task.seq)}`, `<b>${escapeHtml(task.title)}</b>`]
  if (task.description?.trim()) linii.push('', escapeHtml(task.description.trim().slice(0, 700)))
  linii.push('', `${pr.emoji} Prioritate: <b>${pr.label}</b>`, `${st.emoji} Status: <b>${st.label}</b>`)
  if (task.progress) linii.push(`📈 Progres: <b>${task.progress}%</b>`)
  const asignati = (task.assigneeIds || []).map((id) => nume[id]).filter(Boolean)
  if (asignati.length) linii.push(`👤 Asignat: ${escapeHtml(asignati.join(', '))}`)
  if (task.creatorId && nume[task.creatorId]) linii.push(`✍️ Creat de: ${escapeHtml(nume[task.creatorId])}`)
  if (proiect?.name) linii.push(`📁 Proiect: ${escapeHtml(proiect.name)}`)
  if (task.dueAt) {
    const intarziat = new Date(task.dueAt) < new Date() && !['DONE', 'CANCELLED'].includes(task.status)
    linii.push(`${intarziat ? '⚠️ Termen depășit' : '📅 Termen'}: <b>${dataOra(task.dueAt)}</b>`)
  }
  const harta = proiect ? linkuriHarta(proiect) : null
  if (harta) {
    linii.push(
      `📍 <a href="${harta.google}">Google Maps</a> | <a href="${harta.waze}">Waze</a> | <a href="${harta.apple}">Apple</a>`
    )
  }
  return linii.join('\n')
}

// ── Programări ──────────────────────────────────────────────────────

export function butoaneProgramare(p) {
  if (['DONE', 'CANCELLED', 'NO_SHOW'].includes(p.status)) return null
  const id = p.id
  const rand = []
  if (p.status !== 'CONFIRMED') rand.push({ text: '✅ Confirmată', callback_data: `pg:CONFIRMED:${id}` })
  rand.push({ text: '🏁 Încheiată', callback_data: `pg:DONE:${id}` })
  return [
    rand,
    [
      { text: '❌ Anulată', callback_data: `pg:CANCELLED:${id}` },
      { text: '🚫 Nu a venit', callback_data: `pg:NO_SHOW:${id}` },
    ],
    [{ text: '📅 Calendar', url: linkProgramari(p.dateKey) }],
  ]
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
  linii.push(`${st.emoji} Status: <b>${st.label}</b>`)
  return linii.join('\n')
}
