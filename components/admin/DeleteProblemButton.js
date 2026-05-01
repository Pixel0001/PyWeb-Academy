'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function DeleteProblemButton({ id, title }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!confirm(`Ștergi problema "${title}"? Acțiunea este ireversibilă.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/problems/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Eroare')
      }
      toast.success('Problemă ștearsă')
      router.refresh()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
    >
      {loading ? '...' : 'Șterge'}
    </button>
  )
}
