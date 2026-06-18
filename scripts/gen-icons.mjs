// Generates FMX app icon + splash assets from a single cohesive lightning-bolt mark.
// Run: node scripts/gen-icons.mjs   (regenerates everything in assets/images/)
//
// Outputs:
//  - icon.png              1024  full-bleed gradient + white bolt  (iOS / top-level icon)
//  - adaptive-foreground.png 1024 transparent + white bolt in the Android safe zone
//  - adaptive-background.png 1024 accent gradient fill (Android adaptive background)
//  - splash.png            1024  rounded gradient badge + white bolt (splash logo)
//  - favicon.png             48  small full-bleed icon (web)
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/images');

// Accent gradient + a soft top-left sheen for depth.
const DEFS = `
  <linearGradient id="g" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ff6f9c"/>
    <stop offset="0.5" stop-color="#fd356d"/>
    <stop offset="1" stop-color="#c41d4e"/>
  </linearGradient>
  <radialGradient id="sheen" cx="330" cy="250" r="780" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/>
    <stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
`;

// Lightning bolt, designed to sit inside the Android adaptive safe zone (center ~66%).
// Bounds ≈ x[330..702], y[180..846] within the 1024 canvas → centered, never cropped.
const BOLT =
  'M598 176 L330 588 L486 588 L430 848 L702 452 L548 452 Z';

const svg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs>${DEFS}</defs>${inner}</svg>`;

// The bolt scaled about the canvas centre. `1` = the raw path (~66% of the canvas).
// ICON_SCALE < 1 leaves accent margin inside the circular launcher mask; the notification
// glyph is scaled UP so it nearly fills its small status-bar canvas and stays legible.
const ICON_SCALE = 0.8;
const NOTIF_SCALE = 1.35;
const bolt = (scale = 1) =>
  `<g transform="translate(516 512) scale(${scale}) translate(-516 -512)"><path d="${BOLT}" fill="#ffffff"/></g>`;

const fullBleed = svg(
  `<rect width="1024" height="1024" fill="url(#g)"/>` +
    `<rect width="1024" height="1024" fill="url(#sheen)"/>` +
    bolt(ICON_SCALE),
);

const foreground = svg(bolt(ICON_SCALE));

// Android notification / status-bar small icon: a white silhouette on transparent (the OS
// tints it). Scaled UP so the glyph fills the tiny status-bar slot and is clearly visible.
const notification = svg(bolt(NOTIF_SCALE));

const background = svg(
  `<rect width="1024" height="1024" fill="url(#g)"/>` +
    `<rect width="1024" height="1024" fill="url(#sheen)"/>`,
);

// Splash: a floating rounded-square badge (like the app icon) centered on the dark splash bg.
const splash = svg(
  `<rect x="150" y="150" width="724" height="724" rx="172" fill="url(#g)"/>` +
    `<rect x="150" y="150" width="724" height="724" rx="172" fill="url(#sheen)"/>` +
    bolt(ICON_SCALE),
);

async function render(svgStr, file, size) {
  await sharp(Buffer.from(svgStr))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT, file));
  console.log('wrote', file, size);
}

await render(fullBleed, 'icon.png', 1024);
await render(foreground, 'adaptive-foreground.png', 1024);
await render(background, 'adaptive-background.png', 1024);
await render(splash, 'splash.png', 1024);
await render(notification, 'notification-icon.png', 96);
await render(fullBleed, 'favicon.png', 48);
console.log('done');
