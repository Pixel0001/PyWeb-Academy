'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function DeleteCourseButton({ id, title }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Ești sigur că vrei să ștergi cursul "${title}"?`)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Cursul a fost șters')
        router.refresh()
      } else {
        toast.error('Eroare la ștergerea cursului')
      }
    } catch (error) {
      toast.error('Eroare la ștergerea cursului')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
    >
      {loading ? '...' : 'Șterge'}
    </button>
  )
}
