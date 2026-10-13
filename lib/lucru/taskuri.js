/**
 * Logica taskurilor — folosită de rutele API, de butoanele din Telegram și
 * de cron. Portată din StefanPWA (lib/services/tasks.ts), fără echipe,
 * clienți și email: asignații sunt conturile de admin.
 */

import prisma from '@/lib/prisma'
import {
  VALORI_STATUS_TASK,
  VALORI_PRIORITATE,
  STATUSURI_TASK_INCHISE,
  statusTask,
  idSauNull,
} from './constante'
import { echipa, harteNume, observatori } from './echipa'
import {
  trimite,
  sterge,
  textTask,
  butoaneTask,
  butonDeschide,
  refTask,
  textActualizare,
  textScurt,
  escapeHtml,
} from './telegram'
import { dataOra } from './timp'

/** Următorul număr dintr-o numărătoare („task" → 1, 2, 3…). */
export async function urmatorulNumar(nume) {
  const c = await prisma.counter.upsert({
    where: { name: nume },
    create: { name: nume, value: 1 },
    update: { value: { increment: 1 } },
  })
  return c.value
}

const SELECT_TASK = {
  id: true,
  seq: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  progress: true,
  creatorId: true,
  assigneeIds: true,
  projectId: true,
  categoryId: true,
  leadId: true,
  dueAt: true,
  reminderIntervalMinutes: true,
  nextReminderAt: true,
  createdFrom: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true, seq: true, address: true, lat: true, lng: true } },
  category: { select: { id: true, name: true, color: true } },
}
export { SELECT_TASK }

/** Curăță ce vine din formular / voce. Aruncă Error cu mesaj pentru om. */
export async function normalizeazaIntrare(corp, { partial = false } = {}) {
  const date = {}

  if (!partial || corp.title !== undefined) {
    const titlu = String(corp.title || '').trim()
    if (!titlu) throw new Error('Titlul e obligatoriu.')
    date.title = titlu.slice(0, 200)
  }
  if (corp.description !== undefined) date.description = String(corp.description || '').trim().slice(0, 5000) || null
  if (corp.priority !== undefined) {
    if (!VALORI_PRIORITATE.includes(corp.priority)) throw new Error('Prioritate invalidă.')
    date.priority = corp.priority
  }
  if (corp.assigneeIds !== undefined) {
    const ids = [...new Set((Array.isArray(corp.assigneeIds) ? corp.assigneeIds : []).map(idSauNull).filter(Boolean))]
    if (ids.length) {
      const gasiti = await prisma.user.findMany({ where: { id: { in: ids }, active: true }, select: { id: true } })
      date.assigneeIds = gasiti.map((g) => g.id)
    } else {
      date.assigneeIds = []
    }
  }
  if (corp.projectId !== undefined) {
    if (idSauNull(corp.projectId)) {
      const p = await prisma.project.findUnique({ where: { id: corp.projectId }, select: { id: true } }).catch(() => null)
      if (!p) throw new Error('Proiectul nu există.')
      date.projectId = p.id
    } else date.projectId = null
  }
  if (corp.categoryId !== undefined) {
    if (idSauNull(corp.categoryId)) {
      const c = await prisma.category.findUnique({ where: { id: corp.categoryId }, select: { id: true } }).catch(() => null)
      date.categoryId = c?.id || null
    } else date.categoryId = null
  }
  if (corp.leadId !== undefined) date.leadId = idSauNull(corp.leadId)
  if (corp.dueAt !== undefined) {
    if (corp.dueAt) {
      const d = new Date(corp.dueAt)
      if (Number.isNaN(d.getTime())) throw new Error('Termen invalid.')
      date.dueAt = d
    } else date.dueAt = null
  }
  if (corp.reminderIntervalMinutes !== undefined) {
    const n = Number(corp.reminderIntervalMinutes) || 0
    date.reminderIntervalMinutes = n > 0 ? Math.max(10, Math.min(n, 60 * 24 * 30)) : null
  }
  if (corp.progress !== undefined) {
    date.progress = Math.max(0, Math.min(100, Math.round(Number(corp.progress) || 0)))
  }
  return date
}

/** Trimite același text mai multor oameni pe Telegram (sare peste cei fără cont legat). */
async function trimiteLa(ids, construieste, { oameni } = {}) {
  const lista = oameni || (await echipa())
  const nume = harteNume(lista)
  const trimise = []
  for (const id of new Set(ids.filter(Boolean))) {
    const om = lista.find((o) => o.id === id)
    if (!om?.telegramChatId) continue
    const { text, tastatura } = construieste(nume, om)
    const msgId = await trimite(om.telegramChatId, text, tastatura)
    if (msgId) trimise.push({ chatId: om.telegramChatId, msgId, userId: id })
  }
  return trimise
}

