'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { PhotoIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

export default function CourseForm({ course }) {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Inițializare imagini - include imageUrl în array dacă images e gol
  const initialImages = course?.images?.length > 0 
    ? course.images 
    : (course?.imageUrl ? [course.imageUrl] : [])
  const initialMainImage = course?.mainImageUrl || course?.imageUrl || ''
  
  const [formData, setFormData] = useState({
    title: course?.title || '',
    slug: course?.slug || '',
    descriptionShort: course?.descriptionShort || '',
    descriptionLong: course?.descriptionLong || '',
    category: course?.category || '',
    level: course?.level || '',
    ageMin: course?.ageMin || '',
    ageMax: course?.ageMax || '',
    duration: course?.duration || '',
    lessonsCount: course?.lessonsCount || '',
    price: course?.price || 0,
    discountPrice: course?.discountPrice || '',
    seatsTotal: course?.seatsTotal || 10,
    active: course?.active ?? true,
    images: initialImages,
    mainImageUrl: initialMainImage
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    setFormData(prev => ({ ...prev, slug }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadedUrls = []
      
      for (const file of files) {
        const uploadData = new FormData()
        uploadData.append('file', file)
        uploadData.append('folder', 'courses')

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: uploadData
        })

        if (res.ok) {
          const data = await res.json()
          uploadedUrls.push(data.url)
        } else {
          const data = await res.json()
          toast.error(data.error || `Eroare la încărcarea ${file.name}`)
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => {
          const newImages = [...prev.images, ...uploadedUrls]
          // Dacă nu există imagine principală, setează prima imagine
          const mainImageUrl = prev.mainImageUrl || uploadedUrls[0]
          return { ...prev, images: newImages, mainImageUrl }
        })
        toast.success(`${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'imagine încărcată' : 'imagini încărcate'}`)
      }
    } catch (error) {
      toast.error('Eroare la încărcarea imaginilor')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (imageUrl) => {
    setFormData(prev => {
      const newImages = prev.images.filter(img => img !== imageUrl)
      // Dacă am șters imaginea principală, selectează prima imagine rămasă
      let newMainImageUrl = prev.mainImageUrl
      if (prev.mainImageUrl === imageUrl) {
        newMainImageUrl = newImages[0] || ''
      }
      return { ...prev, images: newImages, mainImageUrl: newMainImageUrl }
    })
  }

  const setMainImage = (imageUrl) => {
    setFormData(prev => ({ ...prev, mainImageUrl: imageUrl }))
    toast.success('Imagine principală actualizată')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = course ? `/api/admin/courses/${course.id}` : '/api/admin/courses'
      const method = course ? 'PUT' : 'POST'

      // Pentru compatibilitate, setează și imageUrl cu imaginea principală
      const dataToSend = {
        ...formData,
        ageMin: formData.ageMin ? parseInt(formData.ageMin) : null,
        ageMax: formData.ageMax ? parseInt(formData.ageMax) : null,
        lessonsCount: formData.lessonsCount ? parseInt(formData.lessonsCount) : null,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        seatsTotal: parseInt(formData.seatsTotal),
        imageUrl: formData.mainImageUrl // Pentru compatibilitate
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (res.ok) {
        toast.success(course ? 'Cursul a fost actualizat' : 'Cursul a fost creat')
        router.push('/admin/courses')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'A apărut o eroare')
      }
    } catch (error) {
      toast.error('A apărut o eroare')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4 sm:gap-6">
        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Titlu *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={() => !course && !formData.slug && generateSlug()}
            required
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <div className="flex gap-1.5 xs:gap-2">
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className="flex-1 px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
            <button
              type="button"
              onClick={generateSlug}
              className="px-2.5 xs:px-4 py-2 text-xs xs:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
            >
              <span className="hidden xs:inline">Generează</span>
              <span className="xs:hidden">Gen.</span>
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Descriere scurtă *</label>
          <textarea
            name="descriptionShort"
            value={formData.descriptionShort}
            onChange={handleChange}
            required
            rows={2}
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Descriere lungă</label>
          <textarea
            name="descriptionLong"
            value={formData.descriptionLong}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Categorie</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="ex: Programare"
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-700"
          />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Nivel</label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          >
            <option value="">Selectează nivel</option>
            <option value="Începător">Începător</option>
            <option value="Intermediar">Intermediar</option>
            <option value="Avansat">Avansat</option>
          </select>
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Vârstă minimă</label>
          <input
            type="number"
            name="ageMin"
            value={formData.ageMin}
            onChange={handleChange}
            min={1}
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Vârstă maximă</label>
          <input
            type="number"
            name="ageMax"
            value={formData.ageMax}
            onChange={handleChange}
            min={1}
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Durată lecție</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="ex: 60 min"
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-700"
          />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Număr lecții</label>
          <input
            type="number"
            name="lessonsCount"
            value={formData.lessonsCount}
            onChange={handleChange}
            min={1}
            placeholder="Opțional"
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Preț (MDL)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min={0}
            step={0.01}
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Preț redus (MDL)</label>
          <input
            type="number"
            name="discountPrice"
            value={formData.discountPrice}
            onChange={handleChange}
            min={0}
            step={0.01}
            placeholder="Opțional"
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Locuri totale</label>
          <input
            type="number"
            name="seatsTotal"
            value={formData.seatsTotal}
            onChange={handleChange}
            min={1}
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>

        {/* Imagini multiple */}
        <div className="md:col-span-2">
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1.5 xs:mb-2">
            Imagini curs
            <span className="text-gray-500 font-normal ml-2">(click pe stea pentru a seta imaginea principală)</span>
          </label>
          
          {/* Preview imagini existente */}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {formData.images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <div className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    formData.mainImageUrl === imageUrl 
                      ? 'border-yellow-400 ring-2 ring-yellow-400/50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}>
                    <Image
                      src={imageUrl}
                      alt={`Imagine ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {/* Badge pentru imaginea principală */}
                    {formData.mainImageUrl === imageUrl && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded">
                        PRINCIPALĂ
                      </div>
                    )}
                  </div>
                  
                  {/* Butoane de acțiune */}
                  <div className="absolute -top-2 -right-2 flex gap-1">
                    {/* Buton pentru setare ca imagine principală */}
                    <button
                      type="button"
                      onClick={() => setMainImage(imageUrl)}
                      className={`p-1 rounded-full shadow-md transition-colors ${
                        formData.mainImageUrl === imageUrl
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-white text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                      title={formData.mainImageUrl === imageUrl ? 'Imagine principală' : 'Setează ca imagine principală'}
                    >
                      {formData.mainImageUrl === imageUrl ? (
                        <StarIconSolid className="w-4 h-4" />
                      ) : (
                        <StarIcon className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Buton pentru ștergere */}
                    <button
                      type="button"
                      onClick={() => removeImage(imageUrl)}
                      className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                      title="Șterge imaginea"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleImageUpload}
              className="hidden"
              id="imageUpload"
              multiple
            />
            <label
              htmlFor="imageUpload"
              className={`flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2.5 xs:py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <PhotoIcon className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 flex-shrink-0" />
              <span className="text-xs xs:text-sm text-gray-600">
                {uploading ? 'Se încarcă...' : 'Încarcă imagini de pe dispozitiv'}
              </span>
            </label>
            <p className="mt-1 text-[10px] xs:text-xs text-gray-500">
              JPG, PNG, WebP, GIF sau AVIF. Max 5MB. Poți selecta mai multe imagini simultan.
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 xs:gap-3">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="w-4 h-4 xs:w-5 xs:h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 flex-shrink-0"
            />
            <span className="text-xs xs:text-sm font-medium text-gray-700">Curs activ (vizibil pe site)</span>
          </label>
        </div>
      </div>

      <div className="flex flex-col xs:flex-row gap-2 xs:gap-4 pt-3 xs:pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full xs:w-auto px-4 xs:px-6 py-2 text-sm xs:text-base border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 order-2 xs:order-1"
        >
          Anulează
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full xs:w-auto px-4 xs:px-6 py-2 text-sm xs:text-base bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 order-1 xs:order-2"
        >
          {loading ? 'Se salvează...' : (course ? 'Actualizează' : 'Creează curs')}
        </button>
      </div>
    </form>
  )
}
