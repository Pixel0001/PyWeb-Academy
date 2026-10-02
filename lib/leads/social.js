/**
 * Rețeaua socială din spatele unui link, cu nume de om („Facebook").
 * Fără dependențe de server — se folosește și în browser, în panoul lead-ului.
 */

const RETELE = [
  { domeniu: 'facebook.com', nume: 'Facebook' },
  { domeniu: 'fb.com', nume: 'Facebook' },
  { domeniu: 'instagram.com', nume: 'Instagram' },
  { domeniu: 'ok.ru', nume: 'OK' },
  { domeniu: 'vk.com', nume: 'VK' },
  { domeniu: 'linktr.ee', nume: 'Linktree' },
  { domeniu: 'tiktok.com', nume: 'TikTok' },
]

/** @returns {string|null} numele rețelei, sau null dacă nu e un link social */
export function esteSocial(url) {
  if (!url) return null
  let gazda
  try {
    gazda = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
  return RETELE.find((r) => gazda === r.domeniu || gazda.endsWith(`.${r.domeniu}`))?.nume || null
}
