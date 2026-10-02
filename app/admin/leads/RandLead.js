'use client'

/**
 * Un lead pe UN RÂND — la fel ca lista din CRM-ul Olla English.
 *
 * Rândul închis arată doar ce-ți trebuie ca să decizi dacă suni acum:
 * status, scor, nume, de unde a venit, ce e în neregulă cu site-ul,
 * telefon, recontactare, notițe. Statusul se schimbă direct din rând.
 *
 * Clic pe rând → se deschide dedesubt tot restul. Clic pe nume → fișa firmei.
 */

import Link from 'next/link'
import {
  PhoneIcon,
  BellAlertIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import {
  STATUSURI,
  getStatus,
  getSursa,
  getCalitate,
  stareFollowUp,
  formateazaFollowUp,
} from '@/lib/leads/statusuri'
import PanouLead from './PanouLead'

function culoareScor(scor) {
  if (scor > 70) return 'bg-green-600 text-white'
  if (scor >= 40) return 'bg-yellow-400 text-yellow-950'
  return 'bg-gray-200 text-gray-600'
}

const CULORI_FOLLOWUP = {
  restant: 'text-red-600 font-semibold',
  azi: 'text-orange-600 font-semibold',
  urmeaza: 'text-blue-600',
}

export function IconWhatsApp({ className = 'h-3 w-3' }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36A9.4 9.4 0 0 1 2.6 12.1 9.46 9.46 0 0 1 12.06 2.6a9.4 9.4 0 0 1 6.68 2.77 9.4 9.4 0 0 1 2.77 6.7 9.46 9.46 0 0 1-9.46 9.43m8.05-17.5A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.07c0 2 .52 3.96 1.52 5.68L.58 23.3l5.7-1.5a11.3 11.3 0 0 0 5.43 1.38h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.89-3.33-8.03" />
    </svg>
  )
}

