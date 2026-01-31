import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svgBuffer = readFileSync(join(publicDir, 'icon.svg'));

async function generateIcons() {
  console.log('Generating icons...');

  // Generate icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512.png'));
  console.log('✓ icon-512.png created');

  // Generate icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192.png'));
  console.log('✓ icon-192.png created');

  // Generate favicon.ico (32x32 PNG, browsers accept PNG as favicon)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.png'));

  // For true .ico, we'll use the 32x32 PNG and rename
  // Most modern browsers support PNG favicons
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.ico'));
  console.log('✓ favicon.ico created');

  // Generate apple-touch-icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png created');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
