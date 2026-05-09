'use client'
import { useEffect } from 'react'

/**
 * TitleBadge — badge animat pentru titluri cosmetice.
 * Efectele sunt stocate în cssPayload.titleEffect al cosmetic-ului.
 */

export const TITLE_EFFECTS = [
  { value: 'none',    label: '— Fără efect (simplu)' },
  { value: 'shimmer', label: '✨ Shimmer Auriu' },
  { value: 'rainbow', label: '🌈 Curcubeu' },
  { value: 'fire',    label: '🔥 Foc' },
  { value: 'ice',     label: '❄️ Gheață' },
  { value: 'neon',    label: '💚 Neon Verde' },
  { value: 'mythic',  label: '🌟 Mythic' },
  { value: 'shadow',  label: '🖤 Shadow' },
]

// Stiluri pentru textul animat (React inline style objects)
const TEXT_STYLES = {
  shimmer: {
    background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f97316, #fef08a, #fbbf24, #f59e0b)',
    backgroundSize: '300%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'pyweb-title-shimmer 2.5s linear infinite',
    filter: 'drop-shadow(0 0 3px #fbbf2488)',
  },
  rainbow: {
    background: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)',
    backgroundSize: '300%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'pyweb-title-shimmer 3s linear infinite',
  },
  fire: {
    background: 'linear-gradient(90deg, #dc2626, #f97316, #fbbf24, #f97316, #dc2626)',
    backgroundSize: '300%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'pyweb-title-shimmer 2s linear infinite',
    filter: 'drop-shadow(0 0 4px #ef444499)',
  },
  ice: {
    background: 'linear-gradient(90deg, #7dd3fc, #38bdf8, #e0f2fe, #38bdf8, #7dd3fc)',
    backgroundSize: '300%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'pyweb-title-shimmer 3s linear infinite',
    filter: 'drop-shadow(0 0 4px #38bdf888)',
  },
  neon: {
    color: '#4ade80',
    textShadow: '0 0 6px #4ade80, 0 0 14px #22c55e88',
    animation: 'pyweb-title-neon 1.8s ease-in-out infinite',
  },
  mythic: {
    background: 'linear-gradient(90deg, #a855f7, #ec4899, #fbbf24, #ec4899, #a855f7)',
    backgroundSize: '300%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'pyweb-title-shimmer 3s linear infinite',
    filter: 'drop-shadow(0 0 5px #a855f777)',
  },
  shadow: {
    color: '#f1f5f9',
    textShadow: '1px 1px 3px #000, 0 0 12px rgba(0,0,0,0.7)',
    animation: 'pyweb-title-shadow 3s ease-in-out infinite',
  },
}

// Container badge styling per efect (light background friendly)
const BADGE_STYLES = {
  none:    'bg-amber-50 text-amber-700 border-amber-200',
  shimmer: 'bg-amber-50 border-amber-300',
  rainbow: 'bg-white border-slate-200',
  fire:    'bg-orange-50 border-orange-300',
  ice:     'bg-sky-50 border-sky-300',
  neon:    'bg-green-950 border-green-500',
  mythic:  'bg-purple-50 border-purple-300',
  shadow:  'bg-slate-800 border-slate-600',
}

const KEYFRAMES = `
@keyframes pyweb-title-shimmer {
  0%   { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}
@keyframes pyweb-title-neon {
  0%, 100% { text-shadow: 0 0 6px #4ade80, 0 0 14px #22c55e88; }
  50%       { text-shadow: 0 0 10px #4ade80, 0 0 24px #22c55e, 0 0 40px #16a34a66; }
}
@keyframes pyweb-title-shadow {
  0%, 100% { text-shadow: 1px 1px 3px #000, 0 0 8px rgba(0,0,0,0.5); }
  50%       { text-shadow: 2px 2px 8px #000, 0 0 24px rgba(0,0,0,0.9), 0 0 40px rgba(148,163,184,0.3); }
}
`

let cssInjected = false
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return
  if (document.getElementById('pyweb-title-badge-css')) { cssInjected = true; return }
  const style = document.createElement('style')
  style.id = 'pyweb-title-badge-css'
  style.textContent = KEYFRAMES
  document.head.appendChild(style)
  cssInjected = true
}

export default function TitleBadge({ name, effect = 'none', rarity = 'COMMON', className = '' }) {
  useEffect(() => { injectCSS() }, [])

  const displayName = (name || '')
    .replace(/^Titlu\s+[„"']?/, '')
    .replace(/["„'"]$/, '')

  const eff = TITLE_EFFECTS.find(e => e.value === effect) ? effect : 'none'
  const badgeCls = BADGE_STYLES[eff] || BADGE_STYLES.none

  if (eff === 'none') {
    // stilizare simplă bazată pe rarity
    const RARITY_CLS = {
      COMMON:    'bg-slate-100 text-slate-600 border-slate-200',
      RARE:      'bg-sky-50 text-sky-700 border-sky-200',
      EPIC:      'bg-purple-50 text-purple-700 border-purple-200',
      LEGENDARY: 'bg-amber-50 text-amber-700 border-amber-200',
      MYTHIC:    'bg-rose-50 text-rose-700 border-rose-200',
    }
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${RARITY_CLS[rarity] || RARITY_CLS.COMMON} ${className}`}>
        ✨ {displayName}
      </span>
    )
  }

  const textStyle = TEXT_STYLES[eff] || {}

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${badgeCls} ${className}`}>
      <span style={textStyle}>✨ {displayName}</span>
    </span>
  )
}
