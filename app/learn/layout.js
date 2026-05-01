// Layout pentru toate paginile /learn — adaugă manifest PWA + viewport mobile
export const metadata = {
  manifest: '/manifest-learn.json',
  themeColor: '#4338ca',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PyWeb Learn',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#4338ca',
  viewportFit: 'cover',
}

export default function LearnLayout({ children }) {
  return children
}
