'use client'

/**
 * CosmeticArt — desenează SVG unic pentru fiecare type+rarity.
 * Fără emoji „dezastru". Toate primesc culorile rarity-ului.
 */

const RARITY_COLORS = {
  COMMON:    { c1: '#94a3b8', c2: '#475569', glow: '#cbd5e1' },
  RARE:      { c1: '#38bdf8', c2: '#1d4ed8', glow: '#7dd3fc' },
  EPIC:      { c1: '#d946ef', c2: '#7e22ce', glow: '#f0abfc' },
  LEGENDARY: { c1: '#fbbf24', c2: '#c2410c', glow: '#fde68a' },
  MYTHIC:    { c1: '#fb7185', c2: '#7c3aed', glow: '#fda4af' },
}

export default function CosmeticArt({ type, rarity = 'COMMON', className = '' }) {
  const c = RARITY_COLORS[rarity] || RARITY_COLORS.COMMON
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`g-${type}-${rarity}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={c.c1} />
          <stop offset="100%" stopColor={c.c2} />
        </linearGradient>
        <radialGradient id={`glow-${type}-${rarity}`}>
          <stop offset="0%"   stopColor={c.glow} stopOpacity="0.6" />
          <stop offset="100%" stopColor={c.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#glow-${type}-${rarity})`} />
      {renderShape(type, `url(#g-${type}-${rarity})`, c)}
    </svg>
  )
}

