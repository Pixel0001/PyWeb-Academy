'use client'

/**
 * Un lead pe UN RÂND, cât mai jos posibil.
 *
 * Când suni 300 de firme, fiecare pixel de înălțime înseamnă mai puține firme
 * pe ecran și mai mult scroll. Rândul închis are ~28px și arată strictul
 * necesar ca să decizi dacă suni acum: scor, nume, ce e prost la site, rating,
 * oraș, recontactare, telefon, status.
 *
 * Clic pe rând → se deschide dedesubt tot restul: recontactare, notițe cu
 * istoric, adresă, linkuri. Fără să pierzi locul din listă.
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import {
  STATUSURI,
  getStatus,
  getCalitate,
  stareFollowUp,
  formateazaFollowUp,
  STILURI_FOLLOWUP,
} from '@/lib/leads/statusuri'
import PanouLead from './PanouLead'

function culoareScor(scor) {
  if (scor > 70) return 'bg-green-600 text-white'
  if (scor >= 40) return 'bg-yellow-400 text-yellow-950'
  return 'bg-gray-200 text-gray-600'
}

function ratingRo(rating) {
  return typeof rating === 'number' ? String(rating).replace('.', ',') : null
}

const RETELE = [
  { potrivire: /facebook\.com/i, nume: 'Facebook' },
  { potrivire: /instagram\.com/i, nume: 'Instagram' },
  { potrivire: /ok\.ru/i, nume: 'OK' },
  { potrivire: /vk\.com/i, nume: 'VK' },
  { potrivire: /linktr\.ee/i, nume: 'Linktree' },
]

function contactSocial(lead) {
  if (!lead.siteUrl) return null
  const retea = RETELE.find((r) => r.potrivire.test(lead.siteUrl))
  return retea ? { url: lead.siteUrl, nume: retea.nume } : null
}

export default function RandLead({
  lead,
  onStatus,
  onFollowUp,
  onAdaugaNota,
  onStergeNota,
  onCopiaza,
  echipa,
  onResponsabil,
  onWhatsApp,
}) {
  const [deschis, setDeschis] = useState(false)
  const [notaNoua, setNotaNoua] = useState('')
  const [salveaza, setSalveaza] = useState(false)

  const calitate = getCalitate(lead.calitateSite)
  const status = getStatus(lead.status)
  const social = contactSocial(lead)
  const stareFU = stareFollowUp(lead.nextFollowUpAt)
  const stilFU = stareFU ? STILURI_FOLLOWUP[stareFU] : null
  const notite = lead.notiteIstoric || []
  const rating = ratingRo(lead.rating)

  async function trimiteNota() {
    if (!notaNoua.trim() || salveaza) return
    setSalveaza(true)
    const ok = await onAdaugaNota(lead, notaNoua.trim())
    if (ok) setNotaNoua('')
    setSalveaza(false)
  }

  return (
    <div
      className={`rounded bg-white transition ${
        deschis ? 'shadow-md ring-1 ring-indigo-200' : 'shadow-sm hover:bg-indigo-50/40'
      } ${stareFU === 'restant' && !deschis ? 'ring-1 ring-red-200' : ''}`}
    >
      {/* ── RÂNDUL ÎNCHIS — totul pe o linie ──────────────────── */}
      <div
        onClick={() => setDeschis((v) => !v)}
        className="flex cursor-pointer items-center gap-1.5 px-1.5 py-1"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold ${culoareScor(lead.scor)}`}
          title={`Scor ${lead.scor}/100`}
        >
          {lead.scor}
        </span>

        {/* Numele duce la pagina firmei; restul rândului doar deschide panoul. */}
        <Link
          href={`/admin/leads/${lead.id}`}
          onClick={(e) => e.stopPropagation()}
          title="Deschide pagina firmei"
          className="min-w-0 flex-1 truncate text-[13px] font-medium leading-tight text-gray-900 hover:text-indigo-700 hover:underline"
        >
          {lead.denumire}
        </Link>

        <span
          className={`hidden shrink-0 rounded px-1 py-px text-[10px] leading-tight sm:inline ${calitate.color}`}
          title={lead.observatiiSite || calitate.label}
        >
          {calitate.emoji}
          <span className="ml-0.5 hidden md:inline">{calitate.label}</span>
        </span>

        {rating && (
          <span className="hidden shrink-0 text-[11px] leading-tight text-gray-500 md:inline">
            ⭐{rating}
            <span className="text-gray-400">·{lead.nrRecenzii}</span>
          </span>
        )}

        <span className="hidden shrink-0 text-[11px] leading-tight text-gray-400 lg:inline">
          {lead.oras}
        </span>

        {stilFU && (
          <span
            className={`shrink-0 rounded border px-1 py-px text-[10px] leading-tight ${stilFU.color}`}
          >
            {stilFU.emoji}
            <span className="ml-0.5 hidden sm:inline">
              {formateazaFollowUp(lead.nextFollowUpAt)}
            </span>
          </span>
        )}

        {lead.responsabil && (
          <span
            className="hidden h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700 sm:flex"
            title={`Se ocupă: ${lead.responsabil.name || lead.responsabil.email}`}
          >
            {(lead.responsabil.name || lead.responsabil.email).charAt(0).toUpperCase()}
          </span>
        )}

        {notite.length > 0 && (
          <span
            className="shrink-0 text-[10px] leading-tight text-gray-400"
            title={`${notite.length} notițe`}
          >
            💬{notite.length}
          </span>
        )}

        {/* WhatsApp cu șablon — deschide fereastra de alegere */}
        {(lead.telefon || lead.telefonLocal) && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onWhatsApp?.(lead)
            }}
            className="inline-flex shrink-0 items-center rounded bg-[#25D366] px-1.5 py-px text-[11px] leading-tight text-white hover:bg-[#1ebe5a]"
            title="Trimite un șablon pe WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
              <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36A9.4 9.4 0 0 1 2.6 12.1 9.46 9.46 0 0 1 12.06 2.6a9.4 9.4 0 0 1 6.68 2.77 9.4 9.4 0 0 1 2.77 6.7 9.46 9.46 0 0 1-9.46 9.43m8.05-17.5A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.07c0 2 .52 3.96 1.52 5.68L.58 23.3l5.7-1.5a11.3 11.3 0 0 0 5.43 1.38h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.89-3.33-8.03" />
            </svg>
          </button>
        )}

        {lead.telefon ? (
          <a
            href={`tel:${lead.telefon}`}
            onClick={(e) => e.stopPropagation()}
            className="hidden shrink-0 items-center gap-1 rounded bg-green-600 px-1.5 py-px text-[11px] leading-tight text-white hover:bg-green-700 sm:inline-flex"
          >
            <PhoneIcon className="h-3 w-3" />
            <span className="hidden xl:inline">{lead.telefon}</span>
          </a>
        ) : (
          social && (
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hidden shrink-0 rounded bg-blue-600 px-1.5 py-px text-[11px] leading-tight text-white hover:bg-blue-700 sm:inline-flex"
              title={`Fără telefon — scrie pe ${social.nume}`}
            >
              <ChatBubbleLeftRightIcon className="h-3 w-3" />
            </a>
          )
        )}

        <select
          value={lead.status}
          onChange={(e) => onStatus(lead, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className={`shrink-0 rounded border px-0.5 py-px text-[10px] leading-tight ${status.color}`}
        >
          {STATUSURI.map((s) => (
            <option key={s.value} value={s.value}>
              {s.emoji} {s.scurt || s.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── DESCHIS — tot restul, fără să pleci din listă ─────── */}
      {deschis && (
        <PanouLead
          lead={lead}
          calitate={calitate}
          social={social}
          rating={rating}
          notite={notite}
          notaNoua={notaNoua}
          setNotaNoua={setNotaNoua}
          salveaza={salveaza}
          onTrimiteNota={trimiteNota}
          onFollowUp={onFollowUp}
          onStergeNota={onStergeNota}
          onCopiaza={onCopiaza}
          echipa={echipa}
          onResponsabil={onResponsabil}
          onWhatsApp={onWhatsApp}
        />
      )}
    </div>
  )
}
