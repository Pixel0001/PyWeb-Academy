'use client'

import { useState, useEffect } from 'react'

// ─── SVG Icons ────────────────────────────────────────────────────────────
const IconGraduate = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)
const IconTrophy = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/>
    <path d="M12 17v4"/><path d="M8 21h8"/>
    <path d="M6 3h12v8a6 6 0 0 1-12 0z"/>
  </svg>
)
const IconUsers = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconCode = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
)
const IconCalendar = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconTool = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
)
const IconEdit = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconRocket = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
)
const IconCheck = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconTeacher = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 11l-4 4-2-2"/>
  </svg>
)
const IconLaptop = ({ size = 80, color = '#93c5fd' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
  </svg>
)
const IconTrendUp = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)
const IconClock = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconParty = ({ size = 56, color = '#1d4ed8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/>
    <path d="M15 2h.01"/><path d="M22 20h.01"/>
    <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0a2.9 2.9 0 0 1-3.44 2.79L4.87 6.63a2.9 2.9 0 0 1-2.28-4L4 2"/>
    <path d="m11.33 8.56-.34-1.06a2.9 2.9 0 0 0-3.88-1.88v0a2.9 2.9 0 0 1-3.91-3.91l.75.75"/>
  </svg>
)
const IconAlert = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconVideo = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)

// ─── Feature Icon ─────────────────────────────────────────────────────────
function FeatureIcon({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <div style={{
        width: 40, height: 40,
        borderRadius: '0.75rem',
        backgroundColor: 'var(--color-accent-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem',
        flexShrink: 0,
      }}>{icon}</div>
      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)', fontFamily: 'var(--font-body)' }}>{label}</span>
    </div>
  )
}

// ─── Benefit Card ─────────────────────────────────────────────────────────
function BenefitCard({ icon, title, desc }) {
  return (
    <div className="card" style={{ padding: '1.75rem', borderRadius: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        width: 52, height: 52,
        borderRadius: '0.875rem',
        backgroundColor: 'var(--color-accent-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem',
        marginBottom: '1rem',
      }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  )
}

// ─── Step ────────────────────────────────────────────────────────────────
function Step({ number, icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <div style={{
        width: 64, height: 64,
        borderRadius: '1rem',
        background: 'var(--color-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem',
        margin: '0 auto 1rem',
        boxShadow: 'var(--shadow-primary)',
      }}>{icon}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary-light)', marginBottom: '0.375rem' }}>Pasul {number}</div>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-heading)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', lineHeight: 1.6, maxWidth: 240, margin: '0 auto' }}>{desc}</p>
    </div>
  )
}

// ─── Testimonials Carousel ───────────────────────────────────────────────
const FALLBACK_REVIEWS = [
  { id: 'f1', authorName: 'Maria Ionescu', roleLabel: 'Mama lui Alexandru, 12 ani', rating: 5, message: 'Fiul meu este entuziasmat de fiecare curs. A creat deja primul său joc în Python și e mândru de el. Profesorii sunt răbdători și explică totul clar.', avatarUrl: null },
  { id: 'f2', authorName: 'Andrei Popescu', roleLabel: 'Tatăl Elenei, 14 ani', rating: 5, message: 'Am încercat mai multe cursuri online, dar nimic nu se compară cu PyWeb Academy. Grupele mici fac o diferență enormă — copilul meu progresează vizibil.', avatarUrl: null },
  { id: 'f3', authorName: 'Cristina Rusu', roleLabel: 'Mama lui Mihai, 11 ani', rating: 5, message: 'La început eram sceptică, dar după prima lecție gratuită, Mihai nu mai vroia să plece. Acum visează să devină programator. Recomand cu toată încrederea!', avatarUrl: null },
]
const CARD_COLORS = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2']

