/**
 * Botul de Telegram pentru taskuri și programări — comportamentul din
 * StefanPWA (lib/services/telegram-bot.ts), pe botul PyWeb:
 *
 *  - /menu, /start (cont deja legat) → meniul cu butoane
 *  - /tasks, „📋 Task-urile mele" → taskurile deschise, fiecare cu „Detalii"
 *  - „📅 Azi" / „📆 Mâine" / „🗓 Săptămâna" → programările + taskurile scadente
 *  - butoanele de pe taskuri: status, progres, comentariu, redeschidere
 *  - comentariu = răspuns (reply) la mesajul „💬 Comentariu la task #N"
 *    sau la orice mesaj al unui task
 *  - mesaj vocal → task (sau programare, dacă spui ziua și ora unei întâlniri)
 *
 * Cine scrie e găsit după chat-ul legat din Securitate → Telegram.
 */

import prisma from '@/lib/prisma'
import { echipa, harteNume } from './echipa'
import {
  trimite,
  editeaza,
  raspundeButon,
  trimiteCuRaspuns,
  descarcaFisier,
  meniu,
  textTask,
  butoaneTask,
  butonDeschide,
  refTask,
  butoaneProgramare,
  butoaneProgramareScurt,
  escapeHtml,
} from './telegram'
import {
  STATUSURI_TASK_INCHISE,
  VALORI_STATUS_TASK,
  statusTask,
  prioritate,
  statusProgramare,
} from './constante'
import { cheieZi, adaugaZile, momentLocal, inceputSaptamana, eticheta, oraLocala, dataOra } from './timp'
import { SELECT_TASK, schimbaStatus, schimbaProgres, adaugaComentariu, creeazaTask, poateModifica } from './taskuri'
import { schimbaStatusProgramare, textDupaButon, creeazaProgramare } from './programari'

const OBJECT_ID = /^[a-f\d]{24}$/i

/** Prefixele de callback tratate aici (restul rămân în webhook: lecții, contact). */
export function esteCallbackLucru(data) {
  return /^(TST|TPR|TCOMM|TDET|tk|tp|pg):/.test(data || '') || ['MY_TASKS', 'TODAY', 'TOMORROW', 'WEEK', 'ADD', 'VOICE', 'MENU'].includes(data)
}

async function omDupaChat(chatId) {
  const u = await prisma.user.findFirst({
    where: { telegramChatId: String(chatId), active: true },
    select: { id: true, name: true, email: true, role: true, permissions: true },
  })
  if (!u || !['SUPERADMIN', 'ADMIN'].includes(u.role)) return null
  return { id: u.id, name: u.name || u.email, role: u.role, permissions: u.permissions || [] }
}

const are = (om, p) => om.role === 'SUPERADMIN' || om.permissions.includes(p)

const NELEGAT =
  '🔗 Contul nu e legat.\n\nDeschide panoul PyWeb: Securitate → Telegram → <b>Conectează</b>, apoi apasă linkul de acolo.'

// ── Ecrane ──────────────────────────────────────────────────────────

async function taskurileMele(chatId, om) {
  const taskuri = await prisma.task.findMany({
    where: { assigneeIds: { has: om.id }, status: { notIn: STATUSURI_TASK_INCHISE } },
    select: { id: true, seq: true, title: true, status: true, priority: true, progress: true, dueAt: true },
    orderBy: [{ updatedAt: 'desc' }],
    take: 15,
  })
  if (!taskuri.length) {
    await trimite(chatId, '📋 Nu ai task-uri active momentan.', meniu())
    return
  }
  await trimite(chatId, `📋 <b>Task-urile tale</b> (${taskuri.length})`)
  for (const t of taskuri) {
    const linie =
      `${refTask(t)} <b>${escapeHtml(t.title)}</b>\n` +
      `${statusTask(t.status).label} · ${prioritate(t.priority).label}${t.progress > 0 ? ` · ${t.progress}%` : ''}` +
      (t.dueAt ? `\n📅 ${dataOra(t.dueAt)}` : '')
    await trimite(chatId, linie, [
      [{ text: 'ℹ️ Detalii', callback_data: `TDET:${t.id}` }],
      [{ text: '◀️ Înapoi', callback_data: 'MENU' }],
    ])
  }
}

