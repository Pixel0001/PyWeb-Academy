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

        {notite.length > 0 && (
          <span
            className="shrink-0 text-[10px] leading-tight text-gray-400"
            title={`${notite.length} notițe`}
          >
            💬{notite.length}
          </span>
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
        />
      )}
    </div>
  )
}
