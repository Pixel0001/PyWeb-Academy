// Generate og-image.png (1200x630) and copy favicon.ico to app/
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function main() {
  // ── 1. Copy favicon.ico → app/favicon.ico (Next.js App Router priority) ──
  fs.copyFileSync('public/favicon.ico', 'app/favicon.ico');
  console.log('✓ Copied public/favicon.ico → app/favicon.ico');

  // ── 2. Generate a proper multi-size favicon.ico from favicon-32.png ──
  // Build ICO from 16 + 32 sizes
  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    sizes.map(s =>
      sharp('public/icon-512.png')
        .resize(s, s, { fit: 'cover' })
        .png()
        .toBuffer()
    )
  );

  // Write individual PNGs for reference
  for (let i = 0; i < sizes.length; i++) {
    const outFile = `public/favicon-${sizes[i]}.png`;
    fs.writeFileSync(outFile, pngBuffers[i]);
    console.log(`✓ Generated ${outFile} (${pngBuffers[i].length} bytes)`);
  }

  // ── 3. Generate og-image.png 1200x630 ──
  const logo = await sharp('public/icon-512.png')
    .resize(220, 220, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const svgBg = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e3a5f"/>
      <stop offset="1" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="0" y="0" width="6" height="630" fill="#f59e0b"/>
  <text x="670" y="300" font-family="Arial Black,Arial,sans-serif" font-size="62" font-weight="900" fill="white" text-anchor="start">PyWeb Academy</text>
  <text x="670" y="365" font-family="Arial,sans-serif" font-size="30" fill="#94a3b8" text-anchor="start">Cursuri IT si Programare</text>
  <text x="670" y="405" font-family="Arial,sans-serif" font-size="30" fill="#94a3b8" text-anchor="start">pentru Copii si Adolescenti</text>
  <text x="670" y="470" font-family="Arial,sans-serif" font-size="22" fill="#f59e0b" text-anchor="start">pyweb.online</text>
</svg>`);

  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { r: 15, g: 23, b: 42, alpha: 1 } }
  })
  .composite([
    { input: svgBg, top: 0, left: 0 },
    { input: logo, top: 205, left: 80 },
  ])
  .png({ compressionLevel: 8 })
  .toFile('public/og-image.png');

  const stat = fs.statSync('public/og-image.png');
  console.log(`✓ Generated public/og-image.png (${stat.size} bytes)`);

  // ── 4. Also copy best PNG as app/icon.png for Next.js auto-detection ──
  await sharp('public/icon-512.png')
    .resize(512, 512)
    .png()
    .toFile('app/icon.png');
  console.log('✓ Generated app/icon.png (512x512)');

  // ── 5. apple-touch-icon from 512 ──
  await sharp('public/icon-512.png')
    .resize(180, 180)
    .png()
    .toFile('public/apple-icon.png');
  console.log('✓ Regenerated public/apple-icon.png (180x180)');

  console.log('\n✅ All done!');
}

main().catch(e => { console.error(e); process.exit(1); });