async function detaliiTask(chatId, om, taskId) {
  const t = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      ...SELECT_TASK,
      comments: { orderBy: { createdAt: 'desc' }, take: 3, select: { body: true, userName: true } },
    },
  })
  if (!t) {
    await trimite(chatId, '❌ Task inexistent.', meniu())
    return
  }
  const nume = harteNume(await echipa())
  let text = textTask(t, { nume, proiect: t.project })
  if (t.comments.length) {
    text +=
      '\n\n💬 <b>Ultimele comentarii</b>\n' +
      t.comments
        .slice()
        .reverse()
        .map((c) => `• ${escapeHtml(c.userName || '—')}: ${escapeHtml(c.body.slice(0, 200))}`)
        .join('\n')
  }
  await trimite(chatId, text, butoaneTask(t))
}

/** Programările unei zile + taskurile mele scadente atunci. */
async function zi(chatId, om, cheie) {
  const [programari, taskuri] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        dateKey: cheie,
        OR: [{ responsabilId: om.id }, { creatorId: om.id, responsabilId: null }],
      },
      orderBy: { startAt: 'asc' },
      take: 12,
    }),
    prisma.task.findMany({
      where: {
        assigneeIds: { has: om.id },
        status: { notIn: STATUSURI_TASK_INCHISE },
        dueAt: { gte: momentLocal(cheie), lt: momentLocal(adaugaZile(cheie, 1)) },
      },
      select: { id: true, seq: true, title: true, status: true, priority: true, progress: true },
      take: 15,
    }),
  ])

  const titlu = eticheta(cheie, cheieZi())
  if (!programari.length && !taskuri.length) {
    await trimite(chatId, `📅 <b>${titlu}</b>\nNimic programat și niciun task scadent.`, meniu())
    return
  }
  await trimite(chatId, `📅 <b>${titlu}</b> — ${programari.length} programări, ${taskuri.length} task-uri`)
  for (const p of programari) {
    const linie =
      `🕐 <b>${oraLocala(p.startAt)}</b> · ${escapeHtml(p.contactName)}` +
      (p.company && p.company !== p.contactName ? ` (${escapeHtml(p.company)})` : '') +
      ` · ${escapeHtml(p.title)} · ${statusProgramare(p.status).label}` +
      (p.contactPhone ? `\n📞 ${escapeHtml(p.contactPhone)}` : '') +
      (p.location ? `\n📍 ${escapeHtml(p.location)}` : '')
    await trimite(chatId, linie, butoaneProgramareScurt(p.id))
  }
  for (const t of taskuri) {
    await trimite(
      chatId,
      `📋 ${refTask(t)} <b>${escapeHtml(t.title)}</b>\n${statusTask(t.status).label} · ${prioritate(t.priority).label}`,
      [[{ text: 'ℹ️ Detalii', callback_data: `TDET:${t.id}` }]]
    )
  }
}

