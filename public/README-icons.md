# App Icons for PWA

For best iOS support, you need PNG versions of the icons. The SVG files are provided as placeholders.

## Converting to PNG

You can convert the SVG icons to PNG using:

1. **Online tools:**
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/svg-png/

2. **Command line (if ImageMagick is installed):**
   ```bash
   convert icon-192.svg -resize 192x192 icon-192.png
   convert icon-512.svg -resize 512x512 icon-512.png
   ```

3. **Using Node.js (with sharp or canvas):**
   ```bash
   npm install sharp
   node -e "const sharp = require('sharp'); sharp('icon-192.svg').resize(192, 192).png().toFile('icon-192.png');"
   ```

After creating the PNG files, update `index.html` to reference the PNG files instead of SVG for `apple-touch-icon`.

