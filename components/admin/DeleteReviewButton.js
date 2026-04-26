'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { TrashIcon } from '@heroicons/react/24/outline'

export default function DeleteReviewButton({ reviewId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Sigur doriți să ștergeți acest review?')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Review șters!')
        router.push('/admin/reviews')
        router.refresh()
      } else {
        toast.error('Eroare la ștergere')
      }
    } catch (error) {
      toast.error('Eroare la ștergere')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
    >
      <TrashIcon className="w-5 h-5" />
      {loading ? 'Se șterge...' : 'Șterge'}
    </button>
  )
}
