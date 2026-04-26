'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import ReviewForm from '@/components/admin/ReviewForm'

export default function NewReviewPage() {
  const router = useRouter()
  const { hasPermission, isSuperAdmin, loading } = usePermissions()
  
  useEffect(() => {
    if (!loading && !hasPermission('reviews.create') && !isSuperAdmin) {
      router.push('/admin/reviews')
    }
  }, [hasPermission, isSuperAdmin, loading, router])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  if (!hasPermission('reviews.create') && !isSuperAdmin) {
    return null
  }

  return (
    <div>
      <div className="mb-4 xs:mb-6 md:mb-8">
        <h1 className="text-xl xs:text-2xl md:text-3xl font-bold text-gray-900">Adaugă Review</h1>
        <p className="text-gray-600 mt-1 xs:mt-2 text-sm xs:text-base">Adaugă un review nou pentru afișare pe site</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-3 xs:p-4 md:p-6">
        <ReviewForm />
      </div>
    </div>
  )
}