async function saptamana(chatId, om) {
  const luni = inceputSaptamana(cheieZi())
  const duminica = adaugaZile(luni, 6)
  const [programari, taskuri] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        dateKey: { gte: luni, lte: duminica },
        status: { notIn: ['CANCELLED'] },
        OR: [{ responsabilId: om.id }, { creatorId: om.id, responsabilId: null }],
      },
      orderBy: { startAt: 'asc' },
      take: 40,
    }),
    prisma.task.findMany({
      where: {
        assigneeIds: { has: om.id },
        status: { notIn: STATUSURI_TASK_INCHISE },
        dueAt: { gte: momentLocal(luni), lt: momentLocal(adaugaZile(luni, 7)) },
      },
      select: { id: true, seq: true, title: true, status: true, dueAt: true },
      orderBy: { dueAt: 'asc' },
      take: 30,
    }),
  ])
  if (!programari.length && !taskuri.length) {
    await trimite(chatId, '🗓 Nimic programat săptămâna aceasta.', meniu())
    return
  }

  const peZi = {}
  for (const p of programari) (peZi[p.dateKey] ||= []).push(`🕐 ${oraLocala(p.startAt)} · ${escapeHtml(p.contactName)} · ${escapeHtml(p.title)}`)
  for (const t of taskuri) {
    const k = cheieZi(t.dueAt)
    ;(peZi[k] ||= []).push(`📋 ${refTask(t)} ${escapeHtml(t.title)} — ${statusTask(t.status).label}`)
  }
  const linii = ['🗓 <b>Săptămâna aceasta</b>']
  for (const k of Object.keys(peZi).sort()) {
    linii.push('', `<b>${eticheta(k, cheieZi())}</b>`, ...peZi[k])
  }
  await trimite(chatId, linii.join('\n'), meniu())
}

// ── Mesaje text și vocale ───────────────────────────────────────────

/** Întoarce true dacă mesajul a fost tratat aici. */
export async function trateazaMesaj(mesaj) {
  const chatId = mesaj.chat.id
  const text = String(mesaj.text || '').trim()
  const om = await omDupaChat(chatId)

  if (!om) {
    if (text === '/menu' || text === '/tasks' || mesaj.voice) {
      await trimite(chatId, NELEGAT)
      return true
    }
    return false
  }

  // Răspuns la un mesaj de task → comentariu
  const raspunsLa = mesaj.reply_to_message?.text || mesaj.reply_to_message?.caption || ''
  const seq = /Comentariu la task #(\d+)/.exec(raspunsLa)?.[1] || (/task/i.test(raspunsLa) ? /#(\d+)/.exec(raspunsLa)?.[1] : null)
  if (seq && text) {
    const task = await prisma.task.findFirst({ where: { seq: Number(seq) }, select: { id: true, seq: true, title: true } })
    if (!task) {
      await trimite(chatId, `❌ Nu găsesc taskul #${seq}.`)
      return true
    }
    try {
      await adaugaComentariu(task.id, om, text, 'TELEGRAM')
      await trimite(chatId, `✅ Comentariu adăugat la ${refTask(task)}.`, butonDeschide(task))
    } catch (e) {
      await trimite(chatId, `❌ ${escapeHtml(e.message)}`)
    }
    return true
  }

  if (mesaj.voice || mesaj.audio) {
    await dinVoce(chatId, om, (mesaj.voice || mesaj.audio).file_id)
    return true
  }

  if (['/menu', '/meniu', '/start'].includes(text)) {
    await trimite(chatId, `Salut, ${escapeHtml(om.name)}! Alege o opțiune:`, meniu())
    return true
  }
  if (text === '/tasks') {
    await taskurileMele(chatId, om)
    return true
  }
  if (text === '/azi') {
    await zi(chatId, om, cheieZi())
    return true
  }
  if (text === '/maine') {
    await zi(chatId, om, adaugaZile(cheieZi(), 1))
    return true
  }

  if (text && !text.startsWith('/')) {
    await trimite(
      chatId,
      '📋 Folosește butoanele de mai jos. Pentru un task nou, trimite un <b>mesaj vocal</b> (ex.: „Mâine la 3 sună la Dulcinella pentru ofertă").',
      meniu()
    )
    return true
  }
  return false
}

