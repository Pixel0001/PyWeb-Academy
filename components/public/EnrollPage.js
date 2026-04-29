'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// ─── Icons ─────────────────────────────────────────────────────────────────
const IconCheck = ({ size = 18, color = '#10b981' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconRocket = ({ size = 20, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
)
const IconClock = ({ size = 18, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconParty = ({ size = 56, color = '#1d4ed8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.8 11.3 2 22l10.7-3.79" /><path d="M4 3h.01" /><path d="M22 8h.01" />
    <path d="M15 2h.01" /><path d="M22 20h.01" />
    <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0a2.9 2.9 0 0 1-3.44 2.79L4.87 6.63a2.9 2.9 0 0 1-2.28-4L4 2" />
    <path d="m11.33 8.56-.34-1.06a2.9 2.9 0 0 0-3.88-1.88v0a2.9 2.9 0 0 1-3.91-3.91l.75.75" />
  </svg>
)
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconShield = ({ size = 16, color = '#10b981' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const IconPhone = ({ size = 16, color = '#1e40af' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.58 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.82-.82a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.98 16.92z" />
  </svg>
)
const IconMail = ({ size = 16, color = '#1e40af' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const BENEFITS = [
  '60 de minute 1-la-1 cu un profesor',
  'Stabilim împreună cursul potrivit copilului',
  'Online sau la sediul nostru din Chișinău',
  'Fără card bancar, fără angajament',
  'Te contactăm în maxim 24 de ore',
]

export default function EnrollPage() {
  const [form, setForm] = useState({ name: '', phone: '' })
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: 'noreply@pyweb.md',
          phone: form.phone.trim(),
          message: `Cerere lecție gratuită de pe /inscriere. Telefon: ${form.phone.trim()}`,
        }),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error || 'A apărut o eroare. Încearcă din nou.')
        setStatus('idle')
      }
    } catch {
      setErrorMsg('Eroare de rețea. Verifică conexiunea și încearcă din nou.')
      setStatus('idle')
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 55%, #1e40af 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: isMobile ? '2rem 1rem' : '4rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Decorative glow */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: 360,
          height: 360,
          background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: 320,
          height: 320,
          background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Back link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(191,219,254,0.85)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            marginBottom: isMobile ? '1.5rem' : '2rem',
            fontFamily: 'var(--font-body)',
          }}
        >
          <IconArrow /> Înapoi la pagina principală
        </Link>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '2rem' : '3rem',
            alignItems: 'center',
          }}
        >
          {/* LEFT — Marketing */}
          <div style={{ color: '#fff' }}>
            <Image
              src="/PyWeb Academy logo.png"
              alt="PyWeb Academy"
              width={170}
              height={56}
              priority
              style={{
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                marginBottom: '1.5rem',
              }}
            />
            <p
              style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#f59e0b',
                marginBottom: '1rem',
                fontFamily: 'var(--font-body)',
              }}
            >
              ⚡ Lecție 100% gratuită
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: isMobile ? 'clamp(1.75rem, 7vw, 2.25rem)' : 'clamp(2rem, 4vw, 3rem)',
                lineHeight: 1.1,
                marginBottom: '1rem',
                color: '#fff',
              }}
            >
              Programează lecția <span style={{ color: '#f59e0b' }}>gratuită</span>
            </h1>
            <p
              style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                color: 'rgba(191,219,254,0.85)',
                lineHeight: 1.6,
                marginBottom: '1.75rem',
                fontFamily: 'var(--font-body)',
              }}
            >
              Lasă-ne numele și telefonul tău. Te contactăm în maxim 24h pentru a stabili
              împreună data și ora primei lecții, fără niciun cost.
            </p>

            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
              }}
            >
              {BENEFITS.map((b) => (
                <li
                  key={b}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'rgba(16,185,129,0.18)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '0.05rem',
                    }}
                  >
                    <IconCheck size={14} color="#10b981" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            {/* Contact strip */}
            <div
              style={{
                marginTop: '2rem',
                padding: '1rem 1.25rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.875rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <a
                href="tel:+37368113314"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                <span style={{ color: '#3b82f6' }}><IconPhone color="#3b82f6" /></span>
                068 113 314
              </a>
              <a
                href="mailto:pyweb.it.academy@gmail.com"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  wordBreak: 'break-all',
                }}
              >
                <span style={{ color: '#3b82f6' }}><IconMail color="#3b82f6" /></span>
                pyweb.it.academy@gmail.com
              </a>
            </div>
          </div>

          {/* RIGHT — Form card */}
          <div>
            {status === 'success' ? (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '1.25rem',
                  padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
                  textAlign: 'center',
                  boxShadow: '0 25px 60px -20px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <IconParty size={64} color="#1d4ed8" />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '0.75rem',
                  }}
                >
                  Mulțumim! Cererea ta a ajuns la noi.
                </h3>
                <p
                  style={{
                    color: '#475569',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    marginBottom: '1.5rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Te contactăm în mai puțin de 24 de ore la numărul lăsat pentru a stabili
                  data lecției gratuite.
                </p>
                <Link
                  href="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#1e40af',
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  Înapoi acasă <IconArrow />
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '1.25rem',
                  padding: isMobile ? '1.75rem 1.25rem' : '2.5rem',
                  boxShadow: '0 25px 60px -20px rgba(0,0,0,0.4)',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    marginBottom: '0.4rem',
                  }}
                >
                  Programează acum
                </h2>
                <p
                  style={{
                    color: '#64748b',
                    fontSize: '0.9rem',
                    marginBottom: '1.5rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Doar 2 câmpuri. Te sunăm noi.
                </p>

                <div style={{ marginBottom: '1.1rem' }}>
                  <label
                    htmlFor="enroll-name"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Numele copilului <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="enroll-name"
                    type="text"
                    placeholder="ex: Alexandru Ionescu"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6'
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="enroll-phone"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Numărul tău de telefon <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="enroll-phone"
                    type="tel"
                    placeholder="ex: +373 68 113 314"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6'
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {errorMsg && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      padding: '0.75rem 1rem',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '0.625rem',
                      color: '#dc2626',
                      fontSize: '0.875rem',
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    width: '100%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: status === 'loading'
                      ? '#94a3b8'
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    padding: '1rem',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
                    transition: 'transform 0.15s, box-shadow 0.2s',
                  }}
                  onMouseOver={(e) => {
                    if (status !== 'loading') {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(245,158,11,0.5)'
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.4)'
                  }}
                >
                  {status === 'loading' ? (
                    <>
                      <IconClock /> Se trimite...
                    </>
                  ) : (
                    <>
                      <IconRocket /> Programează lecția gratuită
                    </>
                  )}
                </button>

                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    textAlign: 'center',
                    fontSize: '0.78rem',
                    color: '#64748b',
                    marginTop: '1rem',
                    marginBottom: 0,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <IconShield /> Datele tale sunt în siguranță. Nu trimitem spam.
                </p>

                <p
                  style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    marginTop: '0.75rem',
                    marginBottom: 0,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Prin trimiterea formularului accepți{' '}
                  <Link href="/termeni" style={{ color: '#1e40af', textDecoration: 'underline' }}>
                    Termenii
                  </Link>{' '}
                  și{' '}
                  <Link href="/gdpr" style={{ color: '#1e40af', textDecoration: 'underline' }}>
                    Politica GDPR
                  </Link>
                  .
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
