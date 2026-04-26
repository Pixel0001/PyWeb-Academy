'use client'

import Link from 'next/link'
import Image from 'next/image'

const linkStyle = {
  color: '#94a3b8',
  textDecoration: 'none',
  fontSize: '0.875rem',
  transition: 'color 0.2s',
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ backgroundColor: 'var(--color-primary)', color: '#94a3b8' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>

          {/* Brand */}
          <div>
            <div style={{ marginBottom: '0.875rem' }}>
              <Image
                src="/PyWeb Academy logo.png"
                alt="PyWeb Academy"
                width={150}
                height={49}
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.65 }}>
              Cursuri de programare, IT și inteligență artificială pentru copii (10–16 ani) în Chișinău.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#ffffff', marginBottom: '1rem' }}>Navigare</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { label: 'Beneficii', href: '#beneficii' },
                { label: 'Cum funcționează', href: '#cum-functioneaza' },
                { label: 'Testimoniale', href: '#testimoniale' },
                { label: 'Lecție gratuită', href: '#contact' },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} style={linkStyle}
                    onMouseOver={e => { e.currentTarget.style.color = '#ffffff' }}
                    onMouseOut={e => { e.currentTarget.style.color = '#94a3b8' }}
                  >{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#ffffff', marginBottom: '1rem' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <li><Link href="/termeni" style={linkStyle} onMouseOver={e => { e.currentTarget.style.color = '#fff' }} onMouseOut={e => { e.currentTarget.style.color = '#94a3b8' }}>Termeni și condiții</Link></li>
              <li><Link href="/gdpr" style={linkStyle} onMouseOver={e => { e.currentTarget.style.color = '#fff' }} onMouseOut={e => { e.currentTarget.style.color = '#94a3b8' }}>Politica GDPR</Link></li>
              <li><Link href="/login" style={linkStyle} onMouseOver={e => { e.currentTarget.style.color = '#fff' }} onMouseOut={e => { e.currentTarget.style.color = '#94a3b8' }}>Autentificare</Link></li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem' }}>
          © {year} PyWeb Academy. Toate drepturile rezervate. ·{' '}
          <a href="https://pyweb.online" style={{ color: '#bfdbfe', textDecoration: 'none' }}
            onMouseOver={e => { e.currentTarget.style.color = '#fff' }}
            onMouseOut={e => { e.currentTarget.style.color = '#bfdbfe' }}
          >pyweb.online</a>
        </div>
      </div>
    </footer>
  )
}
