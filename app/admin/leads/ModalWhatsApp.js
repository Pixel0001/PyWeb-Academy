'use client'

/**
 * Trimiterea unui șablon pe WhatsApp către un lead.
 *
 * Alegi șablonul → textul apare completat cu datele firmei → îl mai poți
 * ajusta → „Deschide WhatsApp" pornește conversația cu mesajul gata scris.
 * Se salvează și o notiță pe lead, ca să știi că i-ai scris și ce.
 */

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { completeaza, valoriPentruLead, numarWhatsApp, linkWhatsApp } from '@/lib/leads/sabloane'

// Șabloanele se cer o singură dată pe sesiune, nu la fiecare lead deschis.
let cacheSabloane = null

export default function ModalWhatsApp({ lead, numeleMeu, onInchide, onTrimis }) {
  const [sabloane, setSabloane] = useState(cacheSabloane)
  const [ales, setAles] = useState(null)
  const [text, setText] = useState('')

  const numar = numarWhatsApp(lead)
  const valori = useMemo(() => valoriPentruLead(lead, numeleMeu), [lead, numeleMeu])

  useEffect(() => {
    if (cacheSabloane) return
    fetch('/api/admin/sabloane')
      .then((r) => r.json())
      .then((d) => {
        cacheSabloane = d.sabloane || []
        setSabloane(cacheSabloane)
      })
      .catch(() => setSabloane([]))
  }, [])

  // Escape închide fereastra
  useEffect(() => {
    const laTasta = (e) => e.key === 'Escape' && onInchide()
    window.addEventListener('keydown', laTasta)
    return () => window.removeEventListener('keydown', laTasta)
  }, [onInchide])

  function alege(s) {
    setAles(s)
    setText(completeaza(s.text, valori))
  }

  async function trimite() {
    const link = linkWhatsApp(numar, text)
    if (!link) return

    window.open(link, '_blank', 'noopener')

    // Contorul șablonului — ca să vezi care se folosesc cu adevărat
    if (ales?.id) fetch(`/api/admin/sabloane/${ales.id}`, { method: 'POST' }).catch(() => {})

    // O notiță pe lead: „i-am scris pe WhatsApp, cu șablonul X"
    await onTrimis?.(lead, ales?.nume || 'mesaj personalizat')
    toast.success('WhatsApp deschis. Am notat pe lead.')
    onInchide()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onInchide}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Antet */}
        <div className="flex items-start justify-between border-b border-gray-100 p-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="text-lg">💬</span>
              WhatsApp către {lead.denumire}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {numar ? `+${numar}` : 'fără număr de telefon'}
            </p>
          </div>
          <button onClick={onInchide} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {!numar ? (
          <div className="p-6 text-center text-sm text-gray-600">
            Firma asta nu are număr de telefon în Google Maps, deci nu i se poate scrie pe WhatsApp.
          </div>
        ) : (
          <div className="grid flex-1 gap-0 overflow-hidden sm:grid-cols-[200px_1fr]">
            {/* Lista de șabloane */}
            <div className="max-h-48 overflow-y-auto border-b border-gray-100 p-2 sm:max-h-none sm:border-b-0 sm:border-r">
              {sabloane === null && <p className="p-2 text-xs text-gray-400">Se încarcă...</p>}

              {sabloane?.length === 0 && (
                <div className="p-2 text-xs text-gray-500">
                  Niciun șablon încă.{' '}
                  <Link href="/admin/sabloane" className="text-indigo-600 underline">
                    Creează unul
                  </Link>
                  .
                </div>
              )}

              {sabloane?.map((s) => (
                <button
                  key={s.id}
                  onClick={() => alege(s)}
                  className={`mb-1 w-full rounded-lg px-2.5 py-2 text-left transition ${
                    ales?.id === s.id
                      ? 'bg-green-50 ring-1 ring-green-400'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{s.nume}</p>
                  {s.categorie && <p className="text-[10px] text-gray-400">{s.categorie}</p>}
                </button>
              ))}
            </div>

            {/* Textul completat, editabil */}
            <div className="flex flex-col p-3">
              {ales ? (
                <>
                  <p className="mb-1 text-xs text-gray-500">
                    Textul e completat cu datele firmei — îl poți ajusta înainte de trimitere.
                  </p>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={10}
                    className="flex-1 rounded-lg border border-gray-300 p-2 text-sm leading-relaxed focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-400">
                  Alege un șablon din stânga
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subsol */}
        {numar && (
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 p-3">
            <Link href="/admin/sabloane" className="text-xs text-gray-400 hover:text-indigo-600">
              gestionează șabloanele
            </Link>
            <button
              onClick={trimite}
              disabled={!ales || !text.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5a] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Deschide WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
