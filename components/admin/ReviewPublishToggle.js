'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ReviewPublishToggle({ review }) {
  const router = useRouter()
  const [published, setPublished] = useState(review.published)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...review, published: !published })
      })

      if (res.ok) {
        setPublished(!published)
        toast.success(published ? 'Review ascuns' : 'Review publicat')
        router.refresh()
      } else {
        toast.error('Eroare la actualizare')
      }
    } catch (error) {
      toast.error('Eroare la actualizare')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        published ? 'bg-green-500' : 'bg-gray-300'
      } ${loading ? 'opacity-50' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          published ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
