'use client'

import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { label: 'Cursuri', href: '#cursuri' },
  { label: 'Cum funcționează', href: '#cum-functioneaza' },
  { label: 'Testimoniale', href: '#testimoniale' },
  { label: 'Contact', href: '#contact' },
]

const legalLinks = [
  { label: 'Termeni și condiții', href: '/termeni', external: false },
  { label: 'Politica GDPR', href: '/gdpr', external: false },
  { label: 'Autentificare', href: '/login', external: false },
]

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/pyweb.academy',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/pyweb.academy',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@pyweb.academy',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
      </svg>
    ),
  },
]

function FooterLink({ href, children, external }) {
  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    color: 'rgba(191,219,254,0.7)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-body)',
    transition: 'color 0.2s',
    lineHeight: 1.5,
  }
  return external ? (
    <a href={href} style={style} target="_blank" rel="noopener noreferrer"
      onMouseOver={e => { e.currentTarget.style.color = '#ffffff' }}
      onMouseOut={e => { e.currentTarget.style.color = 'rgba(191,219,254,0.7)' }}
    >{children}</a>
  ) : (
    <Link href={href} style={style}
      onMouseOver={e => { e.currentTarget.style.color = '#ffffff' }}
      onMouseOut={e => { e.currentTarget.style.color = 'rgba(191,219,254,0.7)' }}
    >{children}</Link>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 60%, #1e40af 100%)',
      color: 'rgba(191,219,254,0.7)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative glow */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: 320, height: 320,
        background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: 260, height: 260,
        background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* CTA Banner */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '2.5rem 1.5rem',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: '1.5rem',
        }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '0.4rem', fontFamily: 'var(--font-body)' }}>
              Începe azi
            </p>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: '#ffffff', fontSize: 'clamp(1.25rem, 3vw, 1.6rem)', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              Prima lecție e gratuită — fără angajament
            </h3>
          </div>
          <a href="#contact" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: '#f59e0b', color: '#0f172a',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9375rem',
            padding: '0.875rem 1.75rem', borderRadius: '0.75rem',
            textDecoration: 'none', whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
            transition: 'background-color 0.2s, transform 0.15s, box-shadow 0.2s',
          }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#d97706'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,0.45)' }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f59e0b'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.35)' }}
          >
            Înregistrează-te gratuit
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <Image
              src="/PyWeb Academy logo.png"
              alt="PyWeb Academy"
              width={148}
              height={48}
              style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: '1rem' }}
            />
            <p style={{ fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              Cursuri de programare, IT și inteligență artificială pentru copii și adolescenți (10–16 ani) în Chișinău.
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 38, height: 38, borderRadius: '0.6rem',
                    background: 'rgba(255,255,255,0.07)',
                    color: 'rgba(191,219,254,0.8)',
                    transition: 'background 0.2s, color 0.2s, transform 0.15s',
                    textDecoration: 'none',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.3)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(191,219,254,0.8)'; e.currentTarget.style.transform = 'none' }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigare */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8125rem', color: '#ffffff', marginBottom: '1.125rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Navigare
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {navLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M9 18l6-6-6-6"/></svg>
                    {l.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8125rem', color: '#ffffff', marginBottom: '1.125rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M9 18l6-6-6-6"/></svg>
                    {l.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8125rem', color: '#ffffff', marginBottom: '1.125rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Contact
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                {
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.58 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.82-.82a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.98 16.92z"/></svg>,
                  text: '+373 60 000 000',
                  href: 'tel:+37360000000',
                },
                {
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
                  text: 'contact@pyweb.online',
                  href: 'mailto:contact@pyweb.online',
                },
                {
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                  text: 'Chișinău, Moldova',
                  href: null,
                },
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                  <span style={{ color: '#3b82f6', marginTop: '0.1rem', flexShrink: 0 }}>{item.icon}</span>
                  {item.href ? (
                    <a href={item.href} style={{ color: 'rgba(191,219,254,0.7)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.color = '#ffffff' }}
                      onMouseOut={e => { e.currentTarget.style.color = 'rgba(191,219,254,0.7)' }}
                    >{item.text}</a>
                  ) : (
                    <span style={{ fontSize: '0.875rem' }}>{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '1.5rem',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.75rem',
        }}>
          <p style={{ fontSize: '0.8125rem', margin: 0 }}>
            © {year} PyWeb Academy · Toate drepturile rezervate
          </p>
          <a href="https://pyweb.online" style={{ fontSize: '0.8125rem', color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
            onMouseOver={e => { e.currentTarget.style.color = '#93c5fd' }}
            onMouseOut={e => { e.currentTarget.style.color = '#3b82f6' }}
          >
            pyweb.online
          </a>
        </div>
      </div>
    </footer>
  )
}
