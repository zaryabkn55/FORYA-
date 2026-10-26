// Render the FORYA mark to the PNG sizes the PWA manifest and the native projects need.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

// Playwright may be installed globally rather than in this project, so resolve it through
// require (which honours NODE_PATH) instead of a bare ESM import.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const OUT = '/home/claude/work/FORYA/frontend/public/icons';
mkdirSync(OUT, { recursive: true });

const INK = '#2E2D2B';
const PAPER = '#F6F5F2';
const SAND = '#E8DFD0';

// The mark itself. `inset` leaves the safe area a maskable icon needs: Android may crop to a
// circle, so the wordmark sits inside the middle 72% and the background runs full bleed.
const mark = (size, { rounded, inset }) => {
  const r = rounded ? size * 0.22 : 0;
  const scale = inset ? 0.62 : 0.84;
  const w = size * scale;
  const fs = w * 0.345;
  const y = size / 2 + fs * 0.35;
  const x = (size - w) / 2;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${r}" fill="${INK}"/>
    <text x="${x}" y="${y}" font-family="Helvetica,Arial,sans-serif" font-weight="800"
          font-size="${fs}" letter-spacing="${-fs * 0.07}" fill="${PAPER}">FOR</text>
    <text x="${x + w * 0.635}" y="${y}" font-family="Georgia,serif" font-style="italic"
          font-size="${fs * 0.92}" fill="${SAND}">ya</text>
  </svg>`;
};

const TARGETS = [
  ['icon-192.png', 192, { rounded: true, inset: false }],
  ['icon-512.png', 512, { rounded: true, inset: false }],
  ['icon-maskable-512.png', 512, { rounded: false, inset: true }],
  ['apple-touch-icon.png', 180, { rounded: false, inset: false }], // iOS applies its own mask
  ['icon-1024.png', 1024, { rounded: false, inset: false }],       // App Store / Play listing
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const [name, size, opts] of TARGETS) {
  const svg = mark(size, opts);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.waitForTimeout(120); // let the font settle before capture
  const buf = await page.screenshot({ omitBackground: false });
  writeFileSync(`${OUT}/${name}`, buf);
  console.log(`  ${name.padEnd(26)} ${size}x${size}  ${(buf.length / 1024).toFixed(1)} kB`);
}

await browser.close();
console.log('icons written to', OUT);