function TestimonialsCarousel({ reviews = [] }) {
  const items = reviews.length > 0 ? reviews : FALLBACK_REVIEWS
  const PER_PAGE = 3
  const [page, setPage] = useState(0)
  const total = Math.ceil(items.length / PER_PAGE)
  const visible = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {visible.map((r, i) => {
          const globalIdx = page * PER_PAGE + i
          const color = CARD_COLORS[globalIdx % CARD_COLORS.length]
          const initials = r.authorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <TestimonialCard
              key={r.id}
              avatar={initials}
              avatarUrl={r.avatarUrl}
              name={r.authorName}
              role={r.roleLabel || ''}
              rating={r.rating}
              color={color}
              text={r.message}
            />
          )
        })}
      </div>

      {/* Pagination dots + arrows */}
      {total > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2.5rem' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              width: 38, height: 38, borderRadius: '50%', border: '1.5px solid var(--border-light)',
              background: page === 0 ? 'transparent' : 'var(--color-primary)', color: page === 0 ? 'var(--text-muted)' : '#fff',
              cursor: page === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', opacity: page === 0 ? 0.4 : 1,
            }}
            aria-label="Înapoi"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx)}
                style={{
                  width: idx === page ? 22 : 8, height: 8,
                  borderRadius: 9999, border: 'none', cursor: 'pointer', padding: 0,
                  background: idx === page ? 'var(--color-primary)' : 'var(--border-light)',
                  transition: 'all 0.25s',
                }}
                aria-label={`Pagina ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setPage(p => Math.min(total - 1, p + 1))}
            disabled={page === total - 1}
            style={{
              width: 38, height: 38, borderRadius: '50%', border: '1.5px solid var(--border-light)',
              background: page === total - 1 ? 'transparent' : 'var(--color-primary)', color: page === total - 1 ? 'var(--text-muted)' : '#fff',
              cursor: page === total - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', opacity: page === total - 1 ? 0.4 : 1,
            }}
            aria-label="Înainte"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Testimonial Card ────────────────────────────────────────────────────
function TestimonialCard({ name, role, text, avatar, avatarUrl, color, rating = 5 }) {
  const c = color || 'var(--color-primary)'
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '1.75rem',
        padding: '2rem 2rem 1.75rem',
        border: '1px solid var(--border-light)',
        boxShadow: '0 2px 16px rgba(30,58,138,0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'transform 0.22s, box-shadow 0.22s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(30,58,138,0.13)' }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(30,58,138,0.07)' }}
    >
      {/* left colored border */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: c, borderRadius: '1.75rem 0 0 1.75rem' }} />

      {/* stars + ghilimele decorative */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.2rem' }}>
          {[...Array(5)].map((_, i) => (
            <svg key={i} width="16" height="16" viewBox="0 0 20 20" fill={i < rating ? '#f59e0b' : '#e2e8f0'}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        {/* decorative quote mark */}
        <span style={{ fontSize: '4rem', lineHeight: 1, color: c, opacity: 0.12, fontFamily: 'Georgia, serif', marginTop: '-1rem', userSelect: 'none' }}>"</span>
      </div>

      {/* review text */}
      <p style={{ fontSize: '0.9375rem', color: 'var(--text-body)', lineHeight: 1.8, flexGrow: 1, margin: 0, fontStyle: 'italic' }}>
        &ldquo;{text}&rdquo;
      </p>

      {/* author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', marginTop: '0.25rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${c} 0%, ${c}cc 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
          letterSpacing: '0.03em',
          boxShadow: `0 4px 12px ${c}44`,
          overflow: 'hidden',
        }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : avatar
          }</div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-heading)' }}>{name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{role}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Static config per slug (icons, topics, subtitle, levelColor) ─────────
const LEVEL_COLORS = {
  'Începător': '#22c55e',
  'Intermediar': '#f97316',
  'Avansat': '#a78bfa',
}

const COURSE_EXTRAS = {
  'python-fundamentals': {
    subtitle: 'Primul pas în programare',
    levelColor: '#22c55e',
    topics: ['Variabile & tipuri', 'Funcții', 'OOP', 'Proiect final'],
    langIcons: [
      <svg key="py" width="28" height="28" viewBox="0 0 256 255" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="pyA" x1="12%" y1="12%" x2="88%" y2="88%"><stop offset="0%" stopColor="#5A9FD4"/><stop offset="100%" stopColor="#306998"/></linearGradient><linearGradient id="pyB" x1="12%" y1="12%" x2="88%" y2="88%"><stop offset="0%" stopColor="#FFD43B"/><stop offset="100%" stopColor="#FFE873"/></linearGradient></defs>
        <path fill="url(#pyA)" d="M126.9 0C60.4 0 64.4 28 64.4 28l.1 29h63.6v8.7H40.2S0 61.2 0 128.4c0 67.2 37.2 64.8 37.2 64.8h22.2v-31.2s-1.2-37.2 36.6-37.2h63.1s35.4.6 35.4-34.2V35.4C194.5 1.8 160.1 0 126.9 0zm-35 20.4c6.3 0 11.4 5.1 11.4 11.4S98.2 43.2 91.9 43.2 80.5 38.1 80.5 31.8s5.1-11.4 11.4-11.4z"/>
        <path fill="url(#pyB)" d="M129.1 255c66.5 0 62.5-28 62.5-28l-.1-29H128v-8.7h87.9S256 193.8 256 126.6c0-67.2-37.2-64.8-37.2-64.8h-22.2v31.2s1.2 37.2-36.6 37.2H96.9S61.5 129.6 61.5 164.4v57.6c0 33.6 34.4 33 67.6 33zm35-20.4c-6.3 0-11.4-5.1-11.4-11.4s5.1-11.4 11.4-11.4 11.4 5.1 11.4 11.4-5.1 11.4-11.4 11.4z"/>
      </svg>,
    ],
  },
  'html-css-js': {
    subtitle: 'Fundația web-ului modern',
    levelColor: '#f97316',
    topics: ['HTML5', 'CSS3', 'JavaScript', 'DOM & Events'],
    langIcons: [
      <svg key="html" width="26" height="26" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="#E44D26" d="M107.6 471l-33-370.4h362.8l-33 370.2L255.7 512z"/><path fill="#F16529" d="M256 480.5l120.9-33.5 28.2-315.9H256z"/><path fill="#EBEBEB" d="M256 268.8h-60.2l-4.2-46.8H256v-45.8H142.5l1.1 12.5 11.4 127.9H256zm0 122.6l-.2.1-50.7-13.7-3.2-36.3h-45.9l6.4 71.5 93.4 25.9.2-.1z"/><path fill="#fff" d="M255.8 268.8v45.8h56.2l-5.3 58.8-50.9 13.7v47.5l93.5-25.9 6.9-76.8 7.1-79.2h-107.5zm0-92.6v45.8h110.6l.9-12.5 2.1-33.3h-113.6z"/></svg>,
      <svg key="css" width="26" height="26" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="#1572B6" d="M107.6 471l-33-370.4h362.8l-33 370.2L255.7 512z"/><path fill="#33A9DC" d="M256 480.5l120.9-33.5 28.2-315.9H256z"/><path fill="#fff" d="M256 268.8h57.3l-4 44.4-53.3 14.4v47.2l98.2-27.2 7.2-80.8 7.4-82.7H256v45.8h108.6l-3.6 40.9H256zm0-92.6v45.8h112.8l.9-9.9 2.1-35.9H256z"/><path fill="#EBEBEB" d="M256 314.5l-.2.1-53.5-14.4-3.4-38.6h-45.7l6.7 74.7 96.1 26.6v-48.4zm-50.7-137.3l3.3 36.7H256v-45.8h-93.5l4 9.1z"/></svg>,
      <svg key="js" width="26" height="26" viewBox="0 0 630 630" xmlns="http://www.w3.org/2000/svg"><rect width="630" height="630" fill="#f7df1e" rx="40"/><path d="M423.2 492.2c12.7 20.7 29.2 36 58.4 36 24.5 0 40.2-12.3 40.2-29.2 0-20.3-16.1-27.5-43.1-39.3l-14.8-6.4c-42.7-18.2-71.1-41-71.1-89.1 0-44.4 33.8-78.2 86.7-78.2 37.6 0 64.7 13.1 84.2 47.4l-46.1 29.6c-10.1-18.2-21.1-25.4-38.1-25.4-17.3 0-28.3 11-28.3 25.4 0 17.8 11 25 36.4 36.1l14.8 6.4c50.3 21.6 78.7 43.6 78.7 93 0 53.3-41.9 82.5-98.1 82.5-54.9 0-90.4-26.2-107.7-60.6zm-209.2 5.9c9.3 16.5 17.8 30.4 38.1 30.4 19.4 0 31.7-7.6 31.7-37.2v-201.3h57.2v202.2c0 61.3-35.9 89.2-88.4 89.2-47.3 0-74.7-24.5-88.6-54z"/></svg>,
    ],
  },
  'cpp-programming': {
    subtitle: 'Programare de performanță',
    levelColor: '#00599C',
    topics: ['Pointeri & memorie', 'OOP', 'STL', 'Algoritmi & structuri'],
    langIcons: [
      <svg key="cpp" width="28" height="28" viewBox="0 0 306 344.1" xmlns="http://www.w3.org/2000/svg"><path fill="#00599C" d="M302.1 258l-153 88.1L0 258V86L149.1 0l153 88.1z"/><path fill="#004482" d="M149.1 0v346.1L302 258V88z"/><path fill="#659AD2" d="M149.1 0L0 86v172l149.1 88.1z"/><path fill="#fff" d="M113.3 173a54.7 54.7 0 0 1-23.7 33.2 54.2 54.2 0 0 1-29.6 8.7c-30.1 0-54.6-24.4-54.6-54.6S30 105.7 60 105.7c11.3 0 22 3.4 30.9 9.8a54.8 54.8 0 0 1 21.6 31.2H89.6a31.7 31.7 0 0 0-29.6-19.9c-17.5 0-31.6 14.2-31.6 31.6s14.1 31.6 31.6 31.6a31.7 31.7 0 0 0 30.2-22.1zm70.3 4.5h-13.2v13.2h-11.2v-13.2h-13.2v-11.2h13.2v-13.2h11.2v13.2h13.2zm50.2 0h-13.2v13.2h-11.2v-13.2h-13.2v-11.2h13.2v-13.2h11.2v13.2h13.2z"/></svg>,
    ],
  },
  'react-development': {
    subtitle: 'UI-uri moderne și interactive',
    levelColor: '#61DAFB',
    topics: ['Componente & Props', 'Hooks', 'Context API', 'React Router'],
    langIcons: [
      <svg key="react" width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="18" fill="#1a1a2e"/><ellipse cx="50" cy="50" rx="38" ry="16" stroke="#61DAFB" strokeWidth="4" fill="none"/><ellipse cx="50" cy="50" rx="38" ry="16" stroke="#61DAFB" strokeWidth="4" fill="none" transform="rotate(60 50 50)"/><ellipse cx="50" cy="50" rx="38" ry="16" stroke="#61DAFB" strokeWidth="4" fill="none" transform="rotate(120 50 50)"/><circle cx="50" cy="50" r="6" fill="#61DAFB"/></svg>,
    ],
  },
  'nextjs-fullstack': {
    subtitle: 'Full-stack web development',
    levelColor: '#ffffff',
    topics: ['SSR & SSG', 'API Routes', 'Auth & DB', 'Vercel Deploy'],
    langIcons: [
      <svg key="next" width="28" height="28" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg"><rect width="180" height="180" rx="36" fill="#000"/><path d="M149.508 157.52L69.142 54H54v71.97h11.978V69.384l73.413 95.461a90.079 90.079 0 0010.117-7.325z" fill="url(#nxA)"/><rect x="115" y="54" width="12" height="72" fill="url(#nxB)"/><defs><linearGradient id="nxA" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient><linearGradient id="nxB" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient></defs></svg>,
    ],
  },
  'tailwind-ui-design': {
    subtitle: 'UI design modern & rapid',
    levelColor: '#38bdf8',
    topics: ['Utility-first CSS', 'Componente React', 'Animații', 'Design responsiv'],
    langIcons: [
      <svg key="tw" width="28" height="28" viewBox="0 0 54 33" xmlns="http://www.w3.org/2000/svg"><rect width="54" height="33" rx="8" fill="#0f172a"/><path fillRule="evenodd" clipRule="evenodd" d="M27 8c-2.333 0-3.833 1.167-4.5 3.5.9-1.167 1.95-1.604 3.15-1.313.685.171 1.174.669 1.716 1.218C28.27 12.328 29.317 13.5 32 13.5c2.333 0 3.833-1.167 4.5-3.5-.9 1.167-1.95 1.604-3.15 1.313-.685-.171-1.174-.669-1.716-1.218C30.73 9.172 29.683 8 27 8zM22.5 13.5c-2.333 0-3.833 1.167-4.5 3.5.9-1.167 1.95-1.604 3.15-1.313.685.171 1.174.669 1.716 1.218C23.77 17.828 24.817 19 27.5 19c2.333 0 3.833-1.167 4.5-3.5-.9 1.167-1.95 1.604-3.15 1.313-.685-.171-1.174-.669-1.716-1.218C26.23 14.672 25.183 13.5 22.5 13.5z" fill="#38BDF8"/></svg>,
    ],
  },
}

// fallback topics if slug not in COURSE_EXTRAS
const DEFAULT_TOPICS = ['Teorie', 'Practică', 'Proiecte', 'Certificat']

// ─── Main Page ────────────────────────────────────────────────────────────
export default function HomePage({ courses = [], reviews = [] }) {
  const [form, setForm] = useState({ name: '', phone: '' })
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Scroll to hash anchor when navigating from other pages (e.g. /curs/[slug] -> /#contact)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const id = hash.replace('#', '')
    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (attempts < 10) {
        setTimeout(() => tryScroll(attempts + 1), 100)
      }
    }
    tryScroll()
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
          message: `Cerere lecție gratuită de pe site. Telefon: ${form.phone.trim()}`
        })
      })
      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        setErrorMsg(data.error || 'A apărut o eroare. Încearcă din nou.')
        setStatus('idle')
      }
    } catch {
      setErrorMsg('Eroare de rețea. Verifică conexiunea și încearcă din nou.')
      setStatus('idle')
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', fontFamily: 'var(--font-body)' }}>

      {/* ── 1. HERO — full image cu overlay ──────────────────────────── */}
      <section style={{ position: 'relative', height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

        {/* Background image */}
        <img
          src="/copil care invata2.png"
          alt="Adolescenți care programează"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
            display: 'block',
          }}
        />

        {/* Gradient overlay — umbră subtilă jos pentru lizibilitatea textului */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 100%)',
        }} />

        {/* Content */}
        <div className="hero-content" style={{
          position: 'relative', zIndex: 1,
          flex: 1, display: 'flex', alignItems: 'flex-end',
          maxWidth: 1200, margin: '0', width: '100%',
          padding: '3.5rem 3.5rem 6rem',
        }}>
          <div style={{ maxWidth: 620 }}>

            {/* Badge */}

            {/* Heading */}
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              color: '#ffffff',
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em',
            }}>
              Programare pentru<br />
              <span style={{
                background: 'linear-gradient(90deg, #60a5fa, #a5f3fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>adolescenți</span>
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.65,
              marginBottom: '2rem',
              maxWidth: 460,
            }}>
              Grupe mici, profesori cu experiență, proiecte reale.
              <strong style={{ color: '#fff' }}> Prima lecție gratuită.</strong>
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <a href="#contact" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: '#f59e0b',
                color: '#0f172a',
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: '1rem',
                padding: '0.9rem 2rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
                transition: 'all 0.2s',
              }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#d97706'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f59e0b'; e.currentTarget.style.transform = 'none' }}
              >
                <IconRocket size={18} color="#0f172a" /> Lecție gratuită
              </a>
              <a href="#cursuri" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                color: '#ffffff',
                fontFamily: 'var(--font-heading)', fontWeight: 600,
                fontSize: '1rem',
                padding: '0.9rem 1.75rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)' }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              >
                Vezi cursurile →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex', gap: '0', flexWrap: 'wrap',
        }} className="stats-bar-inner">
          {[
            { val: '100+', label: 'Elevi activi', icon: <IconUsers size={18} color="#60a5fa" /> },
            { val: '2 ani', label: 'Program complet', icon: <IconCalendar size={18} color="#60a5fa" /> },
            { val: '10 max', label: 'Elevi per grupă', icon: <IconGraduate size={18} color="#60a5fa" /> },
            { val: '100%', label: 'Prima lecție gratuită', icon: <IconTrophy size={18} color="#60a5fa" /> },
          ].map((stat, i) => (
            <div key={stat.label} className="stat-item" style={{
              flex: '1 1 160px',
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '1.25rem 1.5rem',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '0.75rem',
                backgroundColor: 'rgba(96,165,250,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{stat.icon}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: '#ffffff', lineHeight: 1.1 }}>{stat.val}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.1rem' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CURSURI ──────────────────────────────────────────────────────── */}
      <section id="cursuri" style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--bg-page)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="section-label" style={{ marginBottom: '0.5rem' }}>Ce predăm</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.75rem' }}>
              Cursurile noastre
            </h2>
            <p style={{ color: 'var(--text-body)', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>
              Fiecare curs este construit progresiv — de la zero la proiecte reale.
            </p>
          </div>

          <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {courses.map((c) => {
              const extras = COURSE_EXTRAS[c.slug] || {}
              const levelColor = extras.levelColor || LEVEL_COLORS[c.level] || '#94a3b8'
              const age = (c.ageMin && c.ageMax) ? `${c.ageMin}–${c.ageMax} ani` : c.ageMin ? `${c.ageMin}+ ani` : ''
              const image = c.mainImageUrl || c.imageUrl || 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80'
              const hasDiscount = c.discountPrice != null && c.discountPrice < c.price
              const isFree = c.price === 0 && !hasDiscount
              const discountPct = hasDiscount ? Math.round((1 - c.discountPrice / c.price) * 100) : 0
              return (
              <a key={c.slug} href={`/curs/${c.slug}`}
                className="course-card"
                style={{ textDecoration: 'none', display: 'block', position: 'relative', borderRadius: '1.5rem', overflow: 'hidden', height: 480, boxShadow: '0 4px 32px rgba(15,23,42,0.18)', transition: 'transform 0.25s, box-shadow 0.25s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-7px)'; e.currentTarget.style.boxShadow = '0 20px 56px rgba(15,23,42,0.3)' }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 32px rgba(15,23,42,0.18)' }}
              >
                {/* Full-card background image */}
                <img src={image} alt={c.title}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
                {/* Dark gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,14,30,0.18) 0%, rgba(10,14,30,0.5) 40%, rgba(10,14,30,0.96) 100%)' }} />

                {/* TOP ROW: level + discount badge */}
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', right: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#fff', backgroundColor: levelColor, padding: '0.28rem 0.8rem', borderRadius: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
                    {c.level || 'Curs'}
                  </span>
                  {hasDiscount && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', backgroundColor: '#dc2626', padding: '0.28rem 0.7rem', borderRadius: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>-{discountPct}%</span>
                  )}
                  {isFree && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', backgroundColor: '#16a34a', padding: '0.28rem 0.8rem', borderRadius: 9999, boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>Gratuit</span>
                  )}
                </div>

                {/* BOTTOM content */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem 1.25rem 1.25rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: '#fff', lineHeight: 1.15, marginBottom: '0.75rem' }}>{c.title}</h3>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Price */}
                    <div>
                      {isFree ? (
                        <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#4ade80', letterSpacing: '-0.02em' }}>Gratuit</span>
                      ) : hasDiscount ? (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.02em' }}>{c.discountPrice} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,200,80,0.75)' }}>lei/lună</span></span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textDecoration: 'line-through' }}>{c.price} lei</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{c.price}</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>lei/lună</span>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: levelColor }}>
                      Vezi detalii →
                    </span>
                  </div>
                </div>
              </a>
            )})}
            {courses.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-body)', opacity: 0.6 }}>
                <p style={{ fontSize: '1.1rem' }}>Cursurile vor fi disponibile în curând.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="cum-functioneaza" style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--bg-section-alt)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p className="section-label" style={{ marginBottom: '0.5rem' }}>Simplu și rapid</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: 'var(--text-heading)' }}>
              Cum funcționează?
            </h2>
          </div>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
            <Step number={1} icon={<IconEdit color="#fff" />} title="Te înscrii" desc="Completezi un formular simplu cu datele copilului. Te contactăm în 24 de ore." />
            <Step number={2} icon={<IconGraduate color="#fff" />} title="Lecția demo" desc="Participi gratuit la o lecție demonstrativă și vezi cum decurg cursurile." />
            <Step number={3} icon={<IconRocket color="#fff" />} title="Pornești programul" desc="Dacă îți place, te înscrii în grupă și pornești pe drumul spre carieră în IT." />
          </div>
        </div>
      </section>

      {/* ── 4. TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section id="testimoniale" style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--bg-section-alt)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p className="section-label" style={{ marginBottom: '0.5rem' }}>Ce spun părinții</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.75rem' }}>
              Rezultate reale, familii mulțumite
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto' }}>
              Peste 100 de familii din Chișinău au ales PyWeb Academy. Iată ce spun ei.
            </p>
          </div>

          {/* Stats row */}
          <div className="testimonials-stats" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            {[{ val: '100+', label: 'Elevi activi' }, { val: '4.9★', label: 'Rating mediu' }, { val: '98%', label: 'Recomandă' }].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{s.val}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Cards — Carousel */}
          <TestimonialsCarousel reviews={reviews} />
        </div>
      </section>

      {/* ── 5. FINAL CTA ────────────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--color-primary)', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="badge" style={{ marginBottom: '1.5rem', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconAlert size={15} color="#fbbf24" /> Locuri limitate — grupe aproape complete
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
            Asigură-ți locul astăzi
          </h2>
          <p style={{ fontSize: '1.0625rem', color: '#bfdbfe', marginBottom: '2rem', lineHeight: 1.6 }}>
            Prima lecție este complet gratuită. Fără riscuri, fără obligații.
          </p>
          <a href="#contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: '#ffffff', color: 'var(--color-primary)',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem',
            padding: '0.9rem 2.25rem', borderRadius: '0.75rem',
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            transition: 'var(--transition)',
          }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
          >
            <IconCheck size={18} color="var(--color-primary)" /> Vreau lecția GRATUITĂ
          </a>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>Răspundem în mai puțin de 24 de ore</p>
        </div>
      </section>

      {/* ── 6. CONTACT FORM ─────────────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <p className="section-label" style={{ marginBottom: '0.5rem' }}>Înscrie-te acum</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.75rem' }}>
              Rezervă lecția gratuită
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Completează formularul și te contactăm noi în maxim 24h.</p>
          </div>

          {status === 'success' ? (
            <div style={{ backgroundColor: 'var(--color-accent-light)', border: '1px solid #bfdbfe', borderRadius: '1.25rem', padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}><IconParty size={56} color="var(--color-primary-light)" /></div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>Înregistrare primită!</h3>
              <p style={{ color: 'var(--text-body)', fontSize: '0.9rem' }}>Te contactăm în mai puțin de 24 de ore pentru a stabili data lecției gratuite.</p>
            </div>
          ) : (
            <form id="contact-form" onSubmit={handleSubmit}
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-light)', borderRadius: '1.25rem', padding: '2.5rem', boxShadow: 'var(--shadow-card)' }}
              noValidate
            >
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                  Numele copilului <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="name" type="text" placeholder="ex: Alexandru Ionescu"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required className="input-field" />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="phone" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                  Numărul tău de telefon <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input id="phone" type="tel" placeholder="ex: +373 69 123 456"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required className="input-field" />
              </div>
              {errorMsg && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.625rem', color: '#dc2626', fontSize: '0.875rem' }}>
                  {errorMsg}
                </div>
              )}
              <button type="submit" disabled={status === 'loading'} className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.9rem', opacity: status === 'loading' ? 0.6 : 1, cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}
              >
                {status === 'loading' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IconClock size={18} color="#fff" /> Se trimite...</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IconRocket size={18} color="#fff" /> Vreau lecția GRATUITĂ</span>
                )}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                Datele tale sunt în siguranță. Nu trimitem spam.
              </p>
            </form>
          )}
        </div>
      </section>

      <style jsx>{`
        /* ── MOBILE ────────────────────────────── */
        @media (max-width: 640px) {
          /* Hero */
          .hero-content {
            padding: 1.5rem 1.25rem 4rem !important;
            align-items: flex-end !important;
          }
          .hero-cta {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
          .hero-cta a {
            text-align: center;
            justify-content: center;
          }

          /* Stats bar */
          .stats-bar-inner {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }
          .stat-item {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            padding: 1rem !important;
          }

          /* Courses grid */
          .courses-grid {
            grid-template-columns: 1fr !important;
            gap: 1.25rem !important;
          }
          .course-card {
            height: 420px !important;
          }

          /* Steps */
          .steps-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }

          /* Testimonials */
          .testimonials-stats {
            gap: 1.5rem !important;
          }
        }

        /* ── TABLET ────────────────────────────── */
        @media (min-width: 641px) and (max-width: 1024px) {
          .hero-content {
            padding: 2rem 2rem 5rem !important;
          }
          .courses-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem !important;
          }
          .course-card {
            height: 460px !important;
          }
          .stats-bar-inner {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .stat-item {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
        }
      `}</style>
    </div>
  )
}
