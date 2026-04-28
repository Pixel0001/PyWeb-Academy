'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconCheck = ({ color = '#22c55e', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconClock = ({ color = '#94a3b8', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IconUsers = ({ color = '#94a3b8', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconCalendar = ({ color = '#94a3b8', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const IconArrowLeft = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconArrowRight = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ── Main Component ────────────────────────────────────────────────────────────
export default function CourseDetailPage({ course }) {
  const [isMobile, setIsMobile] = useState(false)
  const [isXs, setIsXs] = useState(false)
  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth <= 768)
      setIsXs(window.innerWidth <= 380)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!course) return null

  const stat = (icon, label, value) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        {icon}
        {label}
      </div>
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-heading)' }}>{value}</span>
    </div>
  )

  return (
    <>
      <Navbar />
      <main>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden', backgroundColor: '#0f172a' }}>
          {/* Subtle blurred background using same image */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.18 }}>
            <Image src={course.image} alt="" fill style={{ objectFit: 'cover', objectPosition: 'center', filter: 'blur(40px) saturate(1.2)' }} aria-hidden sizes="100vw" />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.78) 60%, rgba(15,23,42,0.55) 100%)' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: isMobile ? '5.5rem 1.25rem 2.5rem' : '5rem 1.5rem 4rem', width: '100%', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 340px', gap: isMobile ? '1.5rem' : '3rem', alignItems: 'center' }}>
            <div>
            {/* Back */}
            <Link href="/#cursuri" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1.5rem', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = '#fff'}
              onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            >
              <IconArrowLeft size={16} /> Înapoi la cursuri
            </Link>

            {/* Level badge */}
            <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: course.levelColor, backgroundColor: 'rgba(255,255,255,0.12)', border: `1px solid ${course.levelColor}60`, padding: '0.3rem 0.875rem', borderRadius: 9999, marginBottom: '1rem' }}>
              {course.level}
            </span>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', lineHeight: 1.15 }}>
              {course.title}
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.75)', maxWidth: 540, lineHeight: 1.6, marginBottom: '2rem' }}>
              {course.subtitle}
            </p>

            <a href="#inscriere"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-accent)', color: '#0f172a', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', padding: '0.875rem 2rem', borderRadius: '0.75rem', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'none' }}
            >
              Înscrie-te acum →
            </a>
            </div>

            {/* RIGHT — Image card (same aspect as /#cursuri cards on both mobile and desktop) */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 340, height: isMobile ? 360 : 480, margin: isMobile ? '0 auto' : '0 0 0 auto', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 20px 56px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Image
                src={course.image}
                alt={course.title}
                fill
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                priority
                sizes="340px"
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,14,30,0.0) 60%, rgba(10,14,30,0.35) 100%)' }} />
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)', padding: isMobile ? '1rem 0.875rem' : '1.5rem 1.5rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: isXs ? '1fr 1fr' : isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: isMobile ? '0.75rem' : '0', alignItems: 'center' }}>
            {[{icon: <IconCalendar />, label: 'Durată', value: course.duration}, {icon: <IconUsers />, label: 'Vârstă', value: course.age}, {icon: <IconUsers />, label: 'Grup', value: course.groupSize}, {icon: <IconClock />, label: 'Frecvență', value: course.sessionsPerWeek}, {icon: <IconClock />, label: 'Ședință', value: course.sessionLength}].map((s, i) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: isMobile ? '0' : '0 1rem', borderRight: !isMobile && i < 4 ? '1px solid var(--border-light)' : 'none', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: isXs ? '0.68rem' : '0.72rem' }}>{s.icon}{s.label}</div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: isXs ? '0.82rem' : isMobile ? '0.9rem' : '1rem', color: 'var(--text-heading)', textAlign: 'center', wordBreak: 'break-word' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── BODY ─────────────────────────────────────────────────────────── */}
        <section style={{ padding: isXs ? '1.5rem 0.875rem' : isMobile ? '2rem 1rem' : '5rem 1.5rem', backgroundColor: 'var(--bg-page)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 340px', gap: isMobile ? '1.25rem' : '3rem', alignItems: 'start' }}>

            {/* LEFT — Description + Curriculum */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '2rem' : '3rem' }}>

              {/* About */}
              <div>
                <p className="section-label" style={{ marginBottom: '0.5rem' }}>Despre curs</p>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
                  Ce vei învăța?
                </h2>
                <p style={{ fontSize: isMobile ? '0.92rem' : '1rem', lineHeight: 1.7, color: 'var(--text-body)' }}>{course.longDesc}</p>
              </div>

              {/* Curriculum */}
              <div>
                <p className="section-label" style={{ marginBottom: '0.5rem' }}>Planul de studiu</p>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1.5rem' }}>
                  Curriculum
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {course.curriculum.map((module, i) => (
                    <div key={i} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '1rem', overflow: 'hidden' }}>
                      <div style={{ padding: isMobile ? '0.75rem 0.875rem' : '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: isMobile ? '0.625rem' : '1rem', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-section-alt)' }}>
                        <span style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: course.levelColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{module.week}</div>
                          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-heading)', fontSize: isMobile ? '0.9rem' : '0.975rem', wordBreak: 'break-word' }}>{module.title}</div>
                        </div>
                      </div>
                      <ul style={{ padding: isMobile ? '0.75rem 0.875rem' : '1rem 1.25rem', margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {module.items.map((item, j) => (
                          <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: isMobile ? '0.82rem' : '0.875rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                            <span style={{ marginTop: 3, flexShrink: 0 }}><IconCheck color={course.levelColor} size={14} /></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* For who */}
              <div style={{ backgroundColor: course.levelBg, border: `1px solid ${course.levelColor}30`, borderRadius: '1rem', padding: isMobile ? '1rem' : '1.5rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: course.levelColor, marginBottom: '0.5rem' }}>Pentru cine e cursul?</p>
                <p style={{ fontSize: isMobile ? '0.88rem' : '0.95rem', lineHeight: 1.65, color: 'var(--text-body)' }}>{course.forWho}</p>
              </div>
            </div>

            {/* RIGHT — Sticky card */}
            <div style={{ position: isMobile ? 'static' : 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Price card */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '1.25rem', padding: isMobile ? '1.25rem' : '1.75rem', boxShadow: 'var(--shadow-float)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Prețul cursului</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: isMobile ? '1.6rem' : '2rem', fontWeight: 800, color: 'var(--text-heading)', wordBreak: 'break-word' }}>{course.price}</div>
                </div>

                {/* Benefits */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {course.benefits.map((b, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: isMobile ? '0.83rem' : '0.875rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                      <span style={{ marginTop: 2, flexShrink: 0 }}><IconCheck color={course.levelColor} size={15} /></span>
                      {b}
                    </li>
                  ))}
                </ul>

                <a id="inscriere" href="/inscriere"
                  style={{ display: 'block', textAlign: 'center', backgroundColor: 'var(--color-accent)', color: '#0f172a', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', padding: '0.85rem 1rem', borderRadius: '0.75rem', textDecoration: 'none', transition: 'all 0.2s', marginBottom: '0.625rem' }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'none' }}
                >
                  Înscrie-te acum
                </a>
                <a href="tel:+37368113314"
                  style={{ display: 'block', textAlign: 'center', backgroundColor: 'transparent', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.88rem', padding: '0.7rem 1rem', borderRadius: '0.75rem', textDecoration: 'none', border: '1.5px solid var(--border-light)', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-primary-light)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                >
                  📞 068 113 314
                </a>
              </div>

              {/* Topics tags */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '1.25rem', padding: isMobile ? '1rem' : '1.25rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Teme principale</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {course.topics.map((t) => (
                    <span key={t} style={{ fontSize: '0.75rem', fontWeight: 500, color: course.levelColor, backgroundColor: course.levelBg, border: `1px solid ${course.levelColor}30`, borderRadius: '0.5rem', padding: '0.25rem 0.625rem' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── OTHER COURSES ─────────────────────────────────────────────────── */}
        <section style={{ padding: '4rem 1.5rem', backgroundColor: 'var(--bg-section-alt)', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <p className="section-label" style={{ marginBottom: '0.5rem' }}>Explorează mai mult</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '2rem' }}>
              Alte cursuri PyWeb Academy
            </h2>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { slug: 'python-fundamentals', title: 'Python Fundamentals', color: '#22c55e', bg: '#f0fdf4' },
                { slug: 'web-development', title: 'Web Development', color: '#3b82f6', bg: '#eff6ff' },
                { slug: 'ai-machine-learning', title: 'AI & Machine Learning', color: '#8b5cf6', bg: '#f5f3ff' },
              ].filter(c => c.slug !== course.slug).map(c => (
                <Link key={c.slug} href={`/curs/${c.slug}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: c.bg, color: c.color, border: `1px solid ${c.color}30`, fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'none'}
                >
                  {c.title} <IconArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
