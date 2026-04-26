'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import ReviewForm from '@/components/admin/ReviewForm'
import DeleteReviewButton from '@/components/admin/DeleteReviewButton'

export default function EditReviewPage({ params }) {
  const router = useRouter()
  const { hasPermission, isSuperAdmin, loading: permLoading } = usePermissions()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchReview = async () => {
      try {
        const { id } = await params
        const res = await fetch(`/api/admin/reviews/${id}`)
        if (res.ok) {
          const data = await res.json()
          setReview(data)
        } else {
          router.push('/admin/reviews')
        }
      } catch (error) {
        console.error('Error fetching review:', error)
        router.push('/admin/reviews')
      } finally {
        setLoading(false)
      }
    }
    fetchReview()
  }, [params, router])
  
  useEffect(() => {
    if (!permLoading && !hasPermission('reviews.edit') && !isSuperAdmin) {
      router.push('/admin/reviews')
    }
  }, [hasPermission, isSuperAdmin, permLoading, router])
  
  if (loading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  if (!hasPermission('reviews.edit') && !isSuperAdmin) {
    return null
  }
  
  if (!review) {
    return null
  }

  return (
    <div>
      <div className="flex flex-col xs:flex-row justify-between items-start gap-3 xs:gap-4 mb-4 xs:mb-6 md:mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl xs:text-2xl md:text-3xl font-bold text-gray-900">Editează Review</h1>
          <p className="text-gray-600 mt-1 xs:mt-2 text-sm xs:text-base truncate">Modifică review-ul de la {review.authorName}</p>
        </div>
        {(hasPermission('reviews.delete') || isSuperAdmin) && (
          <DeleteReviewButton reviewId={review.id} />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-3 xs:p-4 md:p-6">
        <ReviewForm review={review} />
      </div>
    </div>
  )
}
