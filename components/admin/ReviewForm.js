'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { PhotoIcon, XMarkIcon, StarIcon, UserGroupIcon, AcademicCapIcon, UserIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

export default function ReviewForm({ review }) {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [courses, setCourses] = useState([])
  const [imagePreview, setImagePreview] = useState(review?.avatarUrl || null)
  const [formData, setFormData] = useState({
    authorName: review?.authorName || '',
    roleLabel: review?.roleLabel || 'Părinte',
    rating: review?.rating || 5,
    message: review?.message || '',
    courseId: review?.courseId || '',
    avatarUrl: review?.avatarUrl || '',
    published: review?.published ?? true
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses')
      if (res.ok) {
        const data = await res.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('folder', 'reviews')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData
      })

      if (res.ok) {
        const { url } = await res.json()
        setFormData(prev => ({ ...prev, avatarUrl: url }))
        toast.success('Imagine încărcată!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Eroare la încărcare')
        setImagePreview(review?.avatarUrl || null)
      }
    } catch (error) {
      toast.error('Eroare la încărcare')
      setImagePreview(review?.avatarUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, avatarUrl: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = review 
        ? `/api/admin/reviews/${review.id}` 
        : '/api/admin/reviews'
      const method = review ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rating: parseInt(formData.rating),
          courseId: formData.courseId || null
        })
      })

      if (res.ok) {
        toast.success(review ? 'Review actualizat!' : 'Review adăugat!')
        router.push('/admin/reviews')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Eroare la salvare')
      }
    } catch (error) {
      toast.error('Eroare la salvare')
    } finally {
      setLoading(false)
    }
  }

  // Star rating component
  const StarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
          className="p-0.5 xs:p-1 hover:scale-110 transition-transform focus:outline-none"
        >
          {star <= formData.rating ? (
            <StarIconSolid className="w-7 h-7 xs:w-8 xs:h-8 text-amber-400" />
          ) : (
            <StarIcon className="w-7 h-7 xs:w-8 xs:h-8 text-gray-300 hover:text-amber-200" />
          )}
        </button>
      ))}
      <span className="ml-1 xs:ml-2 text-xs xs:text-sm text-gray-500">({formData.rating}/5)</span>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-6 md:space-y-8">
      {/* Avatar Upload Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl xs:rounded-2xl p-3 xs:p-4 md:p-6 border border-amber-100">
        <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-2 xs:mb-3 md:mb-4">
          Fotografie autor
        </label>
        <div className="flex flex-col xs:flex-row items-center gap-3 xs:gap-4 md:gap-6">
          {/* Preview */}
          <div className="relative flex-shrink-0">
            {imagePreview ? (
              <div className="relative w-20 h-20 xs:w-24 xs:h-24 rounded-full overflow-hidden ring-2 xs:ring-4 ring-amber-200 shadow-lg">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-1 -right-1 w-5 h-5 xs:w-6 xs:h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                >
                  <XMarkIcon className="w-3 h-3 xs:w-4 xs:h-4" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 xs:w-24 xs:h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <PhotoIcon className="w-8 h-8 xs:w-10 xs:h-10 text-gray-400" />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1 w-full xs:w-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className={`inline-flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 md:px-5 py-2 xs:py-2.5 md:py-3 rounded-lg xs:rounded-xl text-xs xs:text-sm md:text-base font-medium cursor-pointer transition-all w-full xs:w-auto ${
                uploading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400'
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 xs:w-5 xs:h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="hidden xs:inline">Se încarcă...</span>
                </>
              ) : (
                <>
                  <PhotoIcon className="w-4 h-4 xs:w-5 xs:h-5" />
                  <span className="hidden xs:inline">{imagePreview ? 'Schimbă fotografia' : 'Încarcă fotografie'}</span>
                  <span className="xs:hidden">{imagePreview ? 'Schimbă' : 'Încarcă'}</span>
                </>
              )}
            </label>
            <p className="mt-1 xs:mt-2 text-[10px] xs:text-xs text-gray-500 text-center xs:text-left">
              JPG, PNG sau WebP. Max 5MB. Funcționează și de pe telefon.
            </p>
          </div>
        </div>
      </div>

      {/* Author Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6">
        <div>
          <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-1.5 xs:mb-2">
            Nume autor *
          </label>
          <input
            type="text"
            name="authorName"
            value={formData.authorName}
            onChange={handleChange}
            required
            className="w-full px-3 xs:px-4 py-2 xs:py-3 border-2 border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-400 transition-all"
            placeholder="ex: Maria Popescu"
          />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-1.5 xs:mb-2">
            Rol autor
          </label>
          <div className="grid grid-cols-2 gap-2 xs:gap-3">
            {[
              { value: 'Părinte', icon: UserGroupIcon, label: 'Părinte' },
              { value: 'Elev', icon: AcademicCapIcon, label: 'Elev' },
              { value: 'Profesor', icon: UserIcon, label: 'Profesor' },
              { value: 'Absolvent', icon: AcademicCapIcon, label: 'Absolvent' }
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, roleLabel: value }))}
                className={`flex items-center justify-center gap-1 xs:gap-2 px-2 xs:px-3 md:px-4 py-2 xs:py-2.5 md:py-3 rounded-lg xs:rounded-xl border-2 text-xs xs:text-sm font-medium transition-all ${
                  formData.roleLabel === value
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                <Icon className="w-4 h-4 xs:w-5 xs:h-5" />
                <span className="hidden xs:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-2 xs:mb-3">
          Rating *
        </label>
        <StarRating />
      </div>

      {/* Course Selection */}
      <div>
        <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-1.5 xs:mb-2">
          Curs asociat (opțional)
        </label>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, courseId: '' }))}
            className={`flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-3 rounded-lg xs:rounded-xl border-2 text-xs xs:text-sm font-medium transition-all ${
              formData.courseId === ''
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/50'
            }`}
          >
            <XMarkIcon className="w-4 h-4 xs:w-5 xs:h-5" />
            <span className="truncate">Fără curs specific</span>
          </button>
          {courses.map(course => (
            <button
              key={course.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, courseId: course.id }))}
              className={`flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 xs:py-3 rounded-lg xs:rounded-xl border-2 text-xs xs:text-sm font-medium transition-all text-left ${
                formData.courseId === course.id
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/50'
              }`}
            >
              <BookOpenIcon className="w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0" />
              <span className="truncate">{course.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-1.5 xs:mb-2">
          Mesaj review *
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={4}
          className="w-full px-3 xs:px-4 py-2 xs:py-3 border-2 border-gray-200 rounded-lg xs:rounded-xl text-xs xs:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-400 transition-all resize-none"
          placeholder="Scrieți testimonialul aici..."
        />
        <p className="mt-1 text-[10px] xs:text-xs text-gray-500 text-right">
          {formData.message.length} caractere
        </p>
      </div>

      {/* Published Toggle */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-4 p-3 xs:p-4 bg-gray-50 rounded-lg xs:rounded-xl">
        <div>
          <p className="font-medium text-gray-900 text-xs xs:text-sm md:text-base">Publicat pe site</p>
          <p className="text-xs xs:text-sm text-gray-500">Review-ul va fi vizibil pe pagina principală</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            name="published"
            checked={formData.published}
            onChange={handleChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 xs:w-14 xs:h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 xs:after:h-6 xs:after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-col-reverse xs:flex-row gap-2 xs:gap-3 md:gap-4 pt-2 xs:pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 xs:px-5 md:px-6 py-2.5 xs:py-3 md:py-4 border-2 border-gray-200 rounded-lg xs:rounded-xl text-gray-700 hover:bg-gray-50 text-xs xs:text-sm md:text-base font-medium transition-all"
        >
          Anulează
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-2.5 xs:py-3 md:py-4 px-4 xs:px-5 md:px-6 rounded-lg xs:rounded-xl text-xs xs:text-sm md:text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200 hover:shadow-xl hover:shadow-amber-300"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1.5 xs:gap-2">
              <div className="w-4 h-4 xs:w-5 xs:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Se salvează...
            </span>
          ) : (
            review ? '✓ Actualizează Review' : '+ Adaugă Review'
          )}
        </button>
      </div>
    </form>
  )
}
