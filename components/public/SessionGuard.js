'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const STORAGE_KEY_PREFIX = 'pyweb-learn-session:'
const POLL_INTERVAL_MS = 15000 // 15 secunde

function generateSessionId() {
  // 16 bytes random hex (32 chars)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  let s = ''
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

export default function SessionGuard({ token }) {
  const [kicked, setKicked] = useState(false)
  const router = useRouter()
  const sessionIdRef = useRef(null)
  const pollTimerRef = useRef(null)

  useEffect(() => {
    if (!token) return
    if (typeof window === 'undefined') return

    const storageKey = STORAGE_KEY_PREFIX + token

    // Generează sau preia sessionId-ul din localStorage
    let sid = null
    try { sid = localStorage.getItem(storageKey) } catch {}
    if (!sid) {
      sid = generateSessionId()
      try { localStorage.setItem(storageKey, sid) } catch {}
    }
    sessionIdRef.current = sid

    let cancelled = false

    // Claim: declarăm acest browser ca sesiune activă
    const claim = async () => {
      try {
        await fetch(`/api/public/learn/${token}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid }),
          cache: 'no-store',
        })
      } catch {}
    }

    // Check: verifică dacă mai suntem sesiunea activă
    const check = async () => {
      if (cancelled) return
      try {
        const r = await fetch(
          `/api/public/learn/${token}/session?sessionId=${encodeURIComponent(sid)}`,
          { cache: 'no-store' }
        )
        if (!r.ok) return
        const d = await r.json()
        if (cancelled) return
        if (d.active === false && d.kicked === true) {
          setKicked(true)
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          // Curăță sessionId-ul ca să nu reclaim accidental la refresh
          try { localStorage.removeItem(storageKey) } catch {}
        }
      } catch {}
    }

    claim().then(() => {
      // Polling
      pollTimerRef.current = setInterval(check, POLL_INTERVAL_MS)
      // Verifică la întoarcerea în tab
      const onVisible = () => {
        if (document.visibilityState === 'visible') check()
      }
      document.addEventListener('visibilitychange', onVisible)
      return () => document.removeEventListener('visibilitychange', onVisible)
    })

    return () => {
      cancelled = true
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [token])

  if (!kicked) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center mb-4">
          <ExclamationTriangleIcon className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
          Cont folosit din altă locație
        </h2>
        <p className="text-slate-600 text-sm sm:text-base mb-6">
          Contul tău a fost accesat dintr-un alt browser sau dispozitiv. Pentru
          siguranță, această sesiune a fost închisă. Dacă tu ești cel care a
          deschis, intră din nou folosind link-ul tău.
        </p>
        <button
          onClick={() => {
            try { localStorage.removeItem(STORAGE_KEY_PREFIX + token) } catch {}
            router.push('/learn')
          }}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
        >
          Înțeles, mergi la pagina principală
        </button>
      </div>
    </div>
  )
}
