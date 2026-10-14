/** Filtrele listei de taskuri (listă și Kanban) → condiții Prisma. */

import { VALORI_STATUS_TASK, VALORI_PRIORITATE, STATUSURI_TASK_INCHISE } from './constante'
import { cheieZi, momentLocal, adaugaZile, inceputSaptamana } from './timp'

const OBJECT_ID = /^[a-f\d]{24}$/i

function intervalTermen(termen, acum = new Date()) {
  const azi = cheieZi(acum)
  switch (termen) {
    case 'overdue':
      return { lt: acum }
    case 'today':
      return { gte: momentLocal(azi), lt: momentLocal(adaugaZile(azi, 1)) }
    case 'tomorrow':
      return { gte: momentLocal(adaugaZile(azi, 1)), lt: momentLocal(adaugaZile(azi, 2)) }
    case 'week': {
      const luni = inceputSaptamana(azi)
      return { gte: momentLocal(luni), lt: momentLocal(adaugaZile(luni, 7)) }
    }
    case 'month': {
      const [a, l] = azi.split('-').map(Number)
      const urm = l === 12 ? `${a + 1}-01-01` : `${a}-${String(l + 1).padStart(2, '0')}-01`
      return { gte: momentLocal(`${a}-${String(l).padStart(2, '0')}-01`), lt: momentLocal(urm) }
    }
    default:
      return null
  }
}

export function construiesteFiltre(sp, user) {
  const conditii = []

  const scope = sp.get('scope') || 'all'
  if (scope === 'mine') conditii.push({ assigneeIds: { has: user.id } })
  else if (scope === 'created') conditii.push({ creatorId: user.id })

  const statusuri = (sp.get('status') || '').split(',').filter((s) => VALORI_STATUS_TASK.includes(s))
  if (statusuri.length) conditii.push({ status: { in: statusuri } })

  const prioritati = (sp.get('priority') || sp.get('prio') || '').split(',').filter((p) => VALORI_PRIORITATE.includes(p))
  if (prioritati.length) conditii.push({ priority: { in: prioritati } })

  const proiect = sp.get('project')
  if (proiect === 'none') conditii.push({ OR: [{ projectId: null }, { projectId: { isSet: false } }] })
  else if (OBJECT_ID.test(proiect || '')) conditii.push({ projectId: proiect })

  const categorie = sp.get('category')
  if (OBJECT_ID.test(categorie || '')) conditii.push({ categoryId: categorie })

  const asignat = sp.get('assignee')
  if (OBJECT_ID.test(asignat || '')) conditii.push({ assigneeIds: { has: asignat } })

  const lead = sp.get('lead')
  if (OBJECT_ID.test(lead || '')) conditii.push({ leadId: lead })

  const termen = sp.get('due')
  if (termen === 'none') conditii.push({ OR: [{ dueAt: null }, { dueAt: { isSet: false } }] })
  else {
    const interval = intervalTermen(termen)
    if (interval) {
      conditii.push({ dueAt: interval })
      if (termen === 'overdue') conditii.push({ status: { notIn: STATUSURI_TASK_INCHISE } })
    }
  }

  // Interval exact (calendarul): ?dueDe=ISO&duePana=ISO
  const dueDe = Date.parse(sp.get('dueDe') || '')
  const duePana = Date.parse(sp.get('duePana') || '')
  if (!Number.isNaN(dueDe) || !Number.isNaN(duePana)) {
    conditii.push({
      dueAt: {
        ...(Number.isNaN(dueDe) ? {} : { gte: new Date(dueDe) }),
        ...(Number.isNaN(duePana) ? {} : { lt: new Date(duePana) }),
      },
    })
  }

  const q = (sp.get('q') || '').trim()
  if (q) {
    const numar = /^#?(\d{1,6})$/.exec(q)
    if (numar) conditii.push({ seq: Number(numar[1]) })
    else
      conditii.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      })
  }

  return conditii.length ? { AND: conditii } : {}
}
