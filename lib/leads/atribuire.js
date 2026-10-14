/**
 * Lead-ul ajunge direct la responsabil, în privat — ca în Olla-English-CRM
 * (notifyLeadAssigned). Când cineva devine responsabil (pus de mână, din
 * „Lead nou" sau automat la prima schimbare de status), primește pe Telegram
 * tot ce-i trebuie ca să sune, plus butoane de status.
 *
 * Butoanele trimit `wl:<STATUS>:<leadId>`, tratate în /api/telegram/webhook.
 */

import prisma from '@/lib/prisma'
import { getStatus, getSursa, getCalitate, VALORI_STATUS, STATUSURI_APEL } from './statusuri'
import { numarWhatsApp, linkWhatsApp } from './sabloane'
import { trimite, editeaza, raspundeButon, escapeHtml as esc } from '@/lib/lucru/telegram'

const baza = () => (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://pyweb.online').replace(/\/$/, '')

const SELECT = {
  id: true,
  denumire: true,
  telefon: true,
  telefonLocal: true,
  oras: true,
  adresa: true,
  categoriePrincipala: true,
  rating: true,
  nrRecenzii: true,
  siteUrl: true,
  calitateSite: true,
  scor: true,
  pitch: true,
  linkMaps: true,
  sursa: true,
  sursaDetaliu: true,
  status: true,
  urgent: true,
  nextFollowUpAt: true,
  tara: true,
  responsabilId: true,
  responsabil: { select: { id: true, name: true, email: true, telegramChatId: true } },
  notiteIstoric: { orderBy: { createdAt: 'desc' }, take: 1, select: { continut: true, createdAt: true } },
}

function cand(d) {
  return new Date(d).toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Chisinau',
  })
}

/** Liniile cu datele lead-ului (leadDetailLines din Olla, pentru firme). */
export function liniiLead(l) {
  const st = getStatus(l.status)
  const sursa = getSursa(l.sursa)
  const linii = [`🏢 Firmă: <b>${esc(l.denumire)}</b>${l.urgent ? ' 🔥' : ''}`]
  const tel = l.telefon || l.telefonLocal
  linii.push(`📱 Telefon: <b>${tel ? esc(tel) : 'N/A'}</b>`)
  const loc = [l.oras, l.adresa && l.adresa !== l.oras ? l.adresa : null].filter(Boolean).join(' · ')
  if (loc) linii.push(`📍 ${esc(loc)}`)
  if (l.categoriePrincipala) linii.push(`🏷️ ${esc(l.categoriePrincipala)}`)
  if (typeof l.rating === 'number') linii.push(`⭐ ${String(l.rating).replace('.', ',')} (${l.nrRecenzii || 0} recenzii)`)
  const calitate = l.calitateSite ? getCalitate(l.calitateSite) : null
  if (l.siteUrl) linii.push(`🌐 ${esc(l.siteUrl)}${calitate ? ` — ${esc(calitate.label)}` : ''}`)
  else linii.push('🌐 <b>Nu are site</b>')
  linii.push(`📥 Sursă: <b>${esc(sursa.label)}</b>${l.sursaDetaliu ? ` — ${esc(l.sursaDetaliu)}` : ''}`)

  linii.push('', `📊 Status: ${st.emoji} <b>${esc(st.label)}</b> · scor ${l.scor ?? 0}`)
  const resp = l.responsabil?.name || l.responsabil?.email
  linii.push(`🙋 Responsabil: ${resp ? `<b>${esc(resp)}</b>` : '<i>nimeni încă</i>'}`)
  linii.push(l.nextFollowUpAt ? `🔔 Recontactare: <b>${cand(l.nextFollowUpAt)}</b>` : '🔔 Recontactare: <i>nesetată</i>')

  const ultima = l.notiteIstoric?.[0]
  if (ultima) {
    const t = ultima.continut.length > 200 ? `${ultima.continut.slice(0, 200)}…` : ultima.continut
    linii.push('', `📝 Ultima notiță: <i>${esc(t)}</i>`)
  } else if (l.pitch) {
    const p = l.pitch.length > 220 ? `${l.pitch.slice(0, 220)}…` : l.pitch
    linii.push('', `💡 Deschidere: <i>„${esc(p)}”</i>`)
  }
  linii.push('', `<a href="${baza()}/admin/leads/${l.id}">Deschide fișa în CRM</a>`)
  return linii
}

