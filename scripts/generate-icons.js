// Simple script to generate app icons
// This creates SVG icons that can be used for PWA
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Create SVG icon (192x192)
const svg192 = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#f97316" rx="40"/>
  <text x="96" y="120" font-size="100" text-anchor="middle" fill="white">🍽️</text>
</svg>`;

// Create SVG icon (512x512)
const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#f97316" rx="100"/>
  <text x="256" y="320" font-size="280" text-anchor="middle" fill="white">🍽️</text>
</svg>`;

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write SVG files
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), svg192);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), svg512);

console.log('SVG icons created!');
console.log('Note: For best PWA support, convert these to PNG format.');
console.log('You can use an online converter or ImageMagick:');
console.log('  convert icon-192.svg -resize 192x192 icon-192.png');
console.log('  convert icon-512.svg -resize 512x512 icon-512.png');

