/**
 * Programările: întâlniri cu oricine (antreprenor, client, partener).
 *
 * Contactul e text liber; opțional programarea se leagă de un lead web sau de
 * un proiect — atunci numele/telefonul se completează din ele, dar rămân
 * editabile. Reminderele pleacă DOAR spre echipă (responsabilul), pe
 * Telegram — niciodată automat spre contact.
 */

import prisma from '@/lib/prisma'
import {
  VALORI_STATUS_PROGRAMARE,
  CHEI_REMINDER,
  REMINDERE_IMPLICITE,
  STATUSURI_PROGRAMARE_INCHISE,
  statusProgramare,
  idSauNull,
} from './constante'
import { momentLocal, adaugaZile, oraLocala } from './timp'
import { echipa, harteNume } from './echipa'
import { trimite, textProgramare, butoaneProgramare, escapeHtml } from './telegram'

export const SELECT_PROGRAMARE = {
  id: true,
  title: true,
  message: true,
  status: true,
  startAt: true,
  endAt: true,
  dateKey: true,
  contactName: true,
  contactPhone: true,
  contactEmail: true,
  company: true,
  location: true,
  leadId: true,
  projectId: true,
  categoryId: true,
  creatorId: true,
  responsabilId: true,
  reminderOffsets: true,
  remindersSent: true,
  createdAt: true,
  project: { select: { id: true, name: true, seq: true } },
  category: { select: { id: true, name: true, color: true } },
}

/** Momentul în care pleacă un reminder. */
export function momentReminder(cheie, startAt, dateKey) {
  const start = new Date(startAt).getTime()
  switch (cheie) {
    case 'DAY_BEFORE_8AM':
      return momentLocal(adaugaZile(dateKey, -1), '08:00')
    case 'H3':
      return new Date(start - 3 * 3600000)
    case 'H1':
      return new Date(start - 3600000)
    case 'M30':
      return new Date(start - 30 * 60000)
    case 'M10':
      return new Date(start - 10 * 60000)
    default:
      return null
  }
}

function curataRemindere(lista) {
  return [...new Set((Array.isArray(lista) ? lista : []).filter((k) => CHEI_REMINDER.includes(k)))]
}

/** Remindere care oricum ar fi în trecut (ex. „cu o zi înainte" la o programare de azi) se marchează trimise. */
function deJaTrecute(offsets, startAt, dateKey, acum = new Date()) {
  return offsets.filter((k) => {
    const t = momentReminder(k, startAt, dateKey)
    return t && t <= acum
  })
}

/** Datele din formular → câmpuri Prisma. Aruncă Error cu mesaj pentru om. */
export async function normalizeaza(corp, vechi = null) {
  const date = {}

  // Data + ora + durata
  const dateKey = corp.dateKey ?? vechi?.dateKey
  const ora = corp.time ?? (vechi ? oraLocala(vechi.startAt) : null)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || '')) throw new Error('Alege ziua.')
  if (!/^\d{1,2}:\d{2}$/.test(ora || '')) throw new Error('Alege ora.')
  const durataVeche = vechi ? Math.round((new Date(vechi.endAt) - new Date(vechi.startAt)) / 60000) : null
  let durata = Number(corp.durationMinutes ?? durataVeche)
  if (!durata && idSauNull(corp.categoryId)) {
    const c = await prisma.category.findUnique({ where: { id: corp.categoryId }, select: { defaultDurationMinutes: true } }).catch(() => null)
    durata = c?.defaultDurationMinutes
  }
  durata = Math.max(5, Math.min(Number(durata) || 60, 24 * 60))
  const startAt = momentLocal(dateKey, ora)
  date.dateKey = dateKey
  date.startAt = startAt
  date.endAt = new Date(startAt.getTime() + durata * 60000)

  // Legături opționale
  if (corp.leadId !== undefined) date.leadId = idSauNull(corp.leadId)
  if (corp.projectId !== undefined) {
    if (idSauNull(corp.projectId)) {
      const p = await prisma.project.findUnique({ where: { id: corp.projectId }, select: { id: true } }).catch(() => null)
      if (!p) throw new Error('Proiectul nu există.')
      date.projectId = p.id
    } else date.projectId = null
  }
  if (corp.categoryId !== undefined) date.categoryId = idSauNull(corp.categoryId)

  // Contactul — dacă lipsește numele, îl luăm din lead / proiect
  const text = (v, max = 200) => (v === undefined ? undefined : String(v || '').trim().slice(0, max) || null)
  for (const [camp, max] of [['contactPhone', 40], ['contactEmail', 120], ['company', 150], ['location', 300], ['message', 3000]]) {
    const v = text(corp[camp], max)
    if (v !== undefined) date[camp] = v
  }
  let nume = text(corp.contactName, 150)
  const leadId = date.leadId !== undefined ? date.leadId : vechi?.leadId
  if (leadId && (!nume || date.contactPhone === null || date.company === null)) {
    const lead = await prisma.webLead
      .findUnique({ where: { id: leadId }, select: { denumire: true, telefon: true } })
      .catch(() => null)
    if (lead) {
      if (!nume) nume = lead.denumire
      if (!date.contactPhone && !vechi?.contactPhone) date.contactPhone = lead.telefon || null
      if (!date.company && !vechi?.company) date.company = lead.denumire
    }
  }
  if (nume !== undefined && nume !== null) date.contactName = nume
  if (!vechi && !date.contactName) throw new Error('Scrie cu cine e întâlnirea.')

  const titlu = text(corp.title, 200)
  if (titlu !== undefined) date.title = titlu
  if (!vechi && !date.title) date.title = 'Întâlnire'

  if (corp.responsabilId !== undefined) date.responsabilId = idSauNull(corp.responsabilId)
  if (corp.status !== undefined) {
    if (!VALORI_STATUS_PROGRAMARE.includes(corp.status)) throw new Error('Status invalid.')
    date.status = corp.status
  }
  if (corp.reminderOffsets !== undefined) date.reminderOffsets = curataRemindere(corp.reminderOffsets)

  return date
}

