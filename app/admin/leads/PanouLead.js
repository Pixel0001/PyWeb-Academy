'use client'

/**
 * Ce se deschide sub un lead când apeși pe rând — la fel ca în CRM-ul Olla.
 *
 * Tot ce-ți trebuie în timpul apelului, fără să pleci din listă: datele
 * firmei, pitch-ul, cine se ocupă, recontactarea, notițele și butoanele de
 * contact (telefon, WhatsApp, rețea socială, Maps, site).
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  PhoneIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  MapPinIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import {
  getStatus,
  getSursa,
  getCalitate,
  stareFollowUp,
  formateazaFollowUp,
  STILURI_FOLLOWUP,
} from '@/lib/leads/statusuri'
import { esteSocial } from '@/lib/leads/social'
import { numarWhatsApp, linkWhatsApp } from '@/lib/leads/sabloane'
import { IconWhatsApp } from './RandLead'

const ORA_IMPLICITA = 10

/** Data locală în formatul cerut de <input type="datetime-local">. */
function laInputLocal(valoare) {
  if (!valoare) return ''
  const d = new Date(valoare)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function pesteZile(zile) {
  const d = new Date()
  d.setDate(d.getDate() + zile)
  d.setHours(ORA_IMPLICITA, 0, 0, 0)
  return d.toISOString()
}

function dataScurta(v, cuOra = false) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    ...(cuOra ? { hour: '2-digit', minute: '2-digit' } : { year: '2-digit' }),
  })
}

// Aceleași praguri ca în lib/leads/scoring.js — aici doar arătăm defalcarea.
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

