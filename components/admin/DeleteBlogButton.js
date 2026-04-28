'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { TrashIcon } from '@heroicons/react/24/outline'

export default function DeleteBlogButton({ id, title }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Sigur vrei să ștergi blogul „${title}"?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Blog șters')
        router.refresh()
      } else {
        const j = await res.json().catch(() => ({}))
        toast.error(j.error || 'Eroare la ștergere')
      }
    } catch {
      toast.error('Eroare la ștergere')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading}
      className="text-red-600 hover:text-red-700 disabled:opacity-50 inline-flex items-center gap-1 text-sm font-medium">
      <TrashIcon className="w-4 h-4" /> Șterge
    </button>
  )
}