/** Prima programare activă care se suprapune cu intervalul (pentru același responsabil). */
export async function gasesteSuprapunere({ startAt, endAt, responsabilId, exceptId = null }) {
  if (!responsabilId) return null
  const lista = await prisma.appointment.findMany({
    where: {
      responsabilId,
      status: { notIn: STATUSURI_PROGRAMARE_INCHISE },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true, contactName: true, title: true, startAt: true },
    take: 3,
  })
  return lista.find((p) => p.id !== exceptId) || null
}

export async function creeazaProgramare(actor, corp, { ignoraSuprapunere = false } = {}) {
  const date = await normalizeaza(corp)
  if (date.responsabilId === undefined) date.responsabilId = actor.id
  const offsets = date.reminderOffsets ?? REMINDERE_IMPLICITE

  if (!ignoraSuprapunere) {
    const s = await gasesteSuprapunere(date)
    if (s) {
      const e = new Error(`Ora e ocupată: ${s.contactName} la ${oraLocala(s.startAt)}.`)
      e.suprapunere = true
      throw e
    }
  }

  const p = await prisma.appointment.create({
    data: {
      ...date,
      creatorId: actor.id,
      reminderOffsets: offsets,
      remindersSent: deJaTrecute(offsets, date.startAt, date.dateKey),
    },
    select: SELECT_PROGRAMARE,
  })

  // Responsabilul (dacă nu e chiar cel care a creat-o) află pe loc
  // Cine merge la întâlnire primește programarea pe Telegram (și când și-o pune singur)
  if (p.responsabilId) {
    const deLa = p.responsabilId !== actor.id ? ` — de la ${escapeHtml(actor.name || '')}` : ''
    await anunta(p, `🆕 <b>Programare nouă</b>${deLa}`).catch(() => {})
  }
  return p
}

export async function actualizeazaProgramare(id, actor, corp, { ignoraSuprapunere = false } = {}) {
  const vechi = await prisma.appointment.findUnique({ where: { id }, select: SELECT_PROGRAMARE })
  if (!vechi) throw new Error('Programarea nu există.')
  const date = await normalizeaza(corp, vechi)

  const mutata =
    new Date(date.startAt).getTime() !== new Date(vechi.startAt).getTime() ||
    new Date(date.endAt).getTime() !== new Date(vechi.endAt).getTime()
  const responsabil = date.responsabilId !== undefined ? date.responsabilId : vechi.responsabilId

  if (mutata && !ignoraSuprapunere) {
    const s = await gasesteSuprapunere({ startAt: date.startAt, endAt: date.endAt, responsabilId: responsabil, exceptId: id })
    if (s) {
      const e = new Error(`Ora e ocupată: ${s.contactName} la ${oraLocala(s.startAt)}.`)
      e.suprapunere = true
      throw e
    }
  }

  // Reprogramată sau remindere schimbate → reminderele se recalculează
  const offsets = date.reminderOffsets ?? vechi.reminderOffsets
  if (mutata || date.reminderOffsets) {
    date.remindersSent = deJaTrecute(offsets, date.startAt, date.dateKey)
  }

  const p = await prisma.appointment.update({ where: { id }, data: date, select: SELECT_PROGRAMARE })

  if (mutata && p.responsabilId && p.responsabilId !== actor.id) {
    await anunta(p, `🔁 <b>Programare mutată</b> de ${escapeHtml(actor.name || '')}`).catch(() => {})
  } else if (date.responsabilId && date.responsabilId !== vechi.responsabilId && date.responsabilId !== actor.id) {
    await anunta(p, `🙋 <b>Ți-a fost dată o programare</b> — de ${escapeHtml(actor.name || '')}`).catch(() => {})
  }
  return p
}