/**
 * „🔔 Actualizare task" către creator + asignați + admini (fără cel care a
 * făcut schimbarea) — exact ca în StefanPWA.
 */
async function anuntaActualizare(task, actor, eticheta, valoare) {
  const oameni = await echipa()
  const destinatari = new Set([task.creatorId, ...task.assigneeIds, ...observatori(oameni)])
  destinatari.delete(actor.id)
  const text = textActualizare({ actor: actor.name, task, eticheta, valoare })
  await trimiteLa([...destinatari], () => ({ text, tastatura: butonDeschide(task) }), { oameni })
}

async function logheaza(taskId, actor, action, extra = {}) {
  await prisma.taskActivity
    .create({ data: { taskId, userId: actor.id, userName: actor.name || null, action, ...extra } })
    .catch((e) => console.error('[tasks] activitate:', e?.message))
}

// ── Creare ──────────────────────────────────────────────────────────

export async function creeazaTask(actor, corp, sursa = 'WEB') {
  const date = await normalizeazaIntrare(corp)

  // Proiect nou dictat din voce: îl creăm pe loc
  if (!date.projectId && corp.newProjectName?.trim()) {
    const p = await prisma.project.create({
      data: { name: corp.newProjectName.trim().slice(0, 150), ownerId: actor.id, seq: await urmatorulNumar('project') },
      select: { id: true },
    })
    date.projectId = p.id
  }

  // Fără asignat explicit: responsabilul proiectului, altfel cine îl creează
  if (!date.assigneeIds?.length && date.projectId) {
    const p = await prisma.project.findUnique({ where: { id: date.projectId }, select: { responsabilId: true } })
    if (p?.responsabilId) date.assigneeIds = [p.responsabilId]
  }
  if (!date.assigneeIds?.length) date.assigneeIds = [actor.id]

  const acum = new Date()
  const task = await prisma.task.create({
    data: {
      ...date,
      seq: await urmatorulNumar('task'),
      creatorId: actor.id,
      status: date.assigneeIds.some((id) => id !== actor.id) ? 'ASSIGNED' : 'NEW',
      createdFrom: sursa,
      nextReminderAt: date.reminderIntervalMinutes
        ? new Date(acum.getTime() + date.reminderIntervalMinutes * 60000)
        : null,
    },
    select: SELECT_TASK,
  })

  await logheaza(task.id, actor, 'CREATED', { toStatus: task.status, note: sursa === 'VOICE' ? 'Dictat vocal' : null })
  await anuntaTaskNou(task, actor).catch((e) => console.error('[tasks] notificare task nou:', e?.message))
  return task
}

/**
 * Task nou: fiecare asignat primește taskul complet, cu butoane (și când
 * și-l pune singur — ca în StefanPWA). Adminii primesc o notificare scurtă.
 */
export async function anuntaTaskNou(task, actor, doarPentru = null) {
  const oameni = await echipa()
  const directi = [...new Set(doarPentru || task.assigneeIds)]
  const nume = harteNume(oameni)
  const deLa = actor.id && !directi.every((id) => id === actor.id) ? ` — de la ${escapeHtml(actor.name || '')}` : ''

  await trimiteLa(
    directi,
    (n) => ({
      text: textTask(task, { antet: `🆕 <b>Task nou</b> (${refTask(task)})${deLa}`, nume: n, proiect: task.project }),
      tastatura: butoaneTask(task),
    }),
    { oameni }
  )

  if (doarPentru) return
  const admini = observatori(oameni).filter((id) => id !== actor.id && !directi.includes(id))
  const asignati = task.assigneeIds.map((id) => nume[id]).filter(Boolean).join(', ')
  await trimiteLa(
    admini,
    () => ({
      text: textScurt(
        `Task nou: ${refTask(task)} · ${escapeHtml(task.title.slice(0, 60))}`,
        asignati ? `Asignat: ${asignati}` : task.project?.name ? `Proiect: ${task.project.name}` : null
      ),
      tastatura: butonDeschide(task),
    }),
    { oameni }
  )
}

// ── Status și progres ───────────────────────────────────────────────

export async function schimbaStatus(taskId, actor, status, { sursa = 'WEB', nota = null } = {}) {
  if (!VALORI_STATUS_TASK.includes(status)) throw new Error('Status invalid.')
  const vechi = await prisma.task.findUnique({ where: { id: taskId }, select: SELECT_TASK })
  if (!vechi) throw new Error('Taskul nu există.')
  if (vechi.status === status) return vechi

  const date = { status }
  if (status === 'DONE') date.progress = 100
  if (STATUSURI_TASK_INCHISE.includes(status)) date.nextReminderAt = null
  else if (STATUSURI_TASK_INCHISE.includes(vechi.status) && vechi.reminderIntervalMinutes) {
    date.nextReminderAt = new Date(Date.now() + vechi.reminderIntervalMinutes * 60000)
  }

  const task = await prisma.task.update({ where: { id: taskId }, data: date, select: SELECT_TASK })
  await logheaza(taskId, actor, 'STATUS_CHANGED', { fromStatus: vechi.status, toStatus: status, note: nota, meta: { sursa } })

  // Ceilalți implicați + adminii află ce s-a schimbat
  await anuntaActualizare(task, actor, 'Status', statusTask(status).label).catch((e) =>
    console.error('[tasks] notificare status:', e?.message)
  )

  return task
}

