'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PermissionGate } from '@/hooks/usePermissions'

export function AddGroupButton() {
  return (
    <PermissionGate permission="groups.create">
      <Link
        href="/admin/groups/new"
        className="px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm xs:text-base font-medium hover:bg-indigo-700 transition-colors text-center"
      >
        + Adaugă grupă
      </Link>
    </PermissionGate>
  )
}

export function AddCourseButton() {
  return (
    <PermissionGate permission="courses.create">
      <Link
        href="/admin/courses/new"
        className="px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm xs:text-base font-medium hover:bg-indigo-700 transition-colors text-center"
      >
        + Adaugă curs
      </Link>
    </PermissionGate>
  )
}

export function AddTeacherButton() {
  return (
    <PermissionGate permission="teachers.create">
      <Link
        href="/admin/teachers/new"
        className="px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm xs:text-base font-medium hover:bg-indigo-700 transition-colors text-center"
      >
        + Adaugă personal
      </Link>
    </PermissionGate>
  )
}

export function AddBranchButton() {
  return (
    <PermissionGate permission="branches.create">
      <Link
        href="/admin/branches/new"
        className="px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm xs:text-base font-medium hover:bg-indigo-700 transition-colors text-center"
      >
        + Adaugă filială
      </Link>
    </PermissionGate>
  )
}

export function AddPaymentButton({ groupStudentId, children, className }) {
  return (
    <PermissionGate permission="payments.create">
      {children || (
        <button className={className || "px-3 xs:px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"}>
          + Adaugă plată
        </button>
      )}
    </PermissionGate>
  )
}

export function AddMakeupButton({ children, className }) {
  return (
    <PermissionGate permission="makeup.create">
      {children || (
        <button className={className || "px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"}>
          + Programează recuperare
        </button>
      )}
    </PermissionGate>
  )
}

export function AddReviewButton() {
  return (
    <PermissionGate permission="reviews.create">
      <Link
        href="/admin/reviews/new"
        className="px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm xs:text-base font-medium hover:bg-indigo-700 transition-colors text-center"
      >
        + Adaugă recenzie
      </Link>
    </PermissionGate>
  )
}

export function EditReviewLink({ reviewId, className }) {
  return (
    <PermissionGate permission="reviews.edit">
      <Link
        href={`/admin/reviews/${reviewId}`}
        className={className || "text-indigo-600 hover:text-indigo-900 text-sm font-medium"}
      >
        Editează
      </Link>
    </PermissionGate>
  )
}

export function DeleteReviewButton({ reviewId, className }) {
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
        router.refresh()
      } else {
        alert('Eroare la ștergere')
      }
    } catch (error) {
      alert('Eroare la ștergere')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <PermissionGate permission="reviews.delete">
      <button
        onClick={handleDelete}
        disabled={loading}
        className={className || "text-red-600 hover:text-red-900 text-sm font-medium"}
      >
        {loading ? '...' : 'Șterge'}
      </button>
    </PermissionGate>
  )
}