export async function schimbaStatusProgramare(id, actor, status) {
  if (!VALORI_STATUS_PROGRAMARE.includes(status)) throw new Error('Status invalid.')
  const p = await prisma.appointment.update({ where: { id }, data: { status }, select: SELECT_PROGRAMARE })
  if (p.responsabilId && p.responsabilId !== actor.id && STATUSURI_PROGRAMARE_INCHISE.includes(status)) {
    const st = statusProgramare(status)
    await anunta(p, `${st.emoji} <b>${escapeHtml(actor.name || '')}</b> a marcat programarea: <b>${st.label}</b>`, false).catch(() => {})
  }
  return p
}

async function context(p, oameni) {
  const [lead] = await Promise.all([
    p.leadId ? prisma.webLead.findUnique({ where: { id: p.leadId }, select: { denumire: true } }).catch(() => null) : null,
  ])
  return { nume: harteNume(oameni), proiect: p.project, lead }
}

/** Trimite programarea responsabilului (cu butoane). */
async function anunta(p, antet, cuButoane = true, oameni = null) {
  const lista = oameni || (await echipa())
  const om = lista.find((o) => o.id === p.responsabilId)
  if (!om?.telegramChatId) return null
  const ctx = await context(p, lista)
  return trimite(om.telegramChatId, textProgramare(p, { antet, ...ctx }), cuButoane ? butoaneProgramare(p) : null)
}

/** Textul de după apăsarea unui buton în Telegram. */
export async function textDupaButon(p) {
  const oameni = await echipa()
  return textProgramare(p, await context(p, oameni))
}

const ANTET_REMINDER = {
  DAY_BEFORE_8AM: '🔔 <b>Mâine ai o programare</b>',
  H3: '🔔 <b>Programare peste 3 ore</b>',
  H1: '🔔 <b>Programare peste o oră</b>',
  M30: '⏳ <b>Programare peste 30 de minute</b>',
  M10: '⏳ <b>Programare peste 10 minute</b>',
}

/** Cron: trimite reminderele scadente. Fiecare prag pleacă o singură dată. */
export async function trimiteRemindereProgramari(acum = new Date()) {
  // Cel mai devreme reminder e cu o zi înainte la 08:00 → maxim ~40h înainte
  const lista = await prisma.appointment.findMany({
    where: {
      status: { in: ['NEW', 'CONFIRMED'] },
      startAt: { gt: acum, lt: new Date(acum.getTime() + 42 * 3600000) },
    },
    select: SELECT_PROGRAMARE,
    take: 300,
  })

  let oameni = null
  let trimise = 0
  let fara = 0
  for (const p of lista) {
    const scadente = (p.reminderOffsets || []).filter((k) => {
      if ((p.remindersSent || []).includes(k)) return false
      const t = momentReminder(k, p.startAt, p.dateKey)
      return t && t <= acum
    })
    if (!scadente.length) continue

    // Marcăm înainte de trimitere: două rulări suprapuse nu dublează
    await prisma.appointment.update({
      where: { id: p.id },
      data: { remindersSent: [...new Set([...(p.remindersSent || []), ...scadente])] },
    })

    // Dacă s-au strâns mai multe (cron oprit o vreme), trimitem doar cel mai apropiat
    const cheie = scadente[scadente.length - 1]
    oameni = oameni || (await echipa())
    const destinatar = p.responsabilId || p.creatorId
    const msg = await anunta({ ...p, responsabilId: destinatar }, ANTET_REMINDER[cheie] || '🔔 <b>Reminder</b>', true, oameni)
    if (msg) trimise++
    else fara++
  }
  return { verificate: lista.length, trimise, faraTelegram: fara }
}
