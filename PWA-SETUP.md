# Progressive Web App (PWA) Setup

This app is configured as a Progressive Web App (PWA) and can be installed on iOS devices to work like a native app.

## Features

- ✅ Web App Manifest
- ✅ Service Worker (offline support)
- ✅ iOS "Add to Home Screen" support
- ✅ Standalone display mode
- ✅ Theme colors

## How to Add to iPhone Home Screen

1. **Open the app** in Safari on your iPhone
2. **Tap the Share button** (square with arrow pointing up)
3. **Scroll down** and tap **"Add to Home Screen"**
4. **Customize the name** if desired (default: "Meal Planner")
5. **Tap "Add"** in the top right

The app will now appear on your home screen with its own icon and will open in standalone mode (no browser UI).

## Icon Requirements

For best iOS support, you should convert the SVG icons to PNG format:

- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

See `public/README-icons.md` for conversion instructions.

## Testing PWA Features

1. **Offline Support**: The service worker caches the app for offline use
2. **Standalone Mode**: When added to home screen, opens without browser UI
3. **Theme Color**: Status bar matches app theme (#f97316)

## Deployment Notes

- Ensure `manifest.json` and `sw.js` are served from the root
- HTTPS is required for service workers (except localhost)
- Vercel automatically serves files from the `public` directory