export default function RandLead({
  lead,
  deschis,
  onComuta,
  onStatus,
  onEditeaza,
  onSterge,
  onWhatsApp,
  poateEdita,
  ...panou
}) {
  const status = getStatus(lead.status)
  const sursa = getSursa(lead.sursa)
  const calitate = getCalitate(lead.calitateSite)
  const stareFU = stareFollowUp(lead.nextFollowUpAt)
  const nrNotite = lead._count?.notiteIstoric ?? lead.notiteIstoric?.length ?? 0
  const telefon = lead.telefon || lead.telefonLocal

  return (
    <div
      className={`rounded-lg border bg-white transition-colors ${
        deschis
          ? 'border-indigo-400 shadow-sm'
          : stareFU === 'restant'
            ? 'border-red-300 hover:border-indigo-300'
            : status.grup === 'nou'
              ? 'border-blue-300 hover:border-indigo-300'
              : 'border-gray-200 hover:border-indigo-300'
      }`}
    >
      {/* ── Rândul compact ─────────────────────────────────────── */}
      <div className="flex items-stretch">
        <div
          role="button"
          tabIndex={0}
          onClick={onComuta}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onComuta())}
          aria-expanded={deschis}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 px-2 py-1 text-left text-[13px]"
        >
          <span title={status.label} className="shrink-0 leading-none">
            {status.emoji}
          </span>

          <span
            className={`flex h-5 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${culoareScor(lead.scor)}`}
            title={`Scor ${lead.scor}/100`}
          >
            {lead.scor}
          </span>

          {/* Numele duce la fișa firmei; restul rândului doar deschide panoul */}
          <Link
            href={`/admin/leads/${lead.id}`}
            onClick={(e) => e.stopPropagation()}
            title="Deschide fișa firmei"
            className="min-w-0 max-w-[42%] truncate font-medium text-gray-900 hover:text-indigo-700 hover:underline sm:max-w-none"
          >
            {lead.denumire}
          </Link>

          <span
            className={`hidden shrink-0 rounded px-1.5 text-[10px] font-medium md:inline ${sursa.color}`}
          >
            {sursa.emoji} {sursa.label}
          </span>

          <span
            className={`hidden shrink-0 rounded px-1.5 text-[10px] font-medium sm:inline ${calitate.color}`}
            title={lead.observatiiSite || calitate.label}
          >
            {calitate.emoji} {calitate.label}
          </span>

          {telefon && (
            <span className="hidden shrink-0 items-center gap-0.5 text-xs text-gray-500 lg:flex">
              <PhoneIcon className="h-3 w-3" />
              {telefon}
            </span>
          )}

          {lead.categoriePrincipala && (
            <span className="hidden max-w-[10rem] shrink-0 truncate rounded bg-gray-100 px-1 text-[10px] font-medium text-gray-600 xl:inline">
              {lead.categoriePrincipala}
            </span>
          )}

          {lead.oras && (
            <span className="hidden shrink-0 text-[11px] text-gray-400 2xl:inline">{lead.oras}</span>
          )}

          <span className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] text-gray-400">
            {lead.responsabil && (
              <span
                className="hidden h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-700 sm:flex"
                title={`Se ocupă: ${lead.responsabil.name || lead.responsabil.email}`}
              >
                {(lead.responsabil.name || lead.responsabil.email).charAt(0).toUpperCase()}
              </span>
            )}
            {stareFU && (
              <span
                title={`Recontactare: ${formateazaFollowUp(lead.nextFollowUpAt)}`}
                className={`flex items-center gap-0.5 ${CULORI_FOLLOWUP[stareFU]}`}
              >
                <BellAlertIcon className="h-3 w-3" />
                {formateazaFollowUp(lead.nextFollowUpAt)}
              </span>
            )}
            {nrNotite > 0 && <span title={`${nrNotite} notițe`}>📝{nrNotite}</span>}
            <span className="hidden sm:inline">
              {new Date(lead.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
            </span>
            <span className="rounded p-0.5 hover:bg-gray-100">
              <ChevronDownIcon
                className={`h-3.5 w-3.5 text-gray-400 transition-transform ${deschis ? 'rotate-180' : ''}`}
              />
            </span>
          </span>
        </div>

        {/* Status editabil direct din listă */}
        {poateEdita ? (
          <select
            value={lead.status}
            onChange={(e) => onStatus(lead, e.target.value)}
            title="Schimbă statusul"
            className={`my-1 max-w-[8.5rem] shrink-0 cursor-pointer rounded border px-1 py-0.5 text-[10px] font-medium focus:ring-2 focus:ring-indigo-500 ${status.color}`}
          >
            {STATUSURI.map((s) => (
              <option key={s.value} value={s.value}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`my-1 shrink-0 self-center rounded border px-1 py-0.5 text-[10px] font-medium ${status.color}`}
          >
            {status.emoji} {status.scurt}
          </span>
        )}

        <div className="flex shrink-0 items-center gap-0.5 pl-1 pr-1.5">
          {telefon && (
            <button
              type="button"
              onClick={() => onWhatsApp(lead)}
              title="Trimite un șablon pe WhatsApp"
              aria-label="WhatsApp cu șablon"
              className="rounded p-1 text-[#25D366] transition-colors hover:bg-green-50 hover:text-[#1ebe5a]"
            >
              <IconWhatsApp className="h-3.5 w-3.5" />
            </button>
          )}
          {poateEdita && (
            <>
              <button
                type="button"
                onClick={() => onEditeaza(lead)}
                title="Editează"
                aria-label="Editează lead-ul"
                className="rounded p-1 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
              >
                <PencilSquareIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSterge(lead)}
                title="Șterge"
                aria-label="Șterge lead-ul"
                className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {deschis && <PanouLead lead={lead} onWhatsApp={onWhatsApp} poateEdita={poateEdita} {...panou} />}
    </div>
  )
}
