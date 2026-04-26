'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { label: 'Cursuri', href: '#cursuri' },
  { label: 'Cum funcționează', href: '#cum-functioneaza' },
  { label: 'Testimoniale', href: '#testimoniale' },
  { label: 'Recenzii', href: '#recenzii' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar({ forceOpaque = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const transparent = !forceOpaque && !scrolled && !menuOpen

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: transparent ? 'transparent' : 'var(--bg-card)',
      borderBottom: transparent ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--border-light)',
      boxShadow: transparent ? 'none' : '0 1px 8px rgba(13,27,75,0.06)',
      transition: 'background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 68,
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Image
            src="/PyWeb Academy logo.png"
            alt="PyWeb Academy"
            width={160}
            height={52}
            style={{ objectFit: 'contain', filter: transparent ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.3s ease' }}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hide-mobile" style={{ display: 'flex', gap: '0.125rem', alignItems: 'center' }}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 500, color: transparent ? 'rgba(255,255,255,0.9)' : 'var(--text-body)', textDecoration: 'none', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', transition: 'var(--transition)' }}
              onMouseOver={e => { e.currentTarget.style.color = transparent ? '#fff' : 'var(--color-primary)'; e.currentTarget.style.backgroundColor = transparent ? 'rgba(255,255,255,0.12)' : 'var(--color-accent-light)' }}
              onMouseOut={e => { e.currentTarget.style.color = transparent ? 'rgba(255,255,255,0.9)' : 'var(--text-body)'; e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/login"
            style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: transparent ? 'rgba(255,255,255,0.9)' : 'var(--text-body)', textDecoration: 'none', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', transition: 'var(--transition)' }}
            onMouseOver={e => { e.currentTarget.style.color = transparent ? '#fff' : 'var(--color-primary)' }}
            onMouseOut={e => { e.currentTarget.style.color = transparent ? 'rgba(255,255,255,0.9)' : 'var(--text-body)' }}
          >
            Autentificare
          </Link>
          <a href="#contact" className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.6rem 1.4rem' }}>
            Înregistrează-te
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="show-mobile"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
          aria-label="Meniu"
        >
          <div style={{ width: 22, height: 2, background: transparent ? '#ffffff' : 'var(--color-primary)', borderRadius: 2, transition: 'var(--transition)', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
          <div style={{ width: 22, height: 2, background: transparent ? '#ffffff' : 'var(--color-primary)', borderRadius: 2, margin: '5px 0', opacity: menuOpen ? 0 : 1, transition: 'var(--transition)' }} />
          <div style={{ width: 22, height: 2, background: transparent ? '#ffffff' : 'var(--color-primary)', borderRadius: 2, transition: 'var(--transition)', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-light)', padding: '1rem 1.5rem' }}>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              style={{ display: 'block', padding: '0.75rem 0', fontWeight: 500, color: 'var(--text-heading)', textDecoration: 'none', borderBottom: '1px solid var(--border-light)', fontFamily: 'var(--font-body)' }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <Link href="/login" className="btn-outline" style={{ flex: 1, display: 'flex', justifyContent: 'center', fontSize: '0.875rem' }}>Autentificare</Link>
            <a href="#contact" className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', fontSize: '0.875rem' }}>Înregistrează-te</a>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
      `}</style>
    </nav>
  )
}

