// Generates all favicon + app icons from "PyWeb Academy letter.png"
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const root = path.join(__dirname, '..')
const src = path.join(root, 'public', 'PyWeb Academy letter.png')
const pub = path.join(root, 'public')

async function generateIcons() {
  console.log('🎨 Generating icons from:', src)

  const sizes = [
    // Favicons
    { file: 'favicon-16.png',    size: 16  },
    { file: 'favicon-32.png',    size: 32  },
    { file: 'favicon-48.png',    size: 48  },
    { file: 'favicon.png',       size: 64  },
    // Apple Touch Icons
    { file: 'apple-icon.png',    size: 180 },
    // Android / PWA
    { file: 'icon-192.png',      size: 192 },
    { file: 'icon-512.png',      size: 512 },
    // OG / Social share thumbnail square
    { file: 'icon-256.png',      size: 256 },
  ]

  for (const { file, size } of sizes) {
    await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(pub, file))
    console.log(`  ✅ ${file} (${size}x${size})`)
  }

  // Generate favicon.ico (multi-size: 16, 32, 48) using manual ICO write
  // We'll use the 32px png as the .ico fallback (browsers handle PNG-in-ICO)
  const ico32 = await sharp(src)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer()
  fs.writeFileSync(path.join(pub, 'favicon.ico'), ico32)
  console.log('  ✅ favicon.ico (32x32 PNG fallback)')

  // Generate manifest.json for PWA
  const manifest = {
    name: 'PyWeb Academy',
    short_name: 'PyWeb',
    description: 'Cursuri IT și Programare pentru Copii în Chișinău',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e3a8a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }
  fs.writeFileSync(path.join(pub, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log('  ✅ manifest.json')

  console.log('\n🎉 All icons generated successfully!')
}

generateIcons().catch(console.error)
