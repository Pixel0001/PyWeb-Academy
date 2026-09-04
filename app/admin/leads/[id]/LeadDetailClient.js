'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  PhoneIcon,
  ArrowLeftIcon,
  MapPinIcon,
  GlobeAltIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'
import {
  STATUSURI,
  getStatus,
  getCalitate,
  stareFollowUp,
  formateazaFollowUp,
  STILURI_FOLLOWUP,
} from '@/lib/leads/statusuri'
import FollowUpPicker from '../FollowUpPicker'

function culoareScor(scor) {
  if (scor > 70) return 'bg-green-600 text-white'
  if (scor >= 40) return 'bg-yellow-400 text-yellow-950'
  return 'bg-gray-200 text-gray-600'
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

function dataRo(valoare, cuOra = false) {
  if (!valoare) return '—'
  const d = new Date(valoare)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(cuOra ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export default function LeadDetailClient({ lead: leadInitial, rulare, poateEdita }) {
  const router = useRouter()
  const [lead, setLead] = useState(leadInitial)
  const [notaNoua, setNotaNoua] = useState('')
  const [salveaza, setSalveaza] = useState(false)

  const status = getStatus(lead.status)
  const calitate = getCalitate(lead.calitateSite)
  const social = contactSocial(lead)
  const stareFU = stareFollowUp(lead.nextFollowUpAt)
  const stilFU = stareFU ? STILURI_FOLLOWUP[stareFU] : null
  const notite = lead.notiteIstoric || []

  async function patch(date, mesajEroare) {
    const raspuns = await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(date),
    })
    if (!raspuns.ok) {
      toast.error(mesajEroare)
      return null
    }
    const { lead: actualizat } = await raspuns.json()
    setLead((l) => ({ ...l, ...actualizat, notiteIstoric: l.notiteIstoric }))
    return actualizat
  }

  async function schimbaStatus(nou) {
    const anterior = lead.status
    setLead((l) => ({ ...l, status: nou }))
    const ok = await patch({ status: nou }, 'Nu am putut salva statusul')
    if (!ok) setLead((l) => ({ ...l, status: anterior }))
  }

  async function schimbaFollowUp(valoare) {
    const anterior = lead.nextFollowUpAt
    setLead((l) => ({ ...l, nextFollowUpAt: valoare }))
    const ok = await patch({ nextFollowUpAt: valoare }, 'Nu am putut salva recontactarea')
    if (!ok) setLead((l) => ({ ...l, nextFollowUpAt: anterior }))
    else toast.success(valoare ? `Recontactare: ${formateazaFollowUp(valoare)}` : 'Recontactare ștearsă')
  }

  async function adaugaNota() {
    if (!notaNoua.trim() || salveaza) return
    setSalveaza(true)
    const raspuns = await fetch(`/api/admin/leads/${lead.id}/notite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ continut: notaNoua.trim() }),
    })
    setSalveaza(false)

    if (!raspuns.ok) {
      toast.error('Nu am putut salva notița')
      return
    }
    const { nota } = await raspuns.json()
    setLead((l) => ({ ...l, notiteIstoric: [nota, ...(l.notiteIstoric || [])] }))
    setNotaNoua('')
  }

  async function stergeNota(notaId) {
    const raspuns = await fetch(`/api/admin/leads/notite/${notaId}`, { method: 'DELETE' })
    if (!raspuns.ok) {
      toast.error('Nu am putut șterge notița')
      return
    }
    setLead((l) => ({
      ...l,
      notiteIstoric: (l.notiteIstoric || []).filter((n) => n.id !== notaId),
    }))
  }

  async function stergeLead() {
    if (!confirm(`Ștergi definitiv „${lead.denumire}"? Notițele se pierd și ele.`)) return
    const raspuns = await fetch(`/api/admin/leads/${lead.id}`, { method: 'DELETE' })
    if (!raspuns.ok) {
      toast.error('Nu am putut șterge lead-ul')
      return
    }
    toast.success('Lead șters')
    router.push('/admin/leads')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Înapoi la listă
      </Link>

      {/* ── Antet ─────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl font-bold ${culoareScor(lead.scor)}`}
          >
            <span className="text-2xl leading-none">{lead.scor}</span>
            <span className="text-[10px] opacity-80">scor</span>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900">{lead.denumire}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${calitate.color}`}>
                {calitate.emoji} {calitate.label}
              </span>
              {stilFU && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${stilFU.color}`}>
                  {stilFU.emoji} {formateazaFollowUp(lead.nextFollowUpAt)}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              {lead.rating != null && (
                <span className="inline-flex items-center gap-1">
                  <StarIcon className="h-4 w-4 text-amber-500" />
                  {String(lead.rating).replace('.', ',')} din {lead.nrRecenzii} recenzii
                </span>
              )}
              {lead.oras && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {lead.oras}
                </span>
              )}
              {lead.categoriePrincipala && (
                <span className="inline-flex items-center gap-1">
                  <BuildingStorefrontIcon className="h-4 w-4" />
                  {lead.categoriePrincipala}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Contactul, mare și la vedere ────────────────────── */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          {lead.telefon ? (
            <>
              <a
                href={`tel:${lead.telefon}`}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-lg font-semibold text-white hover:bg-green-700"
              >
                <PhoneIcon className="h-5 w-5" />
                {lead.telefon}
              </a>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(lead.telefon)
                  toast.success('Număr copiat')
                }}
                className="rounded-lg border border-gray-300 p-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                title="Copiază numărul"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
              {lead.telefonLocal && lead.telefonLocal !== lead.telefon && (
                <span className="text-sm text-gray-500">local: {lead.telefonLocal}</span>
              )}
            </>
          ) : social ? (
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-blue-700"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              Scrie pe {social.nume}
            </a>
          ) : (
            <span className="text-sm text-gray-400">Fără date de contact</span>
          )}

          <select
            value={lead.status}
            disabled={!poateEdita}
            onChange={(e) => schimbaStatus(e.target.value)}
            className={`ml-auto rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-60 ${status.color}`}
          >
            {STATUSURI.map((s) => (
              <option key={s.value} value={s.value}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Pitch ─────────────────────────────────────────────── */}
      {lead.pitch && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Ce spui când sună
              </p>
              <p className="mt-1.5 text-base italic leading-relaxed text-indigo-900">
                „{lead.pitch}&rdquo;
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(lead.pitch)
                toast.success('Pitch copiat')
              }}
              className="shrink-0 rounded-lg p-2 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700"
              title="Copiază pitch-ul"
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Recontactare ──────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <FollowUpPicker valoare={lead.nextFollowUpAt} onChange={schimbaFollowUp} disabled={!poateEdita} />
      </div>

      {/* ── Istoricul discuțiilor ─────────────────────────────── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900">Istoric discuții</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          O notiță per apel. Când suni a treia oară, vezi ce s-a discutat la primele două.
        </p>

        {poateEdita && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={notaNoua}
              onChange={(e) => setNotaNoua(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && adaugaNota()}
              placeholder="Ce s-a discutat la telefon..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={adaugaNota}
              disabled={!notaNoua.trim() || salveaza}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {salveaza ? '...' : 'Adaugă'}
            </button>
          </div>
        )}

        {notite.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">Nicio notiță încă.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notite.map((n) => (
              <li key={n.id} className="group flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{n.continut}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {dataRo(n.createdAt, true)}
                    {n.autorNume ? ` · ${n.autorNume}` : ''}
                  </p>
                </div>
                {poateEdita && (
                  <button
                    onClick={() => stergeNota(n.id)}
                    className="shrink-0 rounded p-1 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-red-600"
                    title="Șterge notița"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Analiza site-ului ─────────────────────────────────── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900">Analiza site-ului</h2>

        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Camp eticheta="Verdict">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${calitate.color}`}>
              {calitate.emoji} {calitate.label}
            </span>
            <span className="ml-2 text-xs text-gray-500">+{calitate.puncte} puncte la scor</span>
          </Camp>

          <Camp eticheta="Verificat la">{dataRo(lead.verificatLa, true)}</Camp>

          <Camp eticheta="Ce am găsit" latime="sm:col-span-2">
            {lead.observatiiSite || '—'}
          </Camp>

          <Camp eticheta="Adresa site-ului" latime="sm:col-span-2">
            {lead.siteUrl ? (
              <a
                href={lead.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all text-indigo-600 hover:underline"
              >
                <GlobeAltIcon className="h-4 w-4 shrink-0" />
                {lead.siteUrl}
              </a>
            ) : (
              <span className="text-red-600">nu are site în Google Maps</span>
            )}
          </Camp>
        </dl>

        {/* Defalcarea scorului — de ce a ieșit atât */}
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-700">Cum s-a format scorul {lead.scor}</p>
          <div className="mt-1.5 space-y-1 text-xs text-gray-600">
            <p>
              Site ({calitate.label}): <b>+{calitate.puncte}</b>
            </p>
            <p>
              Rating ({lead.rating != null ? String(lead.rating).replace('.', ',') : 'lipsă'}):{' '}
              <b>+{puncteRating(lead.rating)}</b>
            </p>
            <p>
              Recenzii ({lead.nrRecenzii}): <b>+{puncteRecenzii(lead.nrRecenzii)}</b>
            </p>
          </div>
        </div>
      </div>

      {/* ── Datele de la Google ───────────────────────────────── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900">Date de la Google Maps</h2>

        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Camp eticheta="Adresa" latime="sm:col-span-2">{lead.adresa || '—'}</Camp>
          <Camp eticheta="Rating">
            {lead.rating != null ? `${String(lead.rating).replace('.', ',')} ★` : '—'}
          </Camp>
          <Camp eticheta="Număr recenzii">{lead.nrRecenzii ?? 0}</Camp>
          <Camp eticheta="Stare business">{lead.businessStatus || '—'}</Camp>
          <Camp eticheta="Oraș">{lead.oras || '—'}</Camp>

          <Camp eticheta="Categorii găsite" latime="sm:col-span-2">
            <div className="flex flex-wrap gap-1">
              {(lead.categorii || []).map((c) => (
                <span key={c} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {c}
                </span>
              ))}
              {!lead.categorii?.length && '—'}
            </div>
          </Camp>

          <Camp eticheta="Pe hartă" latime="sm:col-span-2">
            {lead.linkMaps ? (
              <a
                href={lead.linkMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Deschide în Google Maps
              </a>
            ) : (
              '—'
            )}
          </Camp>
        </dl>
      </div>

      {/* ── Proveniență ───────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900">Proveniență</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Camp eticheta="Descoperit la">{dataRo(lead.createdAt, true)}</Camp>
          <Camp eticheta="Ultima actualizare">{dataRo(lead.updatedAt, true)}</Camp>
          <Camp eticheta="Data ultimului apel">{dataRo(lead.dataApel, true)}</Camp>
          <Camp eticheta="PLACE_ID">
            <code className="break-all font-mono text-xs text-gray-500">{lead.placeId}</code>
          </Camp>
          {rulare && (
            <Camp eticheta="Găsit în rularea" latime="sm:col-span-2">
              {dataRo(rulare.startedAt, true)} · {rulare.orase?.length} orașe ×{' '}
              {rulare.categorii?.length} categorii
            </Camp>
          )}
        </dl>
      </div>

      {poateEdita && (
        <div className="flex justify-end">
          <button
            onClick={stergeLead}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
            Șterge lead-ul
          </button>
        </div>
      )}
    </div>
  )
}

function Camp({ eticheta, children, latime = '' }) {
  return (
    <div className={latime}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{eticheta}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{children}</dd>
    </div>
  )
}

// Aceleași praguri ca în lib/leads/scoring.js — aici doar le afișăm.
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
