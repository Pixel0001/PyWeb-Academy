'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  XMarkIcon,
  StarIcon,
} from '@heroicons/react/24/outline'

export default function StartSessionButton({ groupId, scheduleDays, scheduleTime, isSuperTeacher = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState(null)

  // Modal state for super-teacher custom date/time
  const [showCustomModal, setShowCustomModal] = useState(false)
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const [customDate, setCustomDate] = useState(todayStr)
  const [customTime, setCustomTime] = useState(nowTime)

  const submitCreate = async (body) => {
    setLoading(true)
    setScheduleError(null)
    try {
      const res = await fetch('/api/teacher/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, ...body })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Sesiune nouă creată!')
        setShowCustomModal(false)
        router.push(`/teacher/groups/${groupId}/session/${data.id}`)
        router.refresh()
      } else {
        if (data.canStart === false) {
          setScheduleError({
            message: data.error,
            nextSessionFormatted: data.nextSessionFormatted,
          })
          toast.error('Nu poți porni lecția acum')
        } else {
          toast.error(data.error || 'Eroare la crearea sesiunii')
        }
      }
    } catch (e) {
      toast.error('Eroare la crearea sesiunii')
    } finally {
      setLoading(false)
    }
  }

  const handleStartNow = () => submitCreate({})

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (!customDate || !customTime) {
      toast.error('Completează data și ora')
      return
    }
    // Build ISO from local date+time (treat as local time)
    const iso = new Date(`${customDate}T${customTime}:00`).toISOString()
    submitCreate({ customDate: iso })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleStartNow}
          disabled={loading}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <PlusIcon className="w-5 h-5" />
          {loading ? 'Se creează...' : 'Începe Sesiune Nouă'}
        </button>

        {isSuperTeacher && (
          <button
            onClick={() => setShowCustomModal(true)}
            disabled={loading}
            title="Pornește o sesiune cu dată/oră personalizată"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
          >
            <CalendarDaysIcon className="w-5 h-5" />
            <span className="hidden xs:inline">Sesiune personalizată</span>
            <span className="xs:hidden">Personalizat</span>
            <StarIcon className="w-4 h-4 text-yellow-200" />
          </button>
        )}
      </div>

      {isSuperTeacher && (
        <p className="text-xs text-amber-700 flex items-center gap-1">
          <StarIcon className="w-3.5 h-3.5" />
          Ești <strong>Super Profesor</strong> — poți porni lecții la orice dată/oră.
        </p>
      )}

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

      {/* Custom date/time modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">Sesiune personalizată</h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCustomSubmit} className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Alege data și ora la care a avut loc lecția. Sesiunea va fi creată cu această dată în sistem.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Data lecției</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ora lecției</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={e => setCustomTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                💡 <strong>Tip:</strong> Această funcție este pentru înregistrare retroactivă a lecțiilor.
                Poți selecta orice dată din trecut sau viitor.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {loading ? 'Se creează...' : 'Creează sesiunea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