function renderShape(type, fill, c) {
  const stroke = c.c2
  switch (type) {
    case 'THEME':
      return (
        <g>
          <rect x="20" y="20" width="60" height="60" rx="10" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="35" cy="40" r="6" fill={c.glow} />
          <circle cx="55" cy="40" r="6" fill="#fff" opacity="0.7" />
          <circle cx="45" cy="60" r="6" fill={c.c1} opacity="0.9" />
          <path d="M25 70 L75 70" stroke="#fff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
        </g>
      )
    case 'PROFILE_BANNER':
      return (
        <g>
          <path d="M20 18 L80 18 L80 78 L50 65 L20 78 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="50" cy="40" r="10" fill="#fff" opacity="0.85" />
          <path d="M40 55 L60 55" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
        </g>
      )
    case 'USERNAME_COLOR':
      return (
        <g>
          {/* badge cu coroniță */}
          <circle cx="50" cy="55" r="26" fill={fill} stroke={stroke} strokeWidth="2.5" />
          <path d="M30 35 L40 50 L50 30 L60 50 L70 35 L66 55 L34 55 Z" fill={c.glow} stroke={stroke} strokeWidth="1.5" />
          <text x="50" y="62" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff">★</text>
        </g>
      )
    case 'ANIMATED_FRAME':
      return (
        <g>
          <rect x="15" y="15" width="70" height="70" rx="14" fill="none" stroke={fill} strokeWidth="6" />
          <rect x="25" y="25" width="50" height="50" rx="8" fill="none" stroke={c.glow} strokeWidth="2" opacity="0.8" />
          <circle cx="50" cy="50" r="14" fill={fill} opacity="0.4" />
          <path d="M50 38 L50 62 M38 50 L62 50" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </g>
      )
    case 'LEADERBOARD_EFFECT':
      return (
        <g>
          {/* trofeu */}
          <path d="M35 25 L65 25 L63 50 Q50 62 37 50 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <rect x="42" y="60" width="16" height="8" fill={c.c2} />
          <rect x="35" y="68" width="30" height="6" rx="2" fill={c.c2} />
          <path d="M35 30 Q22 32 24 45 Q26 52 35 50" fill="none" stroke={fill} strokeWidth="3" />
          <path d="M65 30 Q78 32 76 45 Q74 52 65 50" fill="none" stroke={fill} strokeWidth="3" />
          <text x="50" y="44" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff">1</text>
        </g>
      )
    case 'ENTRY_EFFECT':
      return (
        <g>
          {/* portal/uşă cu raze */}
          <ellipse cx="50" cy="50" rx="22" ry="30" fill={fill} stroke={stroke} strokeWidth="2" />
          <ellipse cx="50" cy="50" rx="14" ry="22" fill={c.glow} opacity="0.6" />
          {[0, 60, 120, 180, 240, 300].map(a => (
            <line key={a} x1="50" y1="50" x2={50 + 40 * Math.cos((a * Math.PI) / 180)}
              y2={50 + 40 * Math.sin((a * Math.PI) / 180)}
              stroke={c.glow} strokeWidth="1.5" opacity="0.6" />
          ))}
        </g>
      )
    case 'CODING_AURA':
      return (
        <g>
          {/* {} bracket cu aură */}
          <circle cx="50" cy="50" r="32" fill="none" stroke={fill} strokeWidth="3" opacity="0.5" />
          <circle cx="50" cy="50" r="22" fill={fill} opacity="0.25" />
          <text x="32" y="62" fontSize="32" fontWeight="900" fill={fill}>{'{'}</text>
          <text x="56" y="62" fontSize="32" fontWeight="900" fill={fill}>{'}'}</text>
          <circle cx="50" cy="50" r="3" fill={c.glow} />
        </g>
      )
    case 'TITLE':
      return (
        <g>
          {/* coroană */}
          <path d="M22 60 L28 30 L40 50 L50 25 L60 50 L72 30 L78 60 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <rect x="22" y="60" width="56" height="10" rx="2" fill={c.c2} />
          <circle cx="28" cy="30" r="3" fill={c.glow} />
          <circle cx="50" cy="25" r="3" fill={c.glow} />
          <circle cx="72" cy="30" r="3" fill={c.glow} />
          <circle cx="40" cy="65" r="2.5" fill={c.glow} opacity="0.8" />
          <circle cx="60" cy="65" r="2.5" fill={c.glow} opacity="0.8" />
        </g>
      )
    case 'PET':
      return (
        <g>
          {/* mascota / animal stilizat */}
          <ellipse cx="50" cy="60" rx="26" ry="20" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="50" cy="38" r="18" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M34 28 L38 18 L46 28 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M66 28 L62 18 L54 28 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="44" cy="38" r="2.5" fill="#fff" />
          <circle cx="56" cy="38" r="2.5" fill="#fff" />
          <circle cx="44" cy="38" r="1.2" fill="#000" />
          <circle cx="56" cy="38" r="1.2" fill="#000" />
          <path d="M46 46 Q50 50 54 46" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'RARE_COSMETIC':
      return (
        <g>
          {/* diamant */}
          <path d="M50 20 L75 40 L50 80 L25 40 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M25 40 L75 40" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
          <path d="M50 20 L50 40" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
          <path d="M37 30 L50 40 L63 30" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.5" />
          <path d="M37 40 L50 80" stroke="#fff" strokeWidth="1" opacity="0.4" />
          <path d="M63 40 L50 80" stroke="#fff" strokeWidth="1" opacity="0.4" />
        </g>
      )
    case 'ANIMATED_BACKGROUND':
      return (
        <g>
          <rect x="15" y="15" width="70" height="70" rx="10" fill={fill} />
          {/* munți / orizont */}
          <path d="M15 75 L35 50 L55 70 L75 45 L85 65 L85 85 L15 85 Z" fill={c.c2} opacity="0.7" />
          <circle cx="68" cy="32" r="7" fill={c.glow} />
          <path d="M20 25 L22 27 M30 22 L32 24 M70 20 L72 22 M50 30 L52 32" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </g>
      )
    case 'PARTICLE_EFFECT':
      return (
        <g>
          {/* explozie particule */}
          <circle cx="50" cy="50" r="10" fill={c.glow} />
          <circle cx="50" cy="50" r="6" fill="#fff" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
            const r = 28 + (i % 2) * 6
            const x = 50 + r * Math.cos((a * Math.PI) / 180)
            const y = 50 + r * Math.sin((a * Math.PI) / 180)
            return <circle key={a} cx={x} cy={y} r="3.5" fill={fill} />
          })}
          {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(a => {
            const x = 50 + 22 * Math.cos((a * Math.PI) / 180)
            const y = 50 + 22 * Math.sin((a * Math.PI) / 180)
            return <circle key={a} cx={x} cy={y} r="1.8" fill={c.glow} />
          })}
        </g>
      )
    default:
      return <circle cx="50" cy="50" r="30" fill={fill} stroke={stroke} strokeWidth="2" />
  }
}