export async function schimbaProgres(taskId, actor, procent, { sursa = 'WEB' } = {}) {
  const p = Math.max(0, Math.min(100, Math.round(Number(procent) || 0)))
  const vechi = await prisma.task.findUnique({ where: { id: taskId }, select: SELECT_TASK })
  if (!vechi) throw new Error('Taskul nu există.')
  if (vechi.progress === p) return vechi

  const date = { progress: p }
  // Cine raportează progres a început lucrul
  if (p > 0 && p < 100 && ['NEW', 'ASSIGNED', 'READ'].includes(vechi.status)) date.status = 'IN_PROGRESS'

  const task = await prisma.task.update({ where: { id: taskId }, data: date, select: SELECT_TASK })
  await logheaza(taskId, actor, 'PROGRESS', {
    meta: { de: vechi.progress, la: p, sursa },
    ...(date.status ? { fromStatus: vechi.status, toStatus: date.status } : {}),
  })
  await anuntaActualizare(task, actor, 'Status', `Progres ${p}%`).catch((e) =>
    console.error('[tasks] notificare progres:', e?.message)
  )
  return task
}

// ── Editare ─────────────────────────────────────────────────────────

const ETICHETE_CAMPURI = {
  title: 'titlul',
  description: 'descrierea',
  priority: 'prioritatea',
  assigneeIds: 'asignații',
  projectId: 'proiectul',
  categoryId: 'categoria',
  dueAt: 'termenul',
  reminderIntervalMinutes: 'reamintirea',
  leadId: 'lead-ul',
}

export async function actualizeazaTask(taskId, actor, corp) {
  const vechi = await prisma.task.findUnique({ where: { id: taskId }, select: SELECT_TASK })
  if (!vechi) throw new Error('Taskul nu există.')
  const date = await normalizeazaIntrare(corp, { partial: true })
  delete date.progress

  const schimbari = []
  for (const [camp, val] of Object.entries(date)) {
    const inainte = vechi[camp]
    const egal =
      camp === 'dueAt'
        ? (inainte ? new Date(inainte).getTime() : null) === (val ? val.getTime() : null)
        : JSON.stringify(inainte ?? null) === JSON.stringify(val ?? null)
    if (egal) delete date[camp]
    else schimbari.push(camp)
  }
  if (!schimbari.length) return vechi

  if (schimbari.includes('dueAt')) date.overdueNotifiedAt = null
  if (schimbari.includes('reminderIntervalMinutes')) {
    date.nextReminderAt = date.reminderIntervalMinutes
      ? new Date(Date.now() + date.reminderIntervalMinutes * 60000)
      : null
  }
  // A primit asignați noi cineva din afară → „Asignat"
  if (schimbari.includes('assigneeIds') && vechi.status === 'NEW' && date.assigneeIds.some((id) => id !== actor.id)) {
    date.status = 'ASSIGNED'
  }

  const task = await prisma.task.update({ where: { id: taskId }, data: date, select: SELECT_TASK })

  await logheaza(taskId, actor, 'EDITED', {
    note: `A schimbat ${schimbari.map((c) => ETICHETE_CAMPURI[c] || c).join(', ')}`,
    meta: {
      campuri: schimbari,
      ...(schimbari.includes('dueAt')
        ? { termenVechi: vechi.dueAt ? dataOra(vechi.dueAt) : null, termenNou: task.dueAt ? dataOra(task.dueAt) : null }
        : {}),
    },
  })

  // Asignații noi primesc taskul pe Telegram
  if (schimbari.includes('assigneeIds')) {
    const noi = task.assigneeIds.filter((id) => !vechi.assigneeIds.includes(id))
    if (noi.length) await anuntaTaskNou(task, actor, noi).catch(() => {})
  }
  return task
}

// ── Comentarii ──────────────────────────────────────────────────────

export async function adaugaComentariu(taskId, actor, text, sursa = 'WEB') {
  const corp = String(text || '').trim().slice(0, 4000)
  if (!corp) throw new Error('Comentariul e gol.')
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, seq: true, title: true, creatorId: true, assigneeIds: true },
  })
  if (!task) throw new Error('Taskul nu există.')

  const com = await prisma.taskComment.create({
    data: { taskId, userId: actor.id, userName: actor.name || null, body: corp, source: sursa },
  })
  await logheaza(taskId, actor, 'COMMENTED', { note: corp.slice(0, 140) })

  const previzualizare = corp.length > 300 ? `${corp.slice(0, 300)}…` : corp
  await anuntaActualizare(task, actor, 'Comentariu', previzualizare).catch((e) =>
    console.error('[tasks] notificare comentariu:', e?.message)
  )

  return com
}