/** Butoanele de status (buildLeadKeyboard din Olla, cu statusurile lead-urilor web). */
export function butoaneLead(l) {
  const rand = (a, b) => [
    { text: `${getStatus(a).emoji} ${getStatus(a).scurt}`, callback_data: `wl:${a}:${l.id}` },
    { text: `${getStatus(b).emoji} ${getStatus(b).scurt}`, callback_data: `wl:${b}:${l.id}` },
  ]
  const randuri = [
    rand('SUNAT', 'FARA_RASPUNS'),
    rand('INTERESAT', 'INTALNIRE_PROGRAMATA'),
    rand('OFERTA_TRIMISA', 'CLIENT'),
    rand('REFUZ', 'NUMAR_GRESIT'),
  ]
  const legaturi = []
  const nr = numarWhatsApp(l)
  if (nr && l.status !== 'FARA_WHATSAPP') legaturi.push({ text: '💬 WhatsApp', url: linkWhatsApp(nr, '') })
  if (l.linkMaps) legaturi.push({ text: '🗺 Maps', url: l.linkMaps })
  legaturi.push({ text: '🔗 Fișa', url: `${baza()}/admin/leads/${l.id}` })
  randuri.push(legaturi)
  return randuri
}

/**
 * Anunță responsabilul în privat. `actor` = cine a făcut schimbarea,
 * `auto` = a devenit responsabil schimbând statusul unui lead liber.
 * Întoarce true dacă mesajul a plecat.
 */
export async function anuntaResponsabil(leadId, { actor = null, auto = false } = {}) {
  const l = await prisma.webLead.findUnique({ where: { id: leadId }, select: SELECT })
  const chat = l?.responsabil?.telegramChatId
  if (!chat) return false

  const eu = actor?.id === l.responsabilId
  const antet = eu
    ? auto
      ? '🙋 <b>Ai preluat lead-ul</b> — de acum e al tău'
      : '🎯 <b>Ești responsabil de acest lead</b>'
    : `👤 <b>Ți-a fost atribuit un lead</b>${actor?.name ? ` — de la ${esc(actor.name)}` : ''}`

  const msg = [antet, '', ...liniiLead(l)].join('\n')
  return Boolean(await trimite(chat, msg, butoaneLead(l)))
}

/** Butoanele `wl:` din webhook: schimbă statusul și editează mesajul pe loc. */
export async function trateazaButonLead({ id: callbackId, data, message }) {
  const chatId = message?.chat?.id
  const [, status, leadId] = String(data).split(':')
  if (!VALORI_STATUS.includes(status) || !/^[a-f\d]{24}$/i.test(leadId || '')) {
    await raspundeButon(callbackId, '❌ Date invalide')
    return
  }

  const om = await prisma.user.findFirst({
    where: { telegramChatId: String(chatId), active: true },
    select: { id: true, name: true, email: true, role: true, permissions: true },
  })
  const poate = om && (om.role === 'SUPERADMIN' || (om.role === 'ADMIN' && (om.permissions || []).includes('leads.manage')))
  if (!poate) {
    await raspundeButon(callbackId, '❌ Nu ai voie să schimbi lead-uri (leads.manage).')
    return
  }

  const vechi = await prisma.webLead.findUnique({ where: { id: leadId }, select: { responsabilId: true, status: true } })
  if (!vechi) {
    await raspundeButon(callbackId, '❌ Lead inexistent')
    return
  }

  const date = { status }
  if (STATUSURI_APEL.includes(status)) date.dataApel = new Date()
  // Ca în panou: cine lucrează primul un lead liber îl preia
  if (!vechi.responsabilId && status !== 'DE_SUNAT') date.responsabilId = om.id

  await prisma.webLead.update({ where: { id: leadId }, data: date })
  if (vechi.status !== status) {
    await prisma.webLeadNota
      .create({
        data: {
          webLeadId: leadId,
          continut: `Status: ${getStatus(vechi.status).label} → ${getStatus(status).label} (din Telegram, ${om.name || om.email})`,
          autorNume: om.name || om.email,
        },
      })
      .catch(() => {})
  }

  const l = await prisma.webLead.findUnique({ where: { id: leadId }, select: SELECT })
  const antet = String(message?.text || '').split('\n')[0]
  await Promise.all([
    raspundeButon(callbackId, `${getStatus(status).emoji} ${getStatus(status).label}`),
    editeaza(chatId, message.message_id, [`<b>${esc(antet)}</b>`, '', ...liniiLead(l)].join('\n'), butoaneLead(l)),
  ])
}
