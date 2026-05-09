'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RocketLaunchIcon } from '@heroicons/react/24/solid'

const navLinks = [
  { label: 'Cursuri', href: '/#cursuri' },
  { label: 'Cum funcționează', href: '/#cum-functioneaza' },
  { label: 'Blog', href: '/blog' },
  { label: 'Recenzii', href: '/#testimoniale' },
  { label: 'Contact', href: '/#contact' },
]

export default function Navbar({ forceOpaque = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('scroll', onScroll)
    }
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
        padding: isMobile ? '0 1rem' : '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: isMobile ? 58 : 68,
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Image
            src="/PyWeb Academy logo.png"
            alt="PyWeb Academy"
            width={isMobile ? 130 : 160}
            height={isMobile ? 42 : 52}
            style={{ objectFit: 'contain', filter: transparent ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.3s ease' }}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '0.125rem', alignItems: 'center' }}>
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
        )}

        {/* Desktop Actions */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a href="#contact"
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: transparent ? 'rgba(255,255,255,0.9)' : 'var(--text-body)', textDecoration: 'none', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', transition: 'var(--transition)' }}
              onMouseOver={e => { e.currentTarget.style.color = transparent ? '#fff' : 'var(--color-primary)' }}
              onMouseOut={e => { e.currentTarget.style.color = transparent ? 'rgba(255,255,255,0.9)' : 'var(--text-body)' }}
            >
              Înregistrează-te
            </a>
            <Link href="/learn/guest"
              style={{ fontFamily: 'var(--font-heading)', fontSize: '0.875rem', fontWeight: 700, color: '#1a0a00', textDecoration: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', boxShadow: '0 2px 12px rgba(239,68,68,0.35)', transition: 'opacity 0.2s, transform 0.2s', letterSpacing: '-0.01em', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onMouseOver={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
            >
              <RocketLaunchIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
              Deschide aplicația gratuit
            </Link>
          </div>
        )}

        {/* Mobile Hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: '0.625rem', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0 }}
            aria-label="Meniu"
          >
            <div style={{ width: 22, height: 2, background: transparent ? '#ffffff' : 'var(--color-primary)', borderRadius: 2, transition: 'var(--transition)', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
            <div style={{ width: 22, height: 2, background: transparent ? '#ffffff' : 'var(--color-primary)', borderRadius: 2, margin: '5px 0', opacity: menuOpen ? 0 : 1, transition: 'var(--transition)' }} />
            <div style={{ width: 22, height: 2, background: transparent ? '#ffffff' : 'var(--color-primary)', borderRadius: 2, transition: 'var(--transition)', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobile && menuOpen && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-light)',
          padding: '0.5rem 0 1.25rem',
          maxHeight: 'calc(100vh - 58px)',
          overflowY: 'auto',
        }}>
          {/* Nav links */}
          <div style={{ padding: '0 1.25rem' }}>
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.875rem 0',
                  fontWeight: 600, fontSize: '1rem',
                  color: 'var(--text-heading)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '-0.01em',
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <a href="#contact" onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'var(--color-primary)', color: '#fff',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9375rem',
                padding: '0.875rem 1rem', borderRadius: '0.75rem',
                textDecoration: 'none', letterSpacing: '-0.01em',
              }}
            >
              Înregistrează-te gratuit
            </a>
            <Link href="/learn/guest" onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', color: '#1a0a00',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9375rem',
                padding: '0.875rem 1rem', borderRadius: '0.75rem',
                textDecoration: 'none', letterSpacing: '-0.01em',
                boxShadow: '0 2px 12px rgba(239,68,68,0.3)',
              }}
            >
              <RocketLaunchIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
              Deschide aplicația gratuit
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

