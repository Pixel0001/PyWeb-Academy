'use client'

/**
 * Conectarea contului propriu la botul de Telegram.
 *
 * Apeși un buton, se deschide botul, apeși Start — gata. Chat ID-ul se
 * completează singur pe contul tău, fără să-l copiezi de nicăieri.
 *
 * Merge pentru orice cont logat: admin, superadmin sau profesor.
 */

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { PaperAirplaneIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function ConectareTelegram() {
  const [stare, setStare] = useState(null)
  const [seIncarca, setSeIncarca] = useState(true)
  const [link, setLink] = useState(null)
  const [asteapta, setAsteapta] = useState(false)
  const [webhook, setWebhook] = useState(null)
  const [seteazaWebhook, setSeteazaWebhook] = useState(false)

  const citesteStarea = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/telegram')
      if (!r.ok) return null
      const d = await r.json()
      setStare(d)
      return d
    } catch {
      return null
    } finally {
      setSeIncarca(false)
    }
  }, [])

  const citesteWebhook = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/telegram/webhook')
      if (r.ok) setWebhook(await r.json())
    } catch {
      /* doar informativ */
    }
  }, [])

  useEffect(() => {
    citesteStarea()
    citesteWebhook()
  }, [citesteStarea, citesteWebhook])

  async function inregistreazaWebhook() {
    setSeteazaWebhook(true)
    try {
      const r = await fetch('/api/admin/telegram/webhook', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) {
        toast.error(d.error || 'Nu am putut seta webhook-ul', { duration: 8000 })
        return
      }
      toast.success('Webhook înregistrat. Botul primește de acum mesajele.')
      citesteWebhook()
    } finally {
      setSeteazaWebhook(false)
    }
  }

  // Cât timp așteptăm conectarea, întrebăm serverul din 3 în 3 secunde:
  // omul apasă Start în Telegram, iar cardul se schimbă singur.
  useEffect(() => {
    if (!asteapta) return

    const t = setInterval(async () => {
      const d = await citesteStarea()
      if (d?.legat) {
        setAsteapta(false)
        setLink(null)
        toast.success('Telegram conectat')
      }
    }, 3000)

    // Nu polăm la nesfârșit — codul expiră oricum în 15 minute.
    const stop = setTimeout(() => setAsteapta(false), 3 * 60 * 1000)

    return () => {
      clearInterval(t)
      clearTimeout(stop)
    }
  }, [asteapta, citesteStarea])

  async function conecteaza() {
    const r = await fetch('/api/admin/telegram', { method: 'POST' })
    const d = await r.json()

    if (!r.ok) {
      toast.error(d.error || 'Nu am putut genera linkul')
      return
    }

    setLink(d.link)
    setAsteapta(true)
    window.open(d.link, '_blank', 'noopener')
  }

  async function deconecteaza() {
    if (!confirm('Nu vei mai primi notificări pe Telegram. Continui?')) return

    const r = await fetch('/api/admin/telegram', { method: 'DELETE' })
    if (!r.ok) {
      toast.error('Nu am putut deconecta')
      return
    }
    toast.success('Deconectat')
    setLink(null)
    setAsteapta(false)
    citesteStarea()
  }

  if (seIncarca) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-400">Se încarcă...</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <PaperAirplaneIcon className="h-6 w-6 -rotate-45 text-sky-500" />
        <h2 className="text-lg font-bold text-gray-900">Telegram</h2>
        {stare?.legat && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            conectat
          </span>
        )}
      </div>

      {!stare?.botConfigurat && (
        <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Botul nu e configurat pe server — lipsește <code>TELEGRAM_LESSONS_BOT_TOKEN</code>.
        </p>
      )}

      {stare?.legat ? (
        <>
          <p className="mt-1 text-sm text-gray-500">
            Primești notificările tale direct în Telegram
            {stare.username ? (
              <>
                , pe contul <b>@{stare.username}</b>
              </>
            ) : null}
            .
          </p>
          {stare.legatLa && (
            <p className="mt-0.5 text-xs text-gray-400">
              Conectat pe {new Date(stare.legatLa).toLocaleDateString('ro-RO')}
            </p>
          )}
          <button
            onClick={deconecteaza}
            className="mt-4 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Deconectează
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-gray-500">
            Conectează-ți contul ca să primești notificările tale direct în Telegram.
          </p>

          {asteapta ? (
            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-sky-900">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Aștept să apeși <b>Start</b> în Telegram...
              </p>
              <p className="mt-1 text-xs text-sky-700">
                S-a deschis o filă nouă cu botul. Apasă <b>Start</b> acolo — cardul ăsta se
                schimbă singur. Dacă fila nu s-a deschis,{' '}
                <a href={link} target="_blank" rel="noopener noreferrer" className="underline">
                  apasă aici
                </a>
                .
              </p>
            </div>
          ) : (
            <button
              onClick={conecteaza}
              disabled={!stare?.botConfigurat}
              className="mt-4 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Conectează Telegram
            </button>
          )}

          <p className="mt-3 text-xs text-gray-400">
            Nu trebuie să copiezi niciun cod. Linkul conține unul de unică folosință, valabil 15
            minute, care se consumă la prima apăsare.
          </p>
        </>
      )}

      {/* ── Webhook-ul botului ─────────────────────────────────── */}
      {webhook && !webhook.error && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-700">Webhook bot</span>
            {webhook.esteSetat ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800">
                ✓ activ
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">
                ✗ nesetat
              </span>
            )}
            {webhook.bot && <span className="text-[11px] text-gray-400">@{webhook.bot}</span>}
          </div>

          {!webhook.esteSetat && (
            <p className="mt-1 text-xs text-gray-500">
              Fără webhook, botul nu primește nimic: butoanele din notificări nu răspund, iar
              conectarea conturilor nu funcționează.
            </p>
          )}

          {webhook.ultimaEroare && (
            <p className="mt-1 text-xs text-red-600">
              Ultima eroare Telegram: {webhook.ultimaEroare}
            </p>
          )}

          {webhook.mesajeInAsteptare > 0 && (
            <p className="mt-1 text-xs text-amber-600">
              {webhook.mesajeInAsteptare} mesaje în așteptare — semn că webhook-ul nu livrează.
            </p>
          )}

          <button
            onClick={inregistreazaWebhook}
            disabled={seteazaWebhook}
            className="mt-2 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {seteazaWebhook
              ? 'Setez...'
              : webhook.esteSetat
                ? 'Resetează webhook-ul'
                : 'Setează webhook-ul acum'}
          </button>

          <p className="mt-1.5 break-all text-[10px] text-gray-400">{webhook.urlAsteptat}</p>
        </div>
      )}
    </div>
  )
}
