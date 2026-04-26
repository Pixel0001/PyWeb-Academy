export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import ReviewPublishToggle from '@/components/admin/ReviewPublishToggle'
import PermissionGuard from '@/components/admin/PermissionGuard'
import { AddReviewButton, EditReviewLink, DeleteReviewButton } from '@/components/admin/PermissionButtons'

export default async function ReviewsPage() {
  return (
    <PermissionGuard permission="reviews.view">
      <ReviewsPageContent />
    </PermissionGuard>
  )
}

async function ReviewsPageContent() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: { course: true }
  })

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
    ))
  }

  return (
    <div className="space-y-4 xs:space-y-6">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-600 text-sm xs:text-base">Gestionează recenziile afișate pe site</p>
        </div>
        <AddReviewButton />
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mesaj</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curs</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Publicat</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Nu există reviews. Adaugă primul review!
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{review.authorName}</p>
                      {review.roleLabel && (
                        <p className="text-sm text-gray-500">{review.roleLabel}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex">{renderStars(review.rating)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 truncate max-w-xs">{review.message}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {review.course?.title || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <ReviewPublishToggle review={JSON.parse(JSON.stringify(review))} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <EditReviewLink reviewId={review.id} />
                      <DeleteReviewButton reviewId={review.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3 xs:space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl xs:rounded-2xl shadow-sm border border-gray-100 p-8 xs:p-12 text-center text-gray-500 text-sm xs:text-base">
            Nu există reviews. Adaugă primul review!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl xs:rounded-2xl shadow-sm border border-gray-100 p-3 xs:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2 xs:mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm xs:text-base truncate">{review.authorName}</p>
                  {review.roleLabel && (
                    <p className="text-xs text-gray-500 truncate">{review.roleLabel}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 text-sm xs:text-lg">{renderStars(review.rating)}</div>
              </div>
              
              <p className="text-xs xs:text-sm text-gray-600 line-clamp-2 mb-2 xs:mb-3">{review.message}</p>
              
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-2 xs:pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs text-gray-500 truncate max-w-[100px] xs:max-w-none">
                    {review.course?.title || 'Fără curs'}
                  </span>
                  <ReviewPublishToggle review={JSON.parse(JSON.stringify(review))} />
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 self-end xs:self-auto">
                  <EditReviewLink reviewId={review.id} className="text-indigo-600 hover:text-indigo-900 text-xs font-medium" />
                  <DeleteReviewButton reviewId={review.id} className="text-red-600 hover:text-red-900 text-xs font-medium" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