export async function logheazaAtasament(taskId, actor, action, nume) {
  await logheaza(taskId, actor, action, { note: nume })
}

// ── Cron: întârzieri și reamintiri ──────────────────────────────────

/** Taskurile cu termenul trecut, anunțate o singură dată. */
export async function verificaIntarzieri(acum = new Date()) {
  const candidate = await prisma.task.findMany({
    where: { dueAt: { lt: acum }, status: { notIn: STATUSURI_TASK_INCHISE } },
    select: { ...SELECT_TASK, overdueNotifiedAt: true },
    take: 200,
  })
  // Pe MongoDB `lt` prinde și termenele lipsă (null) — le scoatem de mână
  const taskuri = candidate.filter((t) => t.dueAt && new Date(t.dueAt) < acum && !t.overdueNotifiedAt)
  if (!taskuri.length) return { verificate: 0, notificate: 0 }

  const oameni = await echipa()
  let notificate = 0
  for (const t of taskuri) {
    // Marcăm înainte de trimitere: două rulări suprapuse nu dublează mesajul
    await prisma.task.update({ where: { id: t.id }, data: { overdueNotifiedAt: acum } })
    await trimiteLa(
      [...new Set([...t.assigneeIds, t.creatorId, ...observatori(oameni)])],
      (nume) => ({
        text: textTask(t, { antet: `⏰ <b>Task în întârziere</b> (${refTask(t)})`, nume, proiect: t.project }),
        tastatura: butoaneTask(t),
      }),
      { oameni }
    ).catch(() => {})
    notificate++
  }
  return { verificate: taskuri.length, notificate }
}

/** Reamintirile periodice („la fiecare 3 ore până termini"). */
export async function verificaReamintiri(acum = new Date()) {
  const candidate = await prisma.task.findMany({
    where: { nextReminderAt: { lte: acum }, status: { notIn: STATUSURI_TASK_INCHISE } },
    select: { ...SELECT_TASK, reminderMsgs: true },
    take: 200,
  })
  const taskuri = candidate.filter((t) => t.nextReminderAt && t.reminderIntervalMinutes)
  if (!taskuri.length) return { verificate: 0, notificate: 0 }

  const oameni = await echipa()
  let notificate = 0
  for (const t of taskuri) {
    const urmator = new Date(acum.getTime() + t.reminderIntervalMinutes * 60000)
    await prisma.task.update({ where: { id: t.id }, data: { nextReminderAt: urmator } })

    // Reamintirea veche dispare, ca să nu se adune zeci de mesaje
    for (const m of Array.isArray(t.reminderMsgs) ? t.reminderMsgs : []) {
      await sterge(m.chatId, m.msgId).catch(() => {})
    }

    const intarziat = t.dueAt && new Date(t.dueAt) < acum
    const trimise = await trimiteLa(
      t.assigneeIds.length ? t.assigneeIds : [t.creatorId],
      (nume) => ({
        text: textTask(t, {
          antet: intarziat
            ? `⏰ <b>Task în întârziere</b> (${refTask(t)})`
            : `🔔 <b>Reamintire task</b> (${refTask(t)})`,
          nume,
          proiect: t.project,
        }),
        tastatura: butoaneTask(t),
      }),
      { oameni }
    ).catch(() => [])

    // Creatorul și adminii primesc o notificare scurtă (asignații au mesajul complet)
    const altii = [t.creatorId, ...observatori(oameni)].filter((id) => !t.assigneeIds.includes(id))
    await trimiteLa(
      [...new Set(altii)],
      () => ({
        text: textScurt(
          `${intarziat ? '⏰ Întârziat' : 'Reamintire'}: ${refTask(t)} · ${escapeHtml(t.title.slice(0, 60))}`,
          t.dueAt ? `Deadline: ${dataOra(t.dueAt)}` : null
        ),
        tastatura: butonDeschide(t),
      }),
      { oameni }
    ).catch(() => {})

    await prisma.task.update({
      where: { id: t.id },
      data: { reminderMsgs: trimise.map(({ chatId, msgId }) => ({ chatId, msgId })) },
    })
    if (trimise.length) notificate++
  }
  return { verificate: taskuri.length, notificate }
}

/** Cine are voie să modifice taskul: creatorul, asignații sau cine are tasks.edit. */
export function poateModifica(task, user, areEdit) {
  if (areEdit || user.role === 'SUPERADMIN') return true
  return task.creatorId === user.id || (task.assigneeIds || []).includes(user.id)
}
