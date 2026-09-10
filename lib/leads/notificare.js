/**
 * Mementoul de recontactare pentru lead-urile web.
 *
 * Două reguli care contează:
 *
 *  1. Fiecare om primește DOAR firmele lui. Dacă un lead are un responsabil
 *     care și-a legat contul de Telegram, mesajul îi pleacă în privat. Restul
 *     (fără responsabil, sau cu unul care nu și-a legat contul) merg în
 *     chat-ul comun de admin.
 *
 *  2. Mesajul conține tot ce-ți trebuie ca să suni fără să deschizi laptopul:
 *     numărul, ce e prost la site-ul lor, ce ai vorbit ultima dată și fraza
 *     de deschidere.
 */

import prisma from '@/lib/prisma'
import { sendTelegramMessage } from '@/lib/telegram'

const CALITATI = {
  LIPSA: 'nu are site',
  MORT: 'site mort',
  DOAR_SOCIAL: 'doar social media',
  FARA_HTTPS: 'fără HTTPS',
  NEADAPTAT_MOBIL: 'nu merge pe telefon',
  LENT: 'site lent',
  OK: 'site funcțional',
}

/** Scapă caracterele care ar strica formatarea HTML a Telegramului. */
function esc(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function ora(d) {
  const x = new Date(d)
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
}

function ziScurta(d) {
  const x = new Date(d)
  return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Cum arată o firmă în mesaj — tot ce-ți trebuie ca să dai telefonul.
 */
function descrieLead(l, restant) {
  const linii = []

  linii.push(`${restant ? '🔴' : '🟠'} <b>${esc(l.denumire)}</b>`)

  // Telefonul pe rând separat: pe Telegram e apăsabil direct.
  if (l.telefon) linii.push(`   📞 ${esc(l.telefon)}`)
  else if (l.siteUrl) linii.push(`   💬 fără telefon — scrie pe ${esc(l.siteUrl)}`)

  // De ce merită sunat
  const detalii = []
  if (typeof l.rating === 'number') {
    detalii.push(`⭐ ${String(l.rating).replace('.', ',')} (${l.nrRecenzii} rec.)`)
  }
  if (l.calitateSite) detalii.push(CALITATI[l.calitateSite] || l.calitateSite)
  if (l.oras) detalii.push(l.oras)
  if (detalii.length) linii.push(`   ${esc(detalii.join(' · '))}`)

  linii.push(`   scor <b>${l.scor}</b> · ${esc(l.statusEticheta)} · programat ${ora(l.nextFollowUpAt)}`)

  // Ce s-a discutat ultima dată — cel mai util lucru înainte de un apel
  const ultima = l.notiteIstoric?.[0]
  if (ultima) {
    const text = ultima.continut.length > 90 ? `${ultima.continut.slice(0, 90)}…` : ultima.continut
    linii.push(`   📝 <i>${esc(text)}</i> <s>(${ziScurta(ultima.createdAt)})</s>`)
  }

  // Fraza de deschidere, dacă n-a mai fost sunat niciodată
  if (!l.notiteIstoric?.length && l.pitch) {
    const p = l.pitch.length > 110 ? `${l.pitch.slice(0, 110)}…` : l.pitch
    linii.push(`   💡 <i>„${esc(p)}"</i>`)
  }

  return linii.join('\n')
}

/** Construiește mesajul pentru un set de firme. */
function construiesteMesaj(leaduri, pentruCine) {
  const restante = leaduri.filter((l) => l.restant)
  const azi = leaduri.filter((l) => !l.restant)

  let msg = `⏰ <b>DE RECONTACTAT — ${leaduri.length} ${leaduri.length === 1 ? 'firmă' : 'firme'}</b>`
  if (pentruCine) msg += `\n<i>${esc(pentruCine)}</i>`
  msg += '\n'

  if (restante.length) {
    msg += `\n<b>🔴 Restante (${restante.length})</b>\n`
    msg += restante.map((l) => descrieLead(l, true)).join('\n\n')
    msg += '\n'
  }

  if (azi.length) {
    msg += `\n<b>🟠 Azi (${azi.length})</b>\n`
    msg += azi.map((l) => descrieLead(l, false)).join('\n\n')
    msg += '\n'
  }

  const baza = process.env.NEXT_PUBLIC_APP_URL || ''
  msg += `\n👉 ${baza}/admin/leads`

  return msg
}

/**
 * Trimite mementourile. Fiecare responsabil primește doar firmele lui, în
 * privat; restul merg în chat-ul comun.
 *
 * @param {Array} leaduri  firme scadente, fiecare cu `restant` și `responsabil`
 * @returns {Promise<{trimise: number, destinatari: string[], esecuri: string[]}>}
 */
export async function trimiteMementouri(leaduri) {
  const token = process.env.TELEGRAM_LESSONS_BOT_TOKEN
  const chatAdmin = process.env.TELEGRAM_ADMIN_CHAT_ID
  const threadAdmin = process.env.TELEGRAM_ADMIN_THREAD_ID

  if (!token) {
    return { trimise: 0, destinatari: [], esecuri: ['Lipsește TELEGRAM_LESSONS_BOT_TOKEN'] }
  }

  // Grupăm pe destinatar: cine are responsabil cu Telegram legat primește
  // în privat, restul cad în grămada comună.
  const peDestinatar = new Map()
  const comune = []

  for (const l of leaduri) {
    const chat = l.responsabil?.telegramChatId
    if (chat) {
      if (!peDestinatar.has(chat)) {
        peDestinatar.set(chat, { nume: l.responsabil.name || l.responsabil.email, leaduri: [] })
      }
      peDestinatar.get(chat).leaduri.push(l)
    } else {
      comune.push(l)
    }
  }

  const destinatari = []
  const esecuri = []
  let trimise = 0

  // ── Mesaje private ────────────────────────────────────────────
  for (const [chatId, date] of peDestinatar) {
    const ok = await sendTelegramMessage(
      token,
      chatId,
      construiesteMesaj(date.leaduri, `pentru ${date.nume}`),
      'HTML'
    )
    if (ok) {
      trimise += date.leaduri.length
      destinatari.push(`${date.nume} (privat)`)
    } else {
      esecuri.push(`${date.nume}: Telegram a refuzat mesajul`)
      comune.push(...date.leaduri) // nu pierdem firmele — merg în chat-ul comun
    }
  }

  // ── Restul, în chat-ul comun ──────────────────────────────────
  if (comune.length) {
    if (!chatAdmin) {
      esecuri.push('Lipsește TELEGRAM_ADMIN_CHAT_ID — firmele fără responsabil n-au unde fi trimise')
    } else {
      const ok = await sendTelegramMessage(
        token,
        chatAdmin,
        construiesteMesaj(comune, comune.some((l) => l.responsabil) ? null : 'fără responsabil'),
        'HTML',
        threadAdmin
      )
      if (ok) {
        trimise += comune.length
        destinatari.push('chat-ul comun')
      } else {
        esecuri.push('Chat-ul comun: Telegram a refuzat mesajul')
      }
    }
  }

  return { trimise, destinatari, esecuri }
}

/** Firmele scadente, cu tot ce-i trebuie mesajului. */
export async function leaduriScadente({ forteaza = false } = {}) {
  const acum = new Date()
  const sfarsitulZilei = new Date(acum)
  sfarsitulZilei.setHours(23, 59, 59, 999)

  const scadente = await prisma.webLead.findMany({
    where: {
      nextFollowUpAt: { not: null, lte: sfarsitulZilei },
      status: { notIn: ['REFUZ', 'NU_MA_SUNA', 'CLIENT'] },
    },
    orderBy: [{ nextFollowUpAt: 'asc' }],
    include: {
      responsabil: { select: { id: true, name: true, email: true, telegramChatId: true } },
      notiteIstoric: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  const deAnuntat = forteaza
    ? scadente
    : scadente.filter((l) => !l.followUpNotificatLa || l.followUpNotificatLa < l.nextFollowUpAt)

  return {
    toate: scadente,
    deAnuntat: deAnuntat.map((l) => ({ ...l, restant: new Date(l.nextFollowUpAt) < acum })),
  }
}