export default function PanouLead({
  lead,
  poateEdita,
  echipa = [],
  onResponsabil,
  onFollowUp,
  onAdaugaNota,
  onStergeNota,
  onCopiaza,
  onWhatsApp,
}) {
  const [notaNoua, setNotaNoua] = useState('')
  const [salveaza, setSalveaza] = useState(false)

  const status = getStatus(lead.status)
  const sursa = getSursa(lead.sursa)
  const calitate = getCalitate(lead.calitateSite)
  const notite = lead.notiteIstoric || []
  const telefon = lead.telefon || lead.telefonLocal
  const numarWa = numarWhatsApp(lead)
  const linkSursa = sursa.value !== 'GOOGLE_MAPS' ? sursa.link(lead) : null
  const retea = esteSocial(lead.siteUrl)
  const stareFU = stareFollowUp(lead.nextFollowUpAt)
  const stilFU = stareFU ? STILURI_FOLLOWUP[stareFU] : null
  const rating = typeof lead.rating === 'number' ? String(lead.rating).replace('.', ',') : null

  async function trimiteNota() {
    if (!notaNoua.trim() || salveaza) return
    setSalveaza(true)
    const ok = await onAdaugaNota(lead, notaNoua.trim())
    if (ok) setNotaNoua('')
    setSalveaza(false)
  }

  return (
    <div className="space-y-2.5 border-t border-gray-100 px-2 pb-2.5 pt-1.5 text-xs">
      {/* Chips vizibile doar pe ecran mic, unde sunt ascunse în rând */}
      <div className="flex flex-wrap gap-1 sm:hidden">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${status.color}`}>
          {status.emoji} {status.label}
        </span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${sursa.color}`}>
          {sursa.emoji} {sursa.label}
        </span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${calitate.color}`}>
          {calitate.emoji} {calitate.label}
        </span>
      </div>

      {/* Ce citesc la telefon */}
      {lead.pitch && (
        <div className="flex items-start gap-2 rounded-lg bg-indigo-50 p-2">
          <p className="flex-1 italic leading-snug text-indigo-900">„{lead.pitch}&rdquo;</p>
          <button
            type="button"
            onClick={() => onCopiaza(lead.pitch, 'Pitch copiat')}
            className="shrink-0 rounded p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600"
            title="Copiază pitch-ul"
          >
            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 lg:grid-cols-4">
        {telefon && (
          <Detaliu eticheta="Telefon">
            <a href={`tel:${telefon}`} className="text-indigo-600 hover:underline">
              {telefon}
            </a>
          </Detaliu>
        )}
        <Detaliu eticheta="Site">
          {lead.siteUrl ? (
            <a
              href={lead.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-indigo-600 hover:underline"
            >
              {lead.siteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </a>
          ) : (
            'nu are'
          )}
        </Detaliu>
        <Detaliu eticheta="Calitate site">
          <span className={`rounded px-1 py-px ${calitate.color}`}>
            {calitate.emoji} {calitate.label}
          </span>
        </Detaliu>
        <Detaliu eticheta="Scor">
          <b>{lead.scor}</b>
          <span className="ml-1 font-normal text-gray-400">
            = site {calitate.puncte} + rating {puncteRating(lead.rating)} + recenzii{' '}
            {puncteRecenzii(lead.nrRecenzii)}
          </span>
        </Detaliu>
        {lead.categoriePrincipala && <Detaliu eticheta="Categorie">{lead.categoriePrincipala}</Detaliu>}
        {lead.oras && <Detaliu eticheta="Oraș">{lead.oras}</Detaliu>}
        <Detaliu eticheta="Rating Google">{rating ? `${rating} ★ · ${lead.nrRecenzii} recenzii` : '—'}</Detaliu>
        <Detaliu eticheta="Sursă">
          {sursa.emoji} {sursa.label}
        </Detaliu>
        {lead.sursaDetaliu && <Detaliu eticheta={sursa.detaliu}>{lead.sursaDetaliu}</Detaliu>}
        <Detaliu eticheta="Adăugat">
          {dataScurta(lead.createdAt, true)}
          {lead.adaugatDe ? ` — ${lead.adaugatDe}` : ''}
        </Detaliu>
        <Detaliu eticheta="Ultimul apel">{dataScurta(lead.dataApel, true)}</Detaliu>
        {lead.businessStatus && lead.businessStatus !== 'OPERATIONAL' && (
          <Detaliu eticheta="Stare firmă">{lead.businessStatus}</Detaliu>
        )}
        {lead.observatiiSite && (
          <Detaliu eticheta="Ce am găsit la site" latime="col-span-2 lg:col-span-4">
            {lead.observatiiSite}
          </Detaliu>
        )}
        {lead.adresa && (
          <Detaliu eticheta="Adresă" latime="col-span-2 lg:col-span-4">
            {lead.adresa}
          </Detaliu>
        )}
        {lead.categorii?.length > 1 && (
          <Detaliu eticheta="Găsit la categoriile" latime="col-span-2 lg:col-span-4">
            {lead.categorii.join(', ')}
          </Detaliu>
        )}
      </div>

      {/* Locațiile firmei (Fornetti × 10 → un singur lead) */}
      {Array.isArray(lead.locatii) && lead.locatii.length > 1 && (
        <Locatii locatii={lead.locatii} />
      )}

      {/* Responsabil */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wide text-gray-400">Responsabil</span>
        <select
          value={lead.responsabilId || ''}
          disabled={!poateEdita}
          onChange={(e) => onResponsabil(lead, e.target.value || null)}
          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
        >
          <option value="">Nimeni</option>
          {echipa.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name || o.email}
              {o.telegramLegat ? '' : ' (fără Telegram)'}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-gray-400">primește notificarea de recontactare pe Telegram</span>
      </div>

      {/* Recontactare */}
      {poateEdita && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-gray-400">Recontactare</span>
          {stilFU && (
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${stilFU.color}`}>
              {stilFU.emoji} {formateazaFollowUp(lead.nextFollowUpAt)}
            </span>
          )}
          <input
            type="datetime-local"
            value={laInputLocal(lead.nextFollowUpAt)}
            onChange={(e) =>
              onFollowUp(lead, e.target.value ? new Date(e.target.value).toISOString() : null)
            }
            className="rounded-lg border border-gray-300 px-2 py-0.5 text-xs text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
          {[1, 3, 7].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onFollowUp(lead, pesteZile(d))}
              title={`Peste ${d} ${d === 1 ? 'zi' : 'zile'}, la ${ORA_IMPLICITA}:00`}
              className="rounded border border-gray-200 px-1.5 py-0.5 text-[11px] text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
            >
              +{d}z
            </button>
          ))}
          {lead.nextFollowUpAt && (
            <button
              type="button"
              onClick={() => onFollowUp(lead, null)}
              className="text-[11px] text-gray-400 hover:text-red-600"
            >
              șterge
            </button>
          )}
        </div>
      )}

      {/* Notițe */}
      <div className="space-y-1.5">
        {poateEdita && (
          <div className="flex gap-1.5">
            <input
              type="text"
              value={notaNoua}
              onChange={(e) => setNotaNoua(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  trimiteNota()
                }
              }}
              placeholder="Notiță rapidă… (Enter pentru salvare)"
              className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={trimiteNota}
              disabled={salveaza || !notaNoua.trim()}
              className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {salveaza ? '…' : 'Adaugă'}
            </button>
          </div>
        )}

        {notite.length > 0 && (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {notite.map((n) => (
              <li key={n.id} className="group flex items-start gap-1.5 rounded-lg bg-gray-50 px-2 py-1">
                <span className="flex-1 whitespace-pre-wrap text-gray-700">{n.continut}</span>
                <span className="whitespace-nowrap text-[10px] text-gray-400">
                  {dataScurta(n.createdAt, true)}
                  {n.autorNume ? ` · ${n.autorNume}` : ''}
                </span>
                {poateEdita && (
                  <button
                    type="button"
                    onClick={() => onStergeNota(lead, n.id)}
                    className="text-gray-300 hover:text-red-600"
                    aria-label="Șterge notița"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Acțiuni rapide */}
      <div className="flex flex-wrap gap-1.5">
        {telefon && (
          <a
            href={`tel:${telefon}`}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <PhoneIcon className="h-3 w-3" /> Sună
          </a>
        )}
        {numarWa && (
          <>
            <button
              type="button"
              onClick={() => onWhatsApp(lead)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-[#1ebe5a]"
            >
              <IconWhatsApp /> WhatsApp cu șablon
            </button>
            <a
              href={linkWhatsApp(numarWa, '')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-green-300 px-2 py-1 text-[11px] font-medium text-green-700 transition-colors hover:bg-green-50"
            >
              <IconWhatsApp /> Chat gol
            </a>
          </>
        )}
        {linkSursa && (
          <a
            href={linkSursa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {sursa.emoji} {sursa.label}
          </a>
        )}
        {retea && (
          <a
            href={lead.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-blue-700"
          >
            💬 Scrie pe {retea}
          </a>
        )}
        {lead.linkMaps && (
          <a
            href={lead.linkMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <MapPinIcon className="h-3 w-3" /> Google Maps
          </a>
        )}
        {lead.siteUrl && !retea && (
          <a
            href={lead.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <GlobeAltIcon className="h-3 w-3" /> Vezi site-ul
          </a>
        )}
        {telefon && (
          <button
            type="button"
            onClick={() => onCopiaza(telefon, 'Număr copiat')}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ClipboardDocumentIcon className="h-3 w-3" /> Copiază nr.
          </button>
        )}
        <Link
          href={`/admin/leads/${lead.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 px-2 py-1 text-[11px] font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
        >
          <ArrowTopRightOnSquareIcon className="h-3 w-3" />
          Fișa completă
        </Link>
      </div>
    </div>
  )
}

function Locatii({ locatii }) {
  const [toate, setToate] = useState(false)
  const vizibile = toate ? locatii : locatii.slice(0, 4)
  // Cele cu cele mai multe recenzii, primele
  const ordonate = [...vizibile].sort((a, b) => (b.nrRecenzii || 0) - (a.nrRecenzii || 0))

  return (
    <div className="rounded-lg bg-sky-50/60 p-2">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-sky-700">
        📍 {locatii.length} locații — recenziile și ratingul de mai sus sunt pe toată firma
      </p>
      <ul className="space-y-0.5">
        {ordonate.map((l) => (
          <li key={l.placeId} className="flex flex-wrap items-center gap-x-2 text-[11px] text-gray-700">
            <span className="min-w-0 flex-1 truncate">
              {l.adresa || l.denumire || 'fără adresă'}
            </span>
            {l.telefon && (
              <a href={`tel:${l.telefon}`} className="text-indigo-600 hover:underline">
                {l.telefon}
              </a>
            )}
            {typeof l.rating === 'number' && (
              <span className="text-gray-500">
                ⭐{String(l.rating).replace('.', ',')} · {l.nrRecenzii}
              </span>
            )}
            {l.linkMaps && (
              <a href={l.linkMaps} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600">
                Maps ↗
              </a>
            )}
          </li>
        ))}
      </ul>
      {locatii.length > 4 && (
        <button type="button" onClick={() => setToate((v) => !v)} className="mt-1 text-[11px] font-medium text-sky-700 hover:underline">
          {toate ? 'arată mai puține' : `arată toate cele ${locatii.length}`}
        </button>
      )}
    </div>
  )
}

function Detaliu({ eticheta, children, latime = '' }) {
  return (
    <div className={`min-w-0 ${latime}`}>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{eticheta}</p>
      <div className="break-words font-medium text-gray-800">{children}</div>
    </div>
  )
}
