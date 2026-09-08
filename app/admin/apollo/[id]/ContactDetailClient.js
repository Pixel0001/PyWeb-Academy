'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClipboardDocumentIcon,
  BuildingOfficeIcon,
  TrashIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'

const STATUSURI = {
  GASIT: { eticheta: 'Găsit la căutare', culoare: 'bg-gray-100 text-gray-700' },
  ENRICHED: { eticheta: 'Email găsit', culoare: 'bg-green-100 text-green-800' },
  FARA_EMAIL: { eticheta: 'Fără email', culoare: 'bg-amber-100 text-amber-800' },
  IN_SECVENTA: { eticheta: 'În secvență', culoare: 'bg-indigo-100 text-indigo-800' },
  RASPUNS: { eticheta: 'A răspuns', culoare: 'bg-emerald-100 text-emerald-800' },
  REFUZ: { eticheta: 'Refuz', culoare: 'bg-red-100 text-red-800' },
}

function dataRo(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ContactDetailClient({ persoana: initiala, poateGestiona }) {
  const router = useRouter()
  const [p, setP] = useState(initiala)
  const [notite, setNotite] = useState(initiala.notite || '')

  const status = STATUSURI[p.status] || STATUSURI.GASIT
  const nume = [p.prenume, p.numeFamilie].filter(Boolean).join(' ') || '(fără nume)'

  function copiaza(text, ce) {
    navigator.clipboard?.writeText(text)
    toast.success(`${ce} copiat`)
  }

  async function salveazaNotite() {
    if (notite === (p.notite || '')) return
    const r = await fetch(`/api/admin/apollo/contacte/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notite }),
    })
    if (!r.ok) {
      toast.error('Nu am putut salva notițele')
      return
    }
    setP((x) => ({ ...x, notite }))
    toast.success('Notițe salvate')
  }

  async function sterge() {
    if (!confirm(`Ștergi definitiv „${nume}" din lista ta?`)) return
    const r = await fetch(`/api/admin/apollo/contacte/${p.id}`, { method: 'DELETE' })
    if (!r.ok) {
      toast.error('Nu am putut șterge contactul')
      return
    }
    toast.success('Contact șters')
    router.push('/admin/apollo')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/admin/apollo"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Înapoi la Apollo
      </Link>

      {/* ── Antet ─────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{nume}</h1>
            {p.numeMascat && (
              <p className="text-xs text-amber-600">
                numele de familie e încă mascat de Apollo — apare după enrich
              </p>
            )}
            <p className="mt-1 text-sm text-gray-600">{p.titlu || '—'}</p>
            {p.companie && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-gray-500">
                <BuildingOfficeIcon className="h-4 w-4" />
                {p.companie}
                {p.domeniu ? ` · ${p.domeniu}` : ''}
              </p>
            )}
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.culoare}`}>
            {status.eticheta}
          </span>
        </div>

        {/* Contactul, mare */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
          {p.email ? (
            <>
              <a
                href={`mailto:${p.email}`}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-indigo-700"
              >
                <EnvelopeIcon className="h-5 w-5" />
                {p.email}
              </a>
              <button
                onClick={() => copiaza(p.email, 'Email')}
                className="rounded-lg border border-gray-300 p-2.5 text-gray-500 hover:bg-gray-50"
                title="Copiază emailul"
              >
                <ClipboardDocumentIcon className="h-5 w-5" />
              </button>
              {p.emailStatus && (
                <span className="text-xs text-gray-500">stare Apollo: {p.emailStatus}</span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400">
              Fără email — fă enrich din pagina principală
            </span>
          )}

          {p.telefon && (
            <a
              href={`tel:${p.telefon}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <PhoneIcon className="h-4 w-4" />
              {p.telefon}
            </a>
          )}

          {p.linkedinUrl && (
            <a
              href={p.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LinkIcon className="h-4 w-4" />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      {/* ── Notițe ────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900">Notițe</h2>
        <textarea
          value={notite}
          disabled={!poateGestiona}
          onChange={(e) => setNotite(e.target.value)}
          onBlur={salveazaNotite}
          rows={3}
          placeholder="Ce ai aflat despre firma asta..."
          className="mt-2 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
        />
      </div>

      {/* ── Ce știm ───────────────────────────────────────────── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900">Date</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Camp eticheta="Companie">{p.companie || '—'}</Camp>
          <Camp eticheta="Domeniu">{p.domeniu || '—'}</Camp>
          <Camp eticheta="Oraș">{p.oras || '—'}</Camp>
          <Camp eticheta="Țară">{p.tara || '—'}</Camp>
          <Camp eticheta="Industrie">{p.industrie || '—'}</Camp>
          <Camp eticheta="Mărime firmă">
            {p.companieMarime ? `${p.companieMarime} angajați` : '—'}
          </Camp>
        </dl>
      </div>

      {/* ── Istoricul în sistem ───────────────────────────────── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900">Istoric</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Camp eticheta="Găsit la căutare">{dataRo(p.createdAt)}</Camp>
          <Camp eticheta="Email căutat (enrich)">{dataRo(p.enrichedLa)}</Camp>
          <Camp eticheta="Băgat în secvență">{dataRo(p.adaugatInSecventaLa)}</Camp>
          <Camp eticheta="Credite cheltuite pe el">
            <b>{p.crediteFolosite}</b>
          </Camp>
          {p.campanie && (
            <Camp eticheta="Campanie" latime="sm:col-span-2">
              {p.campanie.nume}
              {p.campanie.client ? ` · client: ${p.campanie.client}` : ''}
            </Camp>
          )}
          <Camp eticheta="ID Apollo (persoană)" latime="sm:col-span-2">
            <code className="break-all font-mono text-xs text-gray-500">{p.apolloPersonId}</code>
          </Camp>
          {p.apolloContactId && (
            <Camp eticheta="ID Apollo (contact CRM)" latime="sm:col-span-2">
              <code className="break-all font-mono text-xs text-gray-500">{p.apolloContactId}</code>
            </Camp>
          )}
        </dl>
      </div>

      {poateGestiona && (
        <div className="flex justify-end">
          <button
            onClick={sterge}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
            Șterge contactul
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