async function dinVoce(chatId, om, fileId) {
  if (!are(om, 'tasks.create') && !are(om, 'appointments.create')) {
    await trimite(chatId, '🎤 Nu ai voie să creezi taskuri sau programări.')
    return
  }
  await trimite(chatId, '🎧 Procesez mesajul vocal…')
  try {
    const { transcrie, interpreteaza } = await import('./voce')
    const buf = await descarcaFisier(fileId)
    if (!buf) {
      await trimite(chatId, '❌ Nu am putut descărca mesajul vocal.')
      return
    }
    const transcriere = await transcrie(buf, 'audio/ogg', 'voce.ogg')
    if (!transcriere) {
      await trimite(chatId, '🤷 Nu am înțeles mesajul vocal.')
      return
    }

    const [oameni, proiecte, categorii] = await Promise.all([
      echipa(),
      prisma.project.findMany({ where: { status: { in: ['ACTIVE', 'ON_HOLD'] } }, select: { id: true, name: true }, take: 200 }),
      prisma.category.findMany({ select: { id: true, name: true } }),
    ])
    let c = {}
    try {
      c = await interpreteaza(
        transcriere,
        { echipa: oameni.map((o) => ({ id: o.id, name: o.name || o.email })), proiecte, categorii },
        are(om, 'appointments.create') ? (are(om, 'tasks.create') ? 'auto' : 'programare') : 'task'
      )
    } catch (e) {
      console.error('[bot/voce] interpretare:', e?.message)
    }

    // Programare: doar dacă avem ziua, ora și cu cine
    if (c.entity === 'programare' && c.dateKey && c.time && (c.contactName || c.company)) {
      const p = await creeazaProgramare(
        om,
        {
          title: c.title || 'Întâlnire',
          contactName: c.contactName || c.company,
          company: c.company,
          contactPhone: c.contactPhone,
          location: c.location,
          message: c.message || transcriere,
          dateKey: c.dateKey,
          time: c.time,
          durationMinutes: c.durationMinutes,
          responsabilId: c.responsabilId || om.id,
          projectId: c.projectId,
          ...(c.reminderOffsets?.length ? { reminderOffsets: c.reminderOffsets } : {}),
        },
        { ignoraSuprapunere: true }
      )
      await trimite(
        chatId,
        `✅ <b>Programare creată din voce</b>\n«${escapeHtml(transcriere)}»\n\n🗓 ${eticheta(p.dateKey, cheieZi())}, ${oraLocala(p.startAt)} · ${escapeHtml(p.contactName)}`,
        butoaneProgramare(p)
      )
      return
    }

    const dueAt = c.dueDate ? momentLocal(c.dueDate, c.dueTime || '18:00') : null
    const titlu = c.title || (transcriere.length > 140 ? `${transcriere.slice(0, 140)}…` : transcriere)
    const task = await creeazaTask(
      om,
      {
        title: titlu,
        description: c.description || (transcriere !== titlu ? transcriere : undefined),
        priority: c.priority,
        assigneeIds: c.assigneeIds?.length ? c.assigneeIds : undefined,
        projectId: c.projectId,
        newProjectName: c.newProjectName,
        categoryId: c.categoryId,
        dueAt: dueAt ? dueAt.toISOString() : undefined,
        reminderIntervalMinutes: c.reminderIntervalMinutes,
      },
      'VOICE'
    )
    // Asignatul (inclusiv tu) primește taskul complet cu butoane din anuntaTaskNou
    await trimite(chatId, `✅ <b>Task creat din voce</b> (${refTask(task)})\n«${escapeHtml(transcriere)}»`, butonDeschide(task))
  } catch (e) {
    console.error('[bot/voce]', e)
    await trimite(chatId, `❌ ${escapeHtml(e?.message || 'Eroare la procesarea vocii.')}`)
  }
}

// ── Butoane ─────────────────────────────────────────────────────────

