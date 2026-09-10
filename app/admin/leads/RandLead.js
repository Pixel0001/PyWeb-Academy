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
  ClipboardDocumentIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import {
  STATUSURI,
  getStatus,
  getCalitate,
  stareFollowUp,
  formateazaFollowUp,
  STILURI_FOLLOWUP,
} from '@/lib/leads/statusuri'
import FollowUpPicker from './FollowUpPicker'

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

        <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-tight text-gray-900">
          {lead.denumire}
        </span>

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
        <div className="space-y-3 border-t border-gray-100 px-3 py-2.5">
          {lead.pitch && (
            <div className="flex items-start gap-2 rounded bg-indigo-50 p-2">
              <p className="flex-1 text-xs italic text-indigo-900">„{lead.pitch}&rdquo;</p>
              <button
                onClick={() => onCopiaza(lead.pitch)}
                className="shrink-0 rounded p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
                title="Copiază pitch-ul"
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {lead.observatiiSite && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Site:</span> {lead.observatiiSite}
            </p>
          )}

          <FollowUpPicker valoare={lead.nextFollowUpAt} onChange={(v) => onFollowUp(lead, v)} />

          {/* Notițele — câte vrei, fiecare cu ora ei */}
          <div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={notaNoua}
                onChange={(e) => setNotaNoua(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && trimiteNota()}
                placeholder="Ce s-a discutat la telefon..."
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={trimiteNota}
                disabled={!notaNoua.trim() || salveaza}
                className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300"
              >
                {salveaza ? '...' : 'Adaugă'}
              </button>
            </div>

            {notite.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {notite.map((n) => (
                  <li
                    key={n.id}
                    className="group flex items-start gap-1.5 rounded bg-gray-50 px-2 py-1 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-800">{n.continut}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(n.createdAt).toLocaleString('ro-RO', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {n.autorNume ? ` · ${n.autorNume}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => onStergeNota(lead, n.id)}
                      className="shrink-0 rounded p-0.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-red-600"
                      title="Șterge notița"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            {lead.telefon && <span>{lead.telefon}</span>}
            {lead.adresa && <span>{lead.adresa}</span>}
            {lead.categoriePrincipala && <span>{lead.categoriePrincipala}</span>}
            {lead.siteUrl && (
              <a
                href={lead.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                site
              </a>
            )}
            {lead.linkMaps && (
              <a
                href={lead.linkMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Maps
              </a>
            )}
            <Link
              href={`/admin/leads/${lead.id}`}
              className="ml-auto inline-flex items-center gap-1 text-indigo-600 hover:underline"
            >
              pagina firmei
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
