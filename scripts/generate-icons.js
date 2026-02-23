const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const outputDir = path.join(__dirname, '../public/icons');

// CAP brand color
const nightGreen = '#303029';
const chalk = '#FFFFF9';

// Create the icon SVG with CAP branding
function createIconSvg(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const innerSize = size - (padding * 2);
  const fontSize = Math.round(innerSize * 0.4);
  const textY = Math.round(size / 2 + fontSize * 0.35);
  const cornerRadius = Math.round(size * 0.15);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${nightGreen}" rx="${maskable ? 0 : cornerRadius}"/>
    <text x="${size / 2}" y="${textY}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${chalk}" text-anchor="middle">55</text>
  </svg>`;
}

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    // Standard icon
    const standardSvg = createIconSvg(size, false);
    await sharp(Buffer.from(standardSvg))
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);

    // Maskable icon (no rounded corners, safe zone padding)
    const maskableSvg = createIconSvg(size, true);
    await sharp(Buffer.from(maskableSvg))
      .png()
      .toFile(path.join(outputDir, `icon-maskable-${size}x${size}.png`));
    console.log(`Generated icon-maskable-${size}x${size}.png`);
  }

  // Generate Apple touch icon (180x180)
  const appleSvg = createIconSvg(180, false);
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Generate favicon (32x32)
  const faviconSvg = createIconSvg(32, false);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(path.join(outputDir, 'favicon-32x32.png'));
  console.log('Generated favicon-32x32.png');

  // Generate favicon (16x16)
  const favicon16Svg = createIconSvg(16, false);
  await sharp(Buffer.from(favicon16Svg))
    .png()
    .toFile(path.join(outputDir, 'favicon-16x16.png'));
  console.log('Generated favicon-16x16.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
