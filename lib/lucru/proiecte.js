/**
 * Proiectele: un client / o lucrare, cu taskurile și programările ei.
 * Locația e opțională (adresă + coordonate pentru hartă).
 */

import prisma from '@/lib/prisma'
import { VALORI_STATUS_PROIECT, idSauNull } from './constante'

export const SELECT_PROIECT = {
  id: true,
  seq: true,
  name: true,
  description: true,
  status: true,
  ownerId: true,
  responsabilId: true,
  clientName: true,
  clientPhone: true,
  leadId: true,
  address: true,
  lat: true,
  lng: true,
  createdAt: true,
  updatedAt: true,
}

export function curataProiect(corp, { partial = false } = {}) {
  const date = {}
  const text = (v, max) => String(v || '').trim().slice(0, max) || null

  if (!partial || corp.name !== undefined) {
    const n = text(corp.name, 150)
    if (!n) throw new Error('Scrie numele proiectului.')
    date.name = n
  }
  if (corp.description !== undefined) date.description = text(corp.description, 5000)
  if (corp.status !== undefined) {
    if (!VALORI_STATUS_PROIECT.includes(corp.status)) throw new Error('Status invalid.')
    date.status = corp.status
  }
  if (corp.responsabilId !== undefined) date.responsabilId = idSauNull(corp.responsabilId)
  if (corp.clientName !== undefined) date.clientName = text(corp.clientName, 150)
  if (corp.clientPhone !== undefined) date.clientPhone = text(corp.clientPhone, 40)
  if (corp.leadId !== undefined) date.leadId = idSauNull(corp.leadId)
  if (corp.address !== undefined) date.address = text(corp.address, 300)

  if (corp.lat !== undefined || corp.lng !== undefined) {
    const lat = corp.lat === '' || corp.lat == null ? null : Number(corp.lat)
    const lng = corp.lng === '' || corp.lng == null ? null : Number(corp.lng)
    if (lat == null || lng == null) {
      date.lat = null
      date.lng = null
    } else {
      if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) throw new Error('Coordonate invalide.')
      date.lat = Math.round(lat * 1e6) / 1e6
      date.lng = Math.round(lng * 1e6) / 1e6
    }
  }
  return date
}

/** Câte taskuri are fiecare proiect, pe stări (deschise / gata). */
export async function numaraTaskuri(ids) {
  if (!ids.length) return {}
  const grupe = await prisma.task.groupBy({
    by: ['projectId', 'status'],
    where: { projectId: { in: ids } },
    _count: { _all: true },
  })
  const rez = {}
  for (const g of grupe) {
    const r = (rez[g.projectId] ||= { total: 0, gata: 0, deschise: 0 })
    r.total += g._count._all
    if (g.status === 'DONE') r.gata += g._count._all
    else if (g.status !== 'CANCELLED') r.deschise += g._count._all
  }
  return rez
}

/** Numele lead-urilor legate (pentru afișare). */
export async function numeLeaduri(ids) {
  const unice = [...new Set(ids.map(idSauNull).filter(Boolean))]
  if (!unice.length) return {}
  const leaduri = await prisma.webLead.findMany({
    where: { id: { in: unice } },
    select: { id: true, denumire: true, telefon: true, oras: true },
  })
  return Object.fromEntries(leaduri.map((l) => [l.id, l]))
}
