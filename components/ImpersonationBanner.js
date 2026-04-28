'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { ArrowLeftOnRectangleIcon, EyeIcon } from '@heroicons/react/24/outline'

/**
 * Banner sticky afișat când SUPERADMIN-ul impersonează alt cont.
 * Citește starea din session.user.impersonating.
 */
export default function ImpersonationBanner() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  if (!session?.user?.impersonating) return null

  const handleStop = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/impersonate/stop', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Eroare')
        setLoading(false)
        return
      }
      toast.success('Ai revenit la contul de admin')
      window.location.href = data.redirectTo || '/admin/teachers'
    } catch (e) {
      toast.error('Eroare')
      setLoading(false)
    }
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 flex items-center justify-between gap-2 xs:gap-4">
        <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
          <EyeIcon className="w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs xs:text-sm font-medium leading-tight">
              <span className="hidden sm:inline">Vizualizezi ca </span>
              <span className="font-bold truncate">{session.user.name}</span>
              <span className="text-amber-100 ml-1 text-[10px] xs:text-xs">
                ({session.user.role === 'TEACHER' ? 'Profesor' : 'Admin'})
              </span>
            </p>
            <p className="text-[10px] xs:text-xs text-amber-50 leading-tight hidden xs:block">
              Original: {session.user.originalName}
            </p>
          </div>
        </div>
        <button
          onClick={handleStop}
          disabled={loading}
          className="flex items-center gap-1 xs:gap-1.5 px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 bg-white text-orange-700 rounded-lg text-[11px] xs:text-xs sm:text-sm font-semibold hover:bg-amber-50 transition-colors disabled:opacity-60 flex-shrink-0"
        >
          <ArrowLeftOnRectangleIcon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
          <span className="hidden xs:inline">Înapoi la admin</span>
          <span className="xs:hidden">Ieși</span>
        </button>
      </div>
    </div>
  )
}
