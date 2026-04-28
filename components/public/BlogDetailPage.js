'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const LEVEL_COLORS = {
  'începător': '#22c55e',
  'intermediar': '#f97316',
  'avansat': '#a78bfa',
}

function FaqAccordion({ items }) {
  const [open, setOpen] = useState(null)
  if (!items?.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', margin: '1.25rem 0 1.5rem' }}>
      {items.map((q, i) => {
        const isOpen = open === i
        return (
          <div key={i} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '0.875rem', overflow: 'hidden' }}>
            <button onClick={() => setOpen(isOpen ? null : i)}
              style={{ width: '100%', padding: '0.875rem 1rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-heading)' }}>{q.question}</span>
              <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', backgroundColor: isOpen ? 'var(--color-primary)' : 'var(--bg-section-alt)', color: isOpen ? '#fff' : 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={isOpen ? 'M5 12h14' : 'M12 5v14M5 12h14'}/></svg>
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: '0 1rem 1rem', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{q.answer}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Block({ block }) {
  if (!block) return null
  switch (block.type) {
    case 'heading':
      return <h2>{block.text}</h2>
    case 'text':
      return (block.text || '').split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)
    case 'image':
      return (
        <figure style={{ margin: '1.5rem 0' }}>
          {block.url && <img src={block.url} alt={block.alt || ''} style={{ width: '100%', borderRadius: '0.875rem', border: '1px solid var(--border-light)' }} loading="lazy" />}
          {block.caption && <figcaption style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem', fontStyle: 'italic' }}>{block.caption}</figcaption>}
        </figure>
      )
    case 'youtube':
      if (!block.videoId) return null
      return (
        <figure style={{ margin: '1.5rem 0' }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <iframe src={`https://www.youtube.com/embed/${block.videoId}`} title={block.caption || 'YouTube video'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
          </div>
          {block.caption && <figcaption style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem', fontStyle: 'italic' }}>{block.caption}</figcaption>}
        </figure>
      )
    case 'faq':
      return <FaqAccordion items={block.items} />
    case 'quote':
      return (
        <blockquote>
          {block.text}
          {block.author && <footer style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>— {block.author}</footer>}
        </blockquote>
      )
    default:
      return null
  }
}

export default function BlogDetailPage({ blog, recommendedCourses = [], recommendedBlogs = [] }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const c = () => setIsMobile(window.innerWidth <= 768)
    c(); window.addEventListener('resize', c)
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => window.removeEventListener('resize', c)
  }, [])

  if (!blog) return null
  const blocks = Array.isArray(blog.content) ? blog.content : []

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      {/* HERO */}
      <article>
        <header style={{ paddingTop: '5rem' }}>
          <div style={{ maxWidth: 820, margin: '0 auto', padding: isMobile ? '1.25rem 1rem 0' : '2rem 1.5rem 0' }}>
            <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none', marginBottom: '1.25rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6"/></svg>
              Toate articolele
            </Link>
            {blog.category && (
              <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)', backgroundColor: 'var(--color-accent-light)', padding: '0.3rem 0.75rem', borderRadius: 9999, marginBottom: '0.75rem' }}>{blog.category}</span>
            )}
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', color: 'var(--text-heading)', lineHeight: 1.2, marginBottom: '0.875rem' }}>{blog.title}</h1>
            {blog.excerpt && <p style={{ fontSize: isMobile ? '1rem' : '1.125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>{blog.excerpt}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              {blog.authorName && <span>De <strong style={{ color: 'var(--text-heading)' }}>{blog.authorName}</strong></span>}
              <span>{new Date(blog.publishedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {blog.readMinutes && <span>· {blog.readMinutes} min citire</span>}
            </div>
          </div>

          {blog.coverImage && (
            <div style={{ maxWidth: 980, margin: '1.5rem auto 0', padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
              <div style={{ aspectRatio: '16/9', borderRadius: isMobile ? '1rem' : '1.5rem', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)' }}>
                <img src={blog.coverImage} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          )}
        </header>

        {/* BODY */}
        <div className="blog-content" style={{ maxWidth: 720, margin: '2.5rem auto 0', padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
          {blocks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Acest articol nu are conținut încă.</p>
          ) : blocks.map((b, i) => <Block key={i} block={b} />)}
        </div>

        {/* TAGS */}
        {Array.isArray(blog.tags) && blog.tags.length > 0 && (
          <div style={{ maxWidth: 720, margin: '2rem auto 0', padding: isMobile ? '0 1rem' : '0 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {blog.tags.map(t => (
              <span key={t} style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-primary)', backgroundColor: 'var(--color-accent-light)', padding: '0.3rem 0.75rem', borderRadius: '0.5rem' }}>#{t}</span>
            ))}
          </div>
        )}
      </article>

      {/* CTA — Programează lecție gratuită */}
      <section style={{ maxWidth: 980, margin: '3rem auto 0', padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: isMobile ? '1.25rem' : '1.75rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 60%, #7c3aed 100%)', padding: isMobile ? '2rem 1.25rem' : '3rem 2.5rem', color: '#fff', boxShadow: '0 20px 50px rgba(30,58,138,0.25)' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.18)', filter: 'blur(40px)' }} />
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: isMobile ? '1.25rem' : '2rem', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>100% gratuit · fără obligații</p>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: isMobile ? '1.4rem' : '1.875rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>Programează o lecție gratuită</h3>
              <p style={{ fontSize: isMobile ? '0.92rem' : '1.025rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                Vezi cum lucrăm, ce instrumente folosim și cum se potrivesc cursurile noastre cu interesele copilului tău.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.45rem' }}>
                {['Profesor dedicat', 'Conținut adaptat vârstei', 'Materiale incluse', 'Online sau la sediu'].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.92)' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.25)', color: '#86efac', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconCheck /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/inscriere" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: 'var(--color-accent)', color: '#0f172a', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', padding: '1rem 1.75rem', borderRadius: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(245,158,11,0.4)' }}>
              Programează acum <IconArrow />
            </Link>
          </div>
        </div>
      </section>

      {/* RECOMMENDED BLOGS */}
      {recommendedBlogs.length > 0 && (
        <section style={{ maxWidth: 1140, margin: '4rem auto 0', padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(1.25rem, 2vw, 1.625rem)', color: 'var(--text-heading)', marginBottom: '1.25rem' }}>Articole recomandate</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {recommendedBlogs.map(b => (
              <Link key={b.id} href={`/blog/${b.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <article style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.125rem', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ aspectRatio: '16/9', backgroundColor: 'var(--bg-section-alt)', overflow: 'hidden' }}>
                    {b.coverImage ? <img src={b.coverImage} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--color-accent-light), var(--bg-section-alt))' }} />}
                  </div>
                  <div style={{ padding: '0.875rem 1rem 1rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-heading)', marginBottom: '0.4rem', lineHeight: 1.3 }}>{b.title}</h3>
                    {b.excerpt && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.excerpt}</p>}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* RECOMMENDED COURSES */}
      {recommendedCourses.length > 0 && (
        <section style={{ maxWidth: 1140, margin: '3rem auto 0', padding: isMobile ? '0 1rem 4rem' : '0 1.5rem 6rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(1.25rem, 2vw, 1.625rem)', color: 'var(--text-heading)', marginBottom: '1.25rem' }}>Cursuri recomandate</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {recommendedCourses.map(c => {
              const cLevelColor = LEVEL_COLORS[c.level?.toLowerCase()] || '#3b82f6'
              const thumb = c.mainImageUrl || c.imageUrl || c.images?.[0]
              const cHasDiscount = c.discountPrice != null && c.discountPrice < c.price
              const cIsFree = c.price === 0 && !cHasDiscount
              return (
                <Link key={c.id} href={`/curs/${c.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <article style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.125rem', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                    <div style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: 'var(--bg-section-alt)', overflow: 'hidden' }}>
                      {thumb ? <img src={thumb} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                        : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${cLevelColor}22, var(--bg-section-alt))` }} />}
                      {c.level && (
                        <span style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#fff', backgroundColor: cLevelColor, padding: '0.2rem 0.55rem', borderRadius: 9999 }}>{c.level}</span>
                      )}
                    </div>
                    <div style={{ padding: '0.875rem 1rem 1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-heading)', marginBottom: '0.4rem', lineHeight: 1.3 }}>{c.title}</h3>
                      {c.descriptionShort && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.6rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.descriptionShort}</p>}
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.9rem', color: cIsFree ? '#16a34a' : 'var(--text-heading)' }}>
                          {cIsFree ? 'Gratuit' : cHasDiscount ? `${c.discountPrice} lei/lună` : `${c.price} lei/lună`}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>Detalii <IconArrow /></span>
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
