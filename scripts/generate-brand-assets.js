/**
 * Generate optimized brand assets from assets/logo.png:
 *   - assets/favicon-32.png, assets/favicon-192.png, assets/apple-touch-icon.png
 *   - assets/og-image.png (1200x630 social sharing card)
 *
 * Run: node scripts/generate-brand-assets.js
 */

const sharp = require('sharp');
const path = require('path');

const LOGO = path.join(__dirname, '..', 'assets', 'logo.png');
const OUT = path.join(__dirname, '..', 'assets');

async function main() {
  // Small favicons — the 77KB logo.png was being served for every size
  await sharp(LOGO).resize(32, 32).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'favicon-32.png'));
  await sharp(LOGO).resize(192, 192).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'favicon-192.png'));
  await sharp(LOGO).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'apple-touch-icon.png'));

  // 1200x630 Open Graph card: site-gradient background, centered logo + title
  const W = 1200, H = 630;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0d001a"/>
        <stop offset="50%" stop-color="#1c0033"/>
        <stop offset="100%" stop-color="#2d0052"/>
      </linearGradient>
      <linearGradient id="txt" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ff66ff"/>
        <stop offset="100%" stop-color="#ff99ff"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <text x="600" y="255" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-size="30" letter-spacing="8" fill="rgba(255,255,255,0.5)">🎮 FREE ONLINE GAMES</text>
    <text x="600" y="345" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-size="68" font-weight="bold" fill="url(#txt)">Chromebook Unlocked Games</text>
    <text x="600" y="420" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-size="34" fill="rgba(255,255,255,0.85)">Play 180+ Free Unblocked Games Online</text>
    <rect x="450" y="470" width="300" height="4" rx="2" fill="#ff66ff" opacity="0.6"/>
  </svg>`;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'og-image.png'));

  console.log('✅ Brand assets generated in assets/');
}

main().catch((e) => { console.error(e); process.exit(1); });
