'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function BlogListPage({ blogs }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const c = () => setIsMobile(window.innerWidth <= 768)
    c(); window.addEventListener('resize', c)
    return () => window.removeEventListener('resize', c)
  }, [])

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      {/* HERO */}
      <section style={{ position: 'relative', backgroundColor: '#0f172a', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.25), transparent 60%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: isMobile ? '6rem 1rem 2.5rem' : '7rem 1.5rem 4rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-accent)', marginBottom: '0.5rem' }}>PyWeb Blog</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '0.875rem' }}>
            Articole, sfaturi & resurse
          </h1>
          <p style={{ fontSize: isMobile ? '0.95rem' : '1.125rem', color: 'rgba(255,255,255,0.78)', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
            Tot ce trebuie să știi despre programare pentru copii, web development, AI și parcursul de învățare al copilului tău.
          </p>
        </div>
      </section>

      {/* GRID */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: isMobile ? '2.5rem 1rem 4rem' : '4rem 1.5rem 6rem' }}>
        {blogs.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1rem', padding: '4rem 0' }}>În curând adăugăm articole. Revino mai târziu!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? '1.25rem' : '1.75rem' }}>
            {blogs.map(b => (
              <Link key={b.id} href={`/blog/${b.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <article style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.25rem', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(30,58,138,0.14)' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: 'var(--bg-section-alt)', overflow: 'hidden' }}>
                    {b.coverImage ? (
                      <img src={b.coverImage} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--color-accent-light) 0%, var(--bg-section-alt) 100%)' }} />
                    )}
                    {b.category && (
                      <span style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', backgroundColor: 'rgba(15,23,42,0.78)', backdropFilter: 'blur(6px)', padding: '0.3rem 0.7rem', borderRadius: 9999 }}>{b.category}</span>
                    )}
                  </div>
                  <div style={{ padding: '1.125rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-heading)', lineHeight: 1.3, marginBottom: '0.5rem' }}>{b.title}</h2>
                    {b.excerpt && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.875rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.excerpt}</p>
                    )}
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{new Date(b.publishedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {b.readMinutes && <span>{b.readMinutes} min citire</span>}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
