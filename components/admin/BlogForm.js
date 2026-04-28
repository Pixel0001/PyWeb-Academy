'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { PhotoIcon, XMarkIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

const BLOCK_TYPES = [
  { value: 'heading', label: 'Titlu (H2)' },
  { value: 'text', label: 'Paragraf' },
  { value: 'image', label: 'Imagine' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'faq', label: 'FAQ' },
  { value: 'quote', label: 'Citat' }
]

function newBlock(type) {
  switch (type) {
    case 'heading': return { type, level: 2, text: '' }
    case 'text':    return { type, text: '' }
    case 'image':   return { type, url: '', alt: '', caption: '' }
    case 'youtube': return { type, videoId: '', caption: '' }
    case 'faq':     return { type, items: [{ question: '', answer: '' }] }
    case 'quote':   return { type, text: '', author: '' }
    default:        return { type, text: '' }
  }
}

function extractYouTubeId(url) {
  if (!url) return ''
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  return m ? m[1] : url.length === 11 ? url : ''
}

export default function BlogForm({ blog, allCourses = [], allBlogs = [] }) {
  const router = useRouter()
  const coverInputRef = useRef(null)
  const blockImageInputRefs = useRef({})
  const [loading, setLoading] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingBlock, setUploadingBlock] = useState(null)

  const [form, setForm] = useState({
    title: blog?.title || '',
    slug: blog?.slug || '',
    excerpt: blog?.excerpt || '',
    coverImage: blog?.coverImage || '',
    content: Array.isArray(blog?.content) ? blog.content : [],
    category: blog?.category || '',
    tags: Array.isArray(blog?.tags) ? blog.tags.join(', ') : '',
    recommendedCourseIds: Array.isArray(blog?.recommendedCourseIds) ? blog.recommendedCourseIds : [],
    recommendedBlogSlugs: Array.isArray(blog?.recommendedBlogSlugs) ? blog.recommendedBlogSlugs : [],
    published: blog?.published ?? true,
    publishedAt: blog?.publishedAt ? new Date(blog.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    seoTitle: blog?.seoTitle || '',
    seoDescription: blog?.seoDescription || '',
    readMinutes: blog?.readMinutes || '',
    authorName: blog?.authorName || ''
  })

  const handleField = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const generateSlug = () => {
    const slug = form.title.toLowerCase()
      .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i').replace(/ș/g, 's').replace(/ț/g, 't')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setForm(prev => ({ ...prev, slug }))
  }

  // ── Cover upload ──
  const uploadFile = async (file, folder = 'blogs') => {
    const data = new FormData()
    data.append('file', file)
    data.append('folder', folder)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: data })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Upload eșuat')
    }
    const j = await res.json()
    return j.url
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const url = await uploadFile(file)
      setForm(prev => ({ ...prev, coverImage: url }))
      toast.success('Imagine cover încărcată')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  // ── Blocks ──
  const addBlock = (type) => {
    setForm(prev => ({ ...prev, content: [...prev.content, newBlock(type)] }))
  }
  const updateBlock = (idx, patch) => {
    setForm(prev => ({ ...prev, content: prev.content.map((b, i) => i === idx ? { ...b, ...patch } : b) }))
  }
  const removeBlock = (idx) => {
    setForm(prev => ({ ...prev, content: prev.content.filter((_, i) => i !== idx) }))
  }
  const moveBlock = (idx, dir) => {
    setForm(prev => {
      const arr = [...prev.content]
      const j = idx + dir
      if (j < 0 || j >= arr.length) return prev
      const tmp = arr[idx]; arr[idx] = arr[j]; arr[j] = tmp
      return { ...prev, content: arr }
    })
  }

  const handleBlockImageUpload = async (idx, file) => {
    if (!file) return
    setUploadingBlock(idx)
    try {
      const url = await uploadFile(file)
      updateBlock(idx, { url })
      toast.success('Imagine adăugată')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploadingBlock(null)
    }
  }

  // ── FAQ inside a block ──
  const addFaqItem = (blockIdx) => {
    const b = form.content[blockIdx]
    updateBlock(blockIdx, { items: [...(b.items || []), { question: '', answer: '' }] })
  }
  const updateFaqItem = (blockIdx, itemIdx, field, value) => {
    const b = form.content[blockIdx]
    updateBlock(blockIdx, { items: b.items.map((it, i) => i === itemIdx ? { ...it, [field]: value } : it) })
  }
  const removeFaqItem = (blockIdx, itemIdx) => {
    const b = form.content[blockIdx]
    updateBlock(blockIdx, { items: b.items.filter((_, i) => i !== itemIdx) })
  }

  // ── Recommended ──
  const toggleCourse = (id) => {
    setForm(prev => ({
      ...prev,
      recommendedCourseIds: prev.recommendedCourseIds.includes(id)
        ? prev.recommendedCourseIds.filter(x => x !== id)
        : [...prev.recommendedCourseIds, id]
    }))
  }
  const toggleBlog = (slug) => {
    setForm(prev => ({
      ...prev,
      recommendedBlogSlugs: prev.recommendedBlogSlugs.includes(slug)
        ? prev.recommendedBlogSlugs.filter(x => x !== slug)
        : [...prev.recommendedBlogSlugs, slug]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.slug) {
      toast.error('Titlu și slug sunt obligatorii')
      return
    }
    setLoading(true)
    try {
      const url = blog ? `/api/admin/blogs/${blog.id}` : '/api/admin/blogs'
      const method = blog ? 'PUT' : 'POST'
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        readMinutes: form.readMinutes ? parseInt(form.readMinutes) : null,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : new Date().toISOString()
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast.success(blog ? 'Blog actualizat' : 'Blog creat')
        router.push('/admin/blogs')
        router.refresh()
      } else {
        const j = await res.json().catch(() => ({}))
        toast.error(j.error || 'A apărut o eroare')
      }
    } catch (err) {
      toast.error('A apărut o eroare')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 xs:space-y-6">
      {/* === Date principale === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Titlu *</label>
          <input type="text" name="title" value={form.title} onChange={handleField}
            onBlur={() => !blog && !form.slug && generateSlug()} required
            className="w-full px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" />
        </div>
        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <div className="flex gap-2">
            <input type="text" name="slug" value={form.slug} onChange={handleField} required
              className="flex-1 px-3 xs:px-4 py-2 text-sm xs:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" />
            <button type="button" onClick={generateSlug}
              className="px-2.5 xs:px-3 py-2 text-xs xs:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap">Generează</button>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Excerpt (rezumat scurt)</label>
          <textarea name="excerpt" value={form.excerpt} onChange={handleField} rows={2}
            placeholder="Frază scurtă pentru listing/SEO"
            className="w-full px-3 xs:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Categorie</label>
          <input type="text" name="category" value={form.category} onChange={handleField} placeholder="ex: Programare, Sfaturi"
            className="w-full px-3 xs:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
        </div>
        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Tags (separați prin virgulă)</label>
          <input type="text" name="tags" value={form.tags} onChange={handleField} placeholder="python, copii, online"
            className="w-full px-3 xs:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Autor</label>
          <input type="text" name="authorName" value={form.authorName} onChange={handleField} placeholder="ex: Echipa PyWeb"
            className="w-full px-3 xs:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
        </div>
        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Timp de citire (min)</label>
          <input type="number" name="readMinutes" value={form.readMinutes} onChange={handleField} min={1} placeholder="5"
            className="w-full px-3 xs:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
        </div>

        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1">Data publicării</label>
          <input type="datetime-local" name="publishedAt" value={form.publishedAt} onChange={handleField}
            className="w-full px-3 xs:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900" />
        </div>
        <div className="flex items-center pt-5 xs:pt-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="published" checked={form.published} onChange={handleField}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <span className="text-xs xs:text-sm font-medium text-gray-700">Publicat (vizibil pe site)</span>
          </label>
        </div>
      </div>

      {/* === Cover image === */}
      <div className="border-t pt-4 xs:pt-6">
        <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-2">Imagine cover</label>
        {form.coverImage ? (
          <div className="relative inline-block">
            <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-gray-200">
              <Image src={form.coverImage} alt="Cover" fill className="object-cover" />
            </div>
            <button type="button" onClick={() => setForm(p => ({ ...p, coverImage: '' }))}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" id="coverUpload" />
            <label htmlFor="coverUpload"
              className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 ${uploadingCover ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <PhotoIcon className="w-5 h-5 text-gray-400" />
              <span className="text-xs xs:text-sm text-gray-600">{uploadingCover ? 'Se încarcă...' : 'Încarcă imagine cover'}</span>
            </label>
          </>
        )}
      </div>

      {/* === Blocks === */}
      <div className="border-t pt-4 xs:pt-6">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-sm xs:text-base font-semibold text-gray-900">Conținut</h3>
            <p className="text-[11px] xs:text-xs text-gray-500">Construiește articolul folosind blocuri</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BLOCK_TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => addBlock(t.value)}
                className="px-2.5 py-1.5 text-[11px] xs:text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium">
                + {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {form.content.length === 0 && (
            <p className="text-xs text-gray-400 italic">Adaugă primul bloc folosind butoanele de mai sus.</p>
          )}
          {form.content.map((block, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-3 xs:p-4 bg-gray-50">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  #{idx + 1} · {BLOCK_TYPES.find(b => b.value === block.type)?.label || block.type}
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveBlock(idx, -1)} disabled={idx === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30">
                    <ArrowUpIcon className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveBlock(idx, 1)} disabled={idx === form.content.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30">
                    <ArrowDownIcon className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => removeBlock(idx)}
                    className="p-1 text-red-600 hover:text-red-700">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {block.type === 'heading' && (
                <input type="text" placeholder="Titlu secțiune" value={block.text || ''} onChange={(e) => updateBlock(idx, { text: e.target.value })}
                  className="w-full px-3 py-2 text-base font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
              )}

              {block.type === 'text' && (
                <textarea placeholder="Paragraf (poți folosi rânduri noi)..." value={block.text || ''} onChange={(e) => updateBlock(idx, { text: e.target.value })} rows={5}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
              )}

              {block.type === 'image' && (
                <div className="space-y-2">
                  {block.url ? (
                    <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-gray-200">
                      <Image src={block.url} alt={block.alt || ''} fill className="object-cover" />
                      <button type="button" onClick={() => updateBlock(idx, { url: '' })}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600">
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input ref={el => blockImageInputRefs.current[idx] = el} type="file" accept="image/*"
                        onChange={(e) => handleBlockImageUpload(idx, e.target.files?.[0])} className="hidden" id={`blockImg-${idx}`} />
                      <label htmlFor={`blockImg-${idx}`}
                        className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-white ${uploadingBlock === idx ? 'opacity-50' : ''}`}>
                        <PhotoIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-xs text-gray-600">{uploadingBlock === idx ? 'Se încarcă...' : 'Încarcă imagine'}</span>
                      </label>
                      <input type="text" placeholder="sau lipește URL imagine" value={block.url || ''} onChange={(e) => updateBlock(idx, { url: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
                    </>
                  )}
                  <input type="text" placeholder="Alt text (descriere imagine)" value={block.alt || ''} onChange={(e) => updateBlock(idx, { alt: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
                  <input type="text" placeholder="Descriere sub imagine (opțional)" value={block.caption || ''} onChange={(e) => updateBlock(idx, { caption: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
                </div>
              )}

              {block.type === 'youtube' && (
                <div className="space-y-2">
                  <input type="text" placeholder="URL YouTube sau ID video"
                    value={block.videoId || ''}
                    onChange={(e) => updateBlock(idx, { videoId: extractYouTubeId(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
                  {block.videoId && (
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 max-w-md">
                      <iframe src={`https://www.youtube.com/embed/${block.videoId}`} className="w-full h-full" allowFullScreen title="YouTube preview" />
                    </div>
                  )}
                  <input type="text" placeholder="Descriere sub video (opțional)" value={block.caption || ''} onChange={(e) => updateBlock(idx, { caption: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
                </div>
              )}

              {block.type === 'faq' && (
                <div className="space-y-2">
                  {(block.items || []).map((it, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-2.5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Întrebare {i + 1}</span>
                        <button type="button" onClick={() => removeFaqItem(idx, i)} className="text-red-600 hover:text-red-700 text-[11px]">Șterge</button>
                      </div>
                      <input type="text" placeholder="Întrebare" value={it.question || ''} onChange={(e) => updateFaqItem(idx, i, 'question', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm font-medium border border-gray-300 rounded mb-1.5 text-gray-900 placeholder-gray-400" />
                      <textarea placeholder="Răspuns" value={it.answer || ''} onChange={(e) => updateFaqItem(idx, i, 'answer', e.target.value)} rows={2}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400" />
                    </div>
                  ))}
                  <button type="button" onClick={() => addFaqItem(idx)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Adaugă întrebare</button>
                </div>
              )}

              {block.type === 'quote' && (
                <div className="space-y-2">
                  <textarea placeholder="Textul citatului" value={block.text || ''} onChange={(e) => updateBlock(idx, { text: e.target.value })} rows={2}
                    className="w-full px-3 py-2 text-sm italic border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
                  <input type="text" placeholder="Autor (opțional)" value={block.author || ''} onChange={(e) => updateBlock(idx, { author: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* === Recommended === */}
      <div className="border-t pt-4 xs:pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs xs:text-sm font-semibold text-gray-900 mb-2">Cursuri recomandate</label>
          <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg bg-white scrollbar-thin">
            {allCourses.length === 0 ? (
              <p className="p-3 text-xs text-gray-400 italic">Nu există cursuri</p>
            ) : allCourses.map(c => (
              <label key={c.id} className="flex items-center gap-2 p-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                <input type="checkbox" checked={form.recommendedCourseIds.includes(c.id)} onChange={() => toggleCourse(c.id)}
                  className="w-4 h-4 text-indigo-600 rounded" />
                <span className="text-gray-900 truncate">{c.title}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs xs:text-sm font-semibold text-gray-900 mb-2">Bloguri recomandate</label>
          <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg bg-white scrollbar-thin">
            {allBlogs.filter(b => !blog || b.id !== blog.id).length === 0 ? (
              <p className="p-3 text-xs text-gray-400 italic">Nu există alte bloguri</p>
            ) : allBlogs.filter(b => !blog || b.id !== blog.id).map(b => (
              <label key={b.id} className="flex items-center gap-2 p-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                <input type="checkbox" checked={form.recommendedBlogSlugs.includes(b.slug)} onChange={() => toggleBlog(b.slug)}
                  className="w-4 h-4 text-indigo-600 rounded" />
                <span className="text-gray-900 truncate">{b.title}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* === SEO === */}
      <div className="border-t pt-4 xs:pt-6">
        <h3 className="text-sm xs:text-base font-semibold text-gray-900 mb-2">SEO (opțional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 xs:gap-4">
          <input type="text" name="seoTitle" value={form.seoTitle} onChange={handleField} placeholder="SEO Title"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
          <input type="text" name="seoDescription" value={form.seoDescription} onChange={handleField} placeholder="SEO Description"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400" />
        </div>
      </div>

      {/* === Actions === */}
      <div className="flex flex-col xs:flex-row gap-2 xs:gap-4 pt-3 xs:pt-4 border-t">
        <button type="button" onClick={() => router.back()}
          className="w-full xs:w-auto px-4 xs:px-6 py-2 text-sm xs:text-base border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 order-2 xs:order-1">Anulează</button>
        <button type="submit" disabled={loading}
          className="w-full xs:w-auto px-4 xs:px-6 py-2 text-sm xs:text-base bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 order-1 xs:order-2">
          {loading ? 'Se salvează...' : (blog ? 'Actualizează' : 'Creează blog')}
        </button>
      </div>
    </form>
  )
}
