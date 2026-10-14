/**
 * Cine poate primi taskuri / programări: conturile de admin active.
 * O singură interogare dă și numele (pentru afișare) și chat-urile Telegram.
 */

import prisma from '@/lib/prisma'
import { checkPermission } from '@/lib/permissions'

export async function echipa() {
  const oameni = await prisma.user.findMany({
    where: { active: true, role: { in: ['SUPERADMIN', 'ADMIN'] } },
    select: { id: true, name: true, email: true, telegramChatId: true, role: true, permissions: true },
    orderBy: { name: 'asc' },
  })
  return oameni
}

/**
 * Adminii care urmăresc tot ce se întâmplă cu taskurile (ca în StefanPWA):
 * Super Admin + adminii cu permisiunea tasks.view, cu Telegram legat.
 */
export function observatori(oameni) {
  return oameni
    .filter((o) => o.telegramChatId && (o.role === 'SUPERADMIN' || (o.permissions || []).includes('tasks.view')))
    .map((o) => o.id)
}

/** { id: nume } — pentru mesaje și liste. */
export function harteNume(oameni) {
  return Object.fromEntries(oameni.map((o) => [o.id, o.name || o.email]))
}

/** Lista trimisă în browser: fără chat-ul Telegram, doar dacă e legat. */
export function echipaPublica(oameni) {
  return oameni.map((o) => ({
    id: o.id,
    name: o.name || o.email,
    telegram: Boolean(o.telegramChatId),
  }))
}

/**
 * Verifică permisiunea și întoarce utilizatorul curent (sau răspunsul de eroare).
 * Folosit de toate rutele API din secțiunea asta.
 */
export async function cuPermisiune(permisiune) {
  const { allowed, user } = await checkPermission(permisiune)
  if (!user) return { eroare: { error: 'Neautentificat' }, cod: 401 }
  if (!allowed) return { eroare: { error: `Nu ai permisiunea ${permisiune}.` }, cod: 403 }
  return { user: { id: user.id, name: user.name || user.email, role: user.role } }
}

export async function arePermisiune(permisiune) {
  return (await checkPermission(permisiune)).allowed
}
