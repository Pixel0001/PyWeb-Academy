'use client'

import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'

const LEVEL_COLORS = {
  'începător': '#22c55e',
  'intermediar': '#f97316',
  'avansat': '#a78bfa',
}

const IconClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconBook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconGraduate = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)
const IconExpand = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
  </svg>
)
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)

function Chip({ icon, text }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', backgroundColor: 'var(--bg-section-alt)', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)' }}>
      {icon} {text}
    </div>
  )
}

export default function CourseDetailClient({ course, allCourses = [] }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }, [])

  const images = course?.images?.length > 0
    ? course.images
    : (course?.mainImageUrl || course?.imageUrl ? [course.mainImageUrl || course.imageUrl] : [])

  const nextImage = useCallback(() => { setCurrentImageIndex(p => (p + 1) % images.length) }, [images.length])
  const prevImage = useCallback(() => { setCurrentImageIndex(p => (p - 1 + images.length) % images.length) }, [images.length])

  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1 || isLightboxOpen) return
    const t = setInterval(nextImage, 4000)
    return () => clearInterval(t)
  }, [isAutoPlaying, images.length, isLightboxOpen, nextImage])

  useEffect(() => {
    const handler = (e) => {
      if (!isLightboxOpen) return
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'Escape') setIsLightboxOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isLightboxOpen, nextImage, prevImage])

  const levelKey = course?.level?.toLowerCase()
  const levelColor = LEVEL_COLORS[levelKey] || '#3b82f6'
  const ageText = course?.ageMin ? `${course.ageMin}${course.ageMax ? `–${course.ageMax}` : '+'} ani` : null
  const hasDiscount = course?.discountPrice != null && course.discountPrice < course?.price
  const discountPct = hasDiscount ? Math.round((1 - course.discountPrice / course.price) * 100) : 0
  const isFree = course?.price === 0 && !hasDiscount

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>

      {/* ── BREADCRUMB ── */}
      <div style={{ paddingTop: '5rem' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '1.25rem 1.5rem 0' }}>
          <a href="/#cursuri"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6"/></svg>
            Toate cursurile
          </a>
        </div>
      </div>

      {/* ── GRID PRINCIPAL ── */}
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* ══ STÂNGA: CARD CU CARUSEL ══ */}
          <div style={{ position: 'sticky', top: '5.5rem' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.75rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>

              <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', backgroundColor: 'var(--bg-section-alt)' }}>
                {images.length > 0 ? (
                  <>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ position: 'absolute', inset: 0, transition: 'opacity 0.55s ease', opacity: currentImageIndex === idx ? 1 : 0 }}>
                        <img src={img} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading={idx === 0 ? 'eager' : 'lazy'} />
                      </div>
                    ))}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)', pointerEvents: 'none' }} />
                    {course.level && (
                      <span style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 5, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', backgroundColor: levelColor, padding: '0.3rem 0.75rem', borderRadius: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>{course.level}</span>
                    )}
                    <button onClick={() => setIsLightboxOpen(true)} style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 5, width: 36, height: 36, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      <IconExpand />
                    </button>
                    {images.length > 1 && (
                      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 5, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: 9999 }}>
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                    {images.length > 1 && (
                      <>
                        <button onClick={() => { setIsAutoPlaying(false); prevImage() }} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 38, height: 38, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.88)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: '1.25rem' }}>‹</button>
                        <button onClick={() => { setIsAutoPlaying(false); nextImage() }} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 5, width: 38, height: 38, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.88)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: '1.25rem' }}>›</button>
                      </>
                    )}
                  </>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--bg-section-alt) 0%, var(--border-light) 100%)' }}>
                    <svg width="56" height="56" fill="none" stroke="var(--border-light)" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div style={{ padding: '0.75rem 0.875rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'var(--border-light) transparent' }}>
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => { setCurrentImageIndex(idx); setIsAutoPlaying(false) }}
                      style={{ flexShrink: 0, width: 58, height: 58, borderRadius: '0.625rem', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${currentImageIndex === idx ? 'var(--color-primary)' : 'var(--border-light)'}`, opacity: currentImageIndex === idx ? 1 : 0.55, transition: 'all 0.2s', padding: 0, background: 'none' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

              <div style={{ padding: '0.875rem 1.125rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {ageText && <Chip icon={<IconUsers />} text={ageText} />}
                {course.duration && <Chip icon={<IconClock />} text={course.duration} />}
                {course.lessonsCount > 0 && <Chip icon={<IconBook />} text={`${course.lessonsCount} lecții`} />}
                {course.seatsTotal > 0 && <Chip icon={<IconGraduate />} text={`max ${course.seatsTotal} elevi`} />}
              </div>
            </div>
          </div>

          {/* ══ DREAPTA: TITLU + PREȚ + DESCRIERE ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div>
              {course.category && (
                <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary)', backgroundColor: 'var(--color-accent-light)', padding: '0.25rem 0.75rem', borderRadius: 9999, marginBottom: '0.75rem' }}>{course.category}</span>
              )}
              <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(1.6rem, 2.5vw, 2.25rem)', color: 'var(--text-heading)', lineHeight: 1.15, marginBottom: '0.875rem' }}>{course.title}</h1>
              {course.descriptionShort && (
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-body)', lineHeight: 1.75 }}>{course.descriptionShort}</p>
              )}
            </div>

            {/* Card preț + CTA */}
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border-light)', boxShadow: '0 4px 24px rgba(30,58,138,0.09)', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Preț lunar</p>
                  {isFree ? (
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: '#16a34a' }}>Gratuit</span>
                  ) : hasDiscount ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{course.price} lei</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', backgroundColor: '#dc2626', padding: '0.15rem 0.45rem', borderRadius: '0.35rem' }}>-{discountPct}%</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>{course.discountPrice}</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>lei/lună</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>{course.price}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>lei/lună</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 170 }}>
                  <a href="/#contact" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.8rem 1.25rem', backgroundColor: 'var(--color-accent)', color: '#0f172a', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9375rem', borderRadius: '0.875rem', textDecoration: 'none', boxShadow: '0 4px 18px rgba(245,158,11,0.3)', whiteSpace: 'nowrap' }}>
                    Înscrie-te acum <IconArrow />
                  </a>
                  <a href="/#contact" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.65rem', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem', borderRadius: '0.875rem', textDecoration: 'none', border: '1.5px solid var(--border-light)', textAlign: 'center' }}>
                    Lecție gratuită
                  </a>
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {['Prima lecție gratuită', 'Certificat de absolvire', 'Grupe mici, max 10 elevi', 'Materiale incluse'].map(text => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-body)' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#16a34a' }}><IconCheck /></span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {course.descriptionLong && (
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 30, height: 30, borderRadius: '0.5rem', backgroundColor: 'var(--color-accent-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontSize: '0.9rem' }}>ℹ</span>
                  Despre acest curs
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{course.descriptionLong}</p>
              </div>
            )}

            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', padding: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 30, height: 30, borderRadius: '0.5rem', backgroundColor: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}><IconCheck /></span>
                Ce primești
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                {['Prima lecție gratuită', 'Suport personalizat', 'Certificat de absolvire', 'Grupe mici (max 10)', 'Proiecte practice reale', 'Acces la toate materialele'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-body)' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#16a34a' }}><IconCheck /></span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ALTE CURSURI RECOMANDATE ── */}
      {allCourses.length > 0 && (
        <div style={{ maxWidth: 1140, margin: '3.5rem auto 0', padding: '0 1.5rem 5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(1.25rem, 2vw, 1.75rem)', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>Alte cursuri recomandate</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Descoperă mai multe cursuri de programare pentru copii</p>
            </div>
            <a href="/#cursuri" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
              Vezi toate <IconArrow />
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {allCourses.slice(0, 4).map(c => {
              const cLevelColor = LEVEL_COLORS[c.level?.toLowerCase()] || '#3b82f6'
              const cHasDiscount = c.discountPrice != null && c.discountPrice < c.price
              const cIsFree = c.price === 0 && !cHasDiscount
              const thumb = c.mainImageUrl || c.imageUrl || c.images?.[0]
              return (
                <a key={c.id} href={`/curs/${c.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div
                    style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.25rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,58,138,0.12)' }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}>
                    <div style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: 'var(--bg-section-alt)', overflow: 'hidden' }}>
                      {thumb ? (
                        <img src={thumb} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cLevelColor}22 0%, var(--bg-section-alt) 100%)` }} />
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 60%)', pointerEvents: 'none' }} />
                      {c.level && (
                        <span style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#fff', backgroundColor: cLevelColor, padding: '0.2rem 0.6rem', borderRadius: 9999 }}>{c.level}</span>
                      )}
                    </div>
                    <div style={{ padding: '1rem 1.125rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-heading)', marginBottom: '0.375rem', lineHeight: 1.3 }}>{c.title}</h3>
                      {c.descriptionShort && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.descriptionShort}</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.9375rem', color: cIsFree ? '#16a34a' : 'var(--text-heading)' }}>
                          {cIsFree ? 'Gratuit' : cHasDiscount ? `${c.discountPrice} lei/lună` : `${c.price} lei/lună`}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Detalii <IconArrow />
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {isLightboxOpen && images.length > 0 && (
        <div onClick={() => setIsLightboxOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setIsLightboxOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', width: 44, height: 44, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>×</button>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '90vw', height: '80vh', maxWidth: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={images[currentImageIndex]} alt={course.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '0.5rem' }} />
          </div>
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prevImage() }} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>‹</button>
              <button onClick={e => { e.stopPropagation(); nextImage() }} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>›</button>
              <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', padding: '0.375rem 0.875rem', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 9999, color: '#fff', fontSize: '0.875rem' }}>
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  )
}
