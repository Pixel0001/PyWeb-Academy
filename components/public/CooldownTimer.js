'use client'
import { useState, useEffect } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'

export default function CooldownTimer({ endsAt }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endsAt - Date.now()))

  useEffect(() => {
    const iv = setInterval(() => {
      const ms = Math.max(0, endsAt - Date.now())
      setRemaining(ms)
      if (ms === 0) clearInterval(iv)
    }, 1000)
    return () => clearInterval(iv)
  }, [endsAt])

  const totalSec = Math.ceil(remaining / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  const fmt = h > 0
    ? `${h}h ${m.toString().padStart(2, '0')}min ${s.toString().padStart(2, '0')}s`
    : m > 0
    ? `${m}min ${s.toString().padStart(2, '0')}s`
    : `${s}s`

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500">
      <ClockIcon className="w-3 h-3 shrink-0" />
      {fmt}
    </span>
  )
}