export async function trateazaButon({ id: callbackId, data, message }) {
  const chatId = message?.chat?.id
  const messageId = message?.message_id
  if (!chatId) return

  const om = await omDupaChat(chatId)
  if (!om) {
    await raspundeButon(callbackId, '❌ Contul nu e legat (Securitate → Telegram).')
    await trimite(chatId, NELEGAT)
    return
  }

  // Meniu
  const ecrane = {
    MENU: () => trimite(chatId, 'Meniu:', meniu()),
    MY_TASKS: () => taskurileMele(chatId, om),
    TODAY: () => zi(chatId, om, cheieZi()),
    TOMORROW: () => zi(chatId, om, adaugaZile(cheieZi(), 1)),
    WEEK: () => saptamana(chatId, om),
    ADD: () =>
      trimite(
        chatId,
        '➕ Trimite un <b>mesaj vocal</b>:\n• task: „Pentru Mihaela, urgent, sună la Dulcinella până joi"\n• programare: „Joi la 3, întâlnire cu Ion de la Granier pentru site"'
      ),
    VOICE: () => trimite(chatId, '🎤 Trimite un mesaj vocal cu taskul sau programarea.'),
  }
  if (ecrane[data]) {
    await raspundeButon(callbackId)
    await ecrane[data]()
    return
  }

  const [tip, val, idVechi] = data.split(':')
  const id = tip === 'TCOMM' || tip === 'TDET' ? val : idVechi
  if (!OBJECT_ID.test(id || '')) {
    await raspundeButon(callbackId, '❌ Date invalide')
    return
  }

  try {
    if (tip === 'TDET') {
      await raspundeButon(callbackId)
      await detaliiTask(chatId, om, id)
      return
    }

    if (tip === 'TCOMM') {
      const t = await prisma.task.findUnique({ where: { id }, select: { seq: true, title: true } })
      await raspundeButon(callbackId)
      if (!t) return
      await trimiteCuRaspuns(
        chatId,
        `💬 Comentariu la task #${t.seq}\n<b>${escapeHtml(t.title)}</b>\n\nScrie comentariul ca răspuns la acest mesaj.`,
        'Comentariul tău…'
      )
      return
    }

    if (tip === 'pg') {
      const p = await schimbaStatusProgramare(id, om, val)
      await raspundeButon(callbackId, `✅ ${statusProgramare(val).label}`)
      // Mesajele cu programarea completă se editează; cele din liste doar își schimbă butoanele
      if (/Status:/.test(message.text || '')) {
        await editeaza(chatId, messageId, await textDupaButon(p), butoaneProgramare(p))
      } else {
        await editeaza(chatId, messageId, `${escapeHtml(message.text || '')}\n→ <b>${statusProgramare(val).label}</b>`)
      }
      return
    }

    // Taskuri: TST / TPR (și vechile tk / tp)
    const existent = await prisma.task.findUnique({ where: { id }, select: { creatorId: true, assigneeIds: true } })
    if (!existent) {
      await raspundeButon(callbackId, '❌ Task inexistent')
      return
    }
    if (!poateModifica(existent, om, are(om, 'tasks.edit'))) {
      await raspundeButon(callbackId, '❌ Nu ai acces la acest task.')
      return
    }

    const progres = tip === 'TPR' || tip === 'tp'
    if (!progres && !VALORI_STATUS_TASK.includes(val)) {
      await raspundeButon(callbackId, '❌ Status invalid')
      return
    }
    const task = progres
      ? await schimbaProgres(id, om, Number(val), { sursa: 'TELEGRAM' })
      : await schimbaStatus(id, om, val, { sursa: 'TELEGRAM' })

    await raspundeButon(callbackId, progres ? `📊 Progres: ${task.progress}%` : `✅ Status: ${statusTask(task.status).label}`)

    // Păstrăm antetul mesajului („Task nou", „Reamintire task"…)
    const prima = String(message.text || '').split('\n')[0].replace(/\s*\(#\d+\).*$/, '').replace(/[<>&]/g, '')
    const nume = harteNume(await echipa())
    await editeaza(
      chatId,
      messageId,
      textTask(task, { antet: prima ? `<b>${prima}</b> (${refTask(task)})` : undefined, nume, proiect: task.project }),
      butoaneTask(task)
    )
  } catch (e) {
    console.error('[bot/buton]', e?.message)
    await raspundeButon(callbackId, `❌ ${String(e?.message || 'Eroare').slice(0, 150)}`)
  }
}
