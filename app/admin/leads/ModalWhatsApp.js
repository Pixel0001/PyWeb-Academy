'use client'

/**
 * Trimiterea unui șablon pe WhatsApp către un lead.
 *
 * Fereastra se deschide direct la etapa potrivită (după statusul firmei:
 * primul mesaj, nu răspunde, revenire...) și pune primele șabloanele care se
 * potrivesc firmei: domeniul ei, situația site-ului, limba. Cel mai potrivit
 * e deja ales și completat — de cele mai multe ori rămâne doar „Deschide
 * WhatsApp". Textul se poate ajusta înainte de trimitere.
 */

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import {
  completeaza,
  valoriPentruLead,
  numarWhatsApp,
  linkWhatsApp,
  ETAPE,
  etapaPentruStatus,
  potrivire,
  normalizeaza,
} from '@/lib/leads/sabloane'

// Șabloanele se cer o dată pe minut, nu la fiecare lead deschis
let cacheSabloane = null
let cacheLa = 0

/** Grupa de categorii a firmei („Magazine", „Școli private și educație"...). */
function grupFirma(lead, grupuriCategorii = []) {
  const categorii = (lead.categorii || []).map(normalizeaza)
  for (const g of grupuriCategorii) {
    if (g.categorii.some((c) => categorii.includes(normalizeaza(c.ro)))) return g.grup
  }
  return null
}

export default function ModalWhatsApp({ lead, numeleMeu, onInchide, onTrimis, grupuriCategorii = [] }) {
  const proaspat = cacheSabloane && Date.now() - cacheLa < 60000
  const [sabloane, setSabloane] = useState(proaspat ? cacheSabloane : null)
  const [etapa, setEtapa] = useState(() => etapaPentruStatus(lead.status))
  const [cautare, setCautare] = useState('')
  const [ales, setAles] = useState(null)
  const [text, setText] = useState('')

  const numar = numarWhatsApp(lead)
  const grup = useMemo(() => grupFirma(lead, grupuriCategorii), [lead, grupuriCategorii])

  useEffect(() => {
    if (proaspat) return
    fetch('/api/admin/sabloane')
      .then((r) => r.json())
      .then((d) => {
        cacheSabloane = d.sabloane || []
        cacheLa = Date.now()
        setSabloane(cacheSabloane)
      })
      .catch(() => setSabloane([]))
  }, [proaspat])

  // Escape închide fereastra
  useEffect(() => {
    const laTasta = (e) => e.key === 'Escape' && onInchide()
    window.addEventListener('keydown', laTasta)
    return () => window.removeEventListener('keydown', laTasta)
  }, [onInchide])

  // Câte șabloane are fiecare etapă — tab-urile goale nu se arată
  const peEtape = useMemo(() => {
    const numar = {}
    for (const s of sabloane || []) {
      const e = s.etapa || 'PRIMUL_CONTACT'
      numar[e] = (numar[e] || 0) + 1
    }
    return numar
  }, [sabloane])

  // Șabloanele etapei, cele potrivite firmei primele
  const lista = useMemo(() => {
    const c = normalizeaza(cautare.trim())
    return (sabloane || [])
      .filter((s) => (s.etapa || 'PRIMUL_CONTACT') === etapa)
      .filter((s) => !c || normalizeaza(`${s.nume} ${s.categorie || ''}`).includes(c))
      .map((s) => ({ ...s, potrivire: potrivire(s, lead, grup) }))
      .sort((a, b) => b.potrivire.scor - a.potrivire.scor || (a.ordine ?? 0) - (b.ordine ?? 0))
  }, [sabloane, etapa, cautare, lead, grup])

  const celMaiBun = lista[0]?.potrivire.scor

  function alege(s) {
    setAles(s)
    setText(
      completeaza(s.text, valoriPentruLead(lead, numeleMeu, s.limba || 'ro'), {
        samanta: `${lead.id}:${s.id}`,
      })
    )
  }

  // Cel mai potrivit e ales din start — de obicei rămâne doar să-l trimiți
  useEffect(() => {
    if (!lista.length) return
    if (ales && lista.some((s) => s.id === ales.id)) return
    alege(lista[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista])

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
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
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
              {grup ? ` · ${grup}` : ''}
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
          <>
            {/* Etapele discuției */}
            <div className="flex flex-wrap gap-1 border-b border-gray-100 px-3 py-2">
              {ETAPE.filter((e) => peEtape[e.value] || e.value === etapa).map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEtapa(e.value)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    etapa === e.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {e.emoji} {e.label}
                  {peEtape[e.value] ? <span className="ml-1 opacity-70">{peEtape[e.value]}</span> : null}
                </button>
              ))}
            </div>

            <div className="grid flex-1 gap-0 overflow-hidden sm:grid-cols-[250px_1fr]">
              {/* Lista de șabloane */}
              <div className="flex max-h-56 flex-col border-b border-gray-100 sm:max-h-none sm:border-b-0 sm:border-r">
                <div className="relative p-2">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    value={cautare}
                    onChange={(e) => setCautare(e.target.value)}
                    placeholder="Caută șablon…"
                    className="w-full rounded-lg border border-gray-200 py-1 pl-7 pr-2 text-xs focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                  {sabloane === null && <p className="p-2 text-xs text-gray-400">Se încarcă...</p>}

                  {sabloane?.length === 0 && (
                    <div className="p-2 text-xs text-gray-500">
                      Niciun șablon încă.{' '}
                      <Link href="/admin/sabloane" className="text-indigo-600 underline">
                        Adaugă-le pe cele gata scrise
                      </Link>
                      .
                    </div>
                  )}

                  {sabloane?.length > 0 && !lista.length && (
                    <p className="p-2 text-xs text-gray-500">Niciun șablon pentru etapa asta.</p>
                  )}

                  {lista.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => alege(s)}
                      className={`mb-1 w-full rounded-lg px-2.5 py-1.5 text-left transition ${
                        ales?.id === s.id ? 'bg-green-50 ring-1 ring-green-400' : 'hover:bg-gray-50'
                      } ${s.potrivire.altSite ? 'opacity-60' : ''}`}
                    >
                      <p className="text-[13px] font-medium leading-snug text-gray-900">
                        {/* Steaua doar la cel mai potrivit — altfel nu mai spune nimic */}
                        {s.potrivire.potrivit && s.potrivire.scor === celMaiBun && (
                          <span title="Cel mai potrivit pentru firma asta">⭐ </span>
                        )}
                        {s.nume}
                        {s.limba && s.limba !== 'ro' && (
                          <span className="ml-1 rounded bg-sky-100 px-1 text-[10px] font-semibold uppercase text-sky-700">
                            {s.limba}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {s.potrivire.altSite ? '⚠ scris pentru alt fel de site' : s.categorie || ''}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textul completat, editabil */}
              <div className="flex flex-col p-3">
                {ales ? (
                  <>
                    <p className="mb-1 text-xs text-gray-500">
                      Completat cu datele firmei — îl poți ajusta înainte de trimitere.
                    </p>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={11}
                      className="flex-1 rounded-lg border border-gray-300 p-2 text-sm leading-relaxed focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                    <p className="mt-1 text-right text-[10px] text-gray-400">{text.length} caractere</p>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-400">
                    Alege un șablon din stânga
                  </div>
                )}
              </div>
            </div>
          </>
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
