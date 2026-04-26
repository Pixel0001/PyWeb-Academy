'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PlusIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function StartSessionButton({ groupId, scheduleDays, scheduleTime }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState(null)

  const handleStartSession = async () => {
    setLoading(true)
    setScheduleError(null)
    
    try {
      const res = await fetch('/api/teacher/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Sesiune nouă creată!')
        router.push(`/teacher/groups/${groupId}/session/${data.id}`)
        router.refresh()
      } else {
        // Verifică dacă e eroare de programare
        if (data.canStart === false) {
          setScheduleError({
            message: data.error,
            nextSessionFormatted: data.nextSessionFormatted
          })
          toast.error('Nu poți porni lecția acum')
        } else {
          toast.error(data.error || 'Eroare la crearea sesiunii')
        }
      }
    } catch (error) {
      toast.error('Eroare la crearea sesiunii')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleStartSession}
        disabled={loading}
        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        <PlusIcon className="w-5 h-5" />
        {loading ? 'Se creează...' : 'Începe Sesiune Nouă'}
      </button>
      
      {scheduleError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-amber-800 font-medium text-sm">{scheduleError.message}</p>
              
              {scheduleError.nextSessionFormatted && (
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <ClockIcon className="w-4 h-4" />
                  <span>Următoarea sesiune: {scheduleError.nextSessionFormatted}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
