// Script pentru a crea favicon.ico din logo-ul PI School
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createFavicon() {
  const rootDir = path.join(__dirname, '..');
  const inputPath = path.join(rootDir, 'public', 'pi.png');
  const outputIco = path.join(rootDir, 'public', 'favicon.ico');
  
  console.log('🎨 Creez favicon.ico din pi.png...');
  
  try {
    // Creează multiple dimensiuni pentru ICO
    const sizes = [16, 32, 48];
    const images = await Promise.all(
      sizes.map(size => 
        sharp(inputPath)
          .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer()
      )
    );
    
    // Creează un ICO manual (format simplu cu PNG embedded)
    // ICO header
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // Type (1 = ICO)
    header.writeUInt16LE(sizes.length, 4); // Number of images
    
    // Directory entries
    const dirEntries = [];
    let offset = 6 + (16 * sizes.length); // Header + directory
    
    for (let i = 0; i < sizes.length; i++) {
      const entry = Buffer.alloc(16);
      entry.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 0); // Width
      entry.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 1); // Height
      entry.writeUInt8(0, 2); // Color palette
      entry.writeUInt8(0, 3); // Reserved
      entry.writeUInt16LE(1, 4); // Color planes
      entry.writeUInt16LE(32, 6); // Bits per pixel
      entry.writeUInt32LE(images[i].length, 8); // Image size
      entry.writeUInt32LE(offset, 12); // Image offset
      dirEntries.push(entry);
      offset += images[i].length;
    }
    
    // Combine all parts
    const ico = Buffer.concat([header, ...dirEntries, ...images]);
    fs.writeFileSync(outputIco, ico);
    
    console.log('✅ favicon.ico creat cu succes!');
    
  } catch (error) {
    console.error('❌ Eroare:', error);
  }
}

createFavicon();
