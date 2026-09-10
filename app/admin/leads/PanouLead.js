'use client'

/**
 * Ce se deschide sub un lead când apeși pe rând.
 *
 * Scopul e să nu mai fie nevoie să pleci din listă: aici ai tot ce era pe
 * pagina firmei — pitch-ul de citit la telefon, contactul, recontactarea,
 * notițele și toate datele de la Google. Când treci prin 300 de firme, fiecare
 * navigare dus-întors te costă timp și îți pierzi locul în listă.
 */

import Link from 'next/link'
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import FollowUpPicker from './FollowUpPicker'

export default function PanouLead({
  lead,
  calitate,
  social,
  rating,
  notite,
  notaNoua,
  setNotaNoua,
  salveaza,
  onTrimiteNota,
  onFollowUp,
  onStergeNota,
  onCopiaza,
}) {
  return (
    <div className="space-y-2.5 border-t border-gray-100 bg-gray-50/50 px-3 py-2.5">
      {/* Ce citesc la telefon — primul lucru, că de-aia am deschis rândul */}
      {lead.pitch && (
        <div className="flex items-start gap-2 rounded bg-indigo-50 p-2">
          <p className="flex-1 text-xs italic leading-snug text-indigo-900">
            „{lead.pitch}&rdquo;
          </p>
          <button
            onClick={() => onCopiaza(lead.pitch)}
            className="shrink-0 rounded p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
            title="Copiază pitch-ul"
          >
            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Contactul, mare și de apăsat */}
      <div className="flex flex-wrap items-center gap-2">
        {lead.telefon && (
          <>
            <a
              href={`tel:${lead.telefon}`}
              className="inline-flex items-center gap-1.5 rounded bg-green-600 px-2.5 py-1 text-sm font-semibold text-white hover:bg-green-700"
            >
              <PhoneIcon className="h-4 w-4" />
              {lead.telefon}
            </a>
            <button
              onClick={() => onCopiaza(lead.telefon)}
              className="rounded border border-gray-300 bg-white p-1 text-gray-500 hover:bg-gray-50"
              title="Copiază numărul"
            >
              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {!lead.telefon && social && (
          <a
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-2.5 py-1 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Scrie pe {social.nume}
          </a>
        )}

        {lead.linkMaps && (
          <a
            href={lead.linkMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            Google Maps
          </a>
        )}

        {lead.siteUrl && (
          <a
            href={lead.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
          >
            Vezi site-ul
          </a>
        )}
      </div>

      {/* Recontactarea */}
      <div className="rounded bg-white p-2">
        <FollowUpPicker valoare={lead.nextFollowUpAt} onChange={(v) => onFollowUp(lead, v)} />
      </div>

      {/* Notițele — scrii direct aici, câte vrei */}
      <div className="rounded bg-white p-2">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={notaNoua}
            onChange={(e) => setNotaNoua(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onTrimiteNota()}
            placeholder="Ce s-a discutat la telefon... (Enter salvează)"
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={onTrimiteNota}
            disabled={!notaNoua.trim() || salveaza}
            className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300"
          >
            {salveaza ? '...' : 'Adaugă'}
          </button>
        </div>

        {notite.length > 0 && (
          <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto">
            {notite.map((n) => (
              <li
                key={n.id}
                className="group flex items-start gap-1.5 rounded bg-gray-50 px-2 py-1 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="leading-snug text-gray-800">{n.continut}</p>
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

      {/* Toate datele, într-o grilă strânsă */}
      <div className="grid gap-x-4 gap-y-1.5 rounded bg-white p-2 sm:grid-cols-2 lg:grid-cols-3">
        <Camp eticheta="Scor">
          <b>{lead.scor}</b>
          <span className="ml-1 text-gray-400">
            = site {calitate.puncte} + rating {puncteRating(lead.rating)} + recenzii{' '}
            {puncteRecenzii(lead.nrRecenzii)}
          </span>
        </Camp>

        <Camp eticheta="Site">
          <span className={`rounded px-1 py-px ${calitate.color}`}>
            {calitate.emoji} {calitate.label}
          </span>
        </Camp>

        <Camp eticheta="Rating">
          {rating ? `${rating} ★ din ${lead.nrRecenzii} recenzii` : '—'}
        </Camp>

        <Camp eticheta="Categorie">{lead.categoriePrincipala || '—'}</Camp>
        <Camp eticheta="Oraș">{lead.oras || '—'}</Camp>
        <Camp eticheta="Stare firmă">{lead.businessStatus || '—'}</Camp>

        <Camp eticheta="Ce am găsit la site" latime="sm:col-span-2 lg:col-span-3">
          {lead.observatiiSite || '—'}
        </Camp>

        <Camp eticheta="Adresă" latime="sm:col-span-2 lg:col-span-3">
          {lead.adresa || '—'}
        </Camp>

        {lead.categorii?.length > 1 && (
          <Camp eticheta="Găsit la categoriile" latime="sm:col-span-2 lg:col-span-3">
            {lead.categorii.join(', ')}
          </Camp>
        )}

        <Camp eticheta="Descoperit">{dataScurta(lead.createdAt)}</Camp>
        <Camp eticheta="Site verificat">{dataScurta(lead.verificatLa)}</Camp>
        <Camp eticheta="Ultimul apel">{dataScurta(lead.dataApel)}</Camp>
      </div>

      <div className="flex justify-end">
        <Link
          href={`/admin/leads/${lead.id}`}
          className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-indigo-600"
        >
          deschide pagina firmei
          <ArrowTopRightOnSquareIcon className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

function Camp({ eticheta, children, latime = '' }) {
  return (
    <div className={latime}>
      <span className="text-[10px] uppercase tracking-wide text-gray-400">{eticheta}</span>
      <div className="text-xs leading-snug text-gray-800">{children}</div>
    </div>
  )
}

function dataScurta(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// Aceleași praguri ca în lib/leads/scoring.js — aici doar arătăm defalcarea,
// ca să se vadă de ce a ieșit scorul exact atât.
function puncteRating(rating) {
  if (typeof rating !== 'number') return 0
  if (rating >= 4.5) return 30
  if (rating >= 4.0) return 20
  if (rating >= 3.5) return 10
  return 0
}

function puncteRecenzii(n) {
  const nr = n || 0
  if (nr >= 100) return 20
  if (nr >= 30) return 15
  if (nr >= 10) return 8
  return 0
}
