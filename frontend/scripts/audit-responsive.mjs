/**
 * Measures every route at phone, tablet and desktop widths and reports layout faults.
 *
 * Run against a local preview of the built app:
 *   npm run build && npx vite preview --port 4173 &
 *   node scripts/audit-responsive.mjs http://localhost:4173
 *
 * It looks for the things that actually make an interface feel broken on a phone — the page
 * scrolling sideways, controls too small to hit, text below the legible floor, and anything
 * poking out past the viewport — rather than diffing screenshots, which flags every harmless
 * pixel and nothing you can act on.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.argv[2] ?? 'http://localhost:4173';

const WIDTHS = [
  { name: 'phone-sm', width: 360, height: 780 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'phone-lg', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'wide', width: 1680, height: 950 },
];

const ROUTES = ['/', '/discover', '/moments', '/wardrobe', '/dashboard', '/create', '/login', '/register', '/forgot-password'];

const MIN_TAP = 40; // CSS px; Apple says 44, Google 48 — 40 is the "definitely too small" line
const MIN_FONT = 12;

const findings = [];

const browser = await chromium.launch();

for (const vp of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.width < 768,
    hasTouch: vp.width < 768,
  });
  const page = await context.newPage();

  for (const route of ROUTES) {
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 20000 });
    } catch {
      findings.push({ route, vp: vp.name, kind: 'load', detail: 'page did not settle' });
      continue;
    }
    await page.waitForTimeout(400);

    const result = await page.evaluate(
      ({ MIN_TAP, MIN_FONT }) => {
        const out = { overflow: null, offenders: [], smallTaps: [], smallText: [], fixedOverlap: [] };
        const doc = document.documentElement;

        if (doc.scrollWidth > doc.clientWidth + 1) {
          out.overflow = { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
          // Find what is actually sticking out, ignoring anything in its own scroller.
          const vw = doc.clientWidth;
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.right <= vw + 1 && r.left >= -1) continue;
            let p = el.parentElement, inScroller = false;
            while (p && p !== document.body) {
              const ov = getComputedStyle(p).overflowX;
              if (ov === 'auto' || ov === 'scroll') { inScroller = true; break; }
              p = p.parentElement;
            }
            if (inScroller) continue;
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed') continue;
            out.offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className || '').toString().slice(0, 60),
              left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
            });
          }
          out.offenders = out.offenders.slice(0, 6);
        }

        const coarse = matchMedia('(pointer: coarse)').matches;
        const seen = new Set();
        for (const el of coarse ? document.querySelectorAll('button, a, input, select, textarea, [role="tab"], [role="button"]') : []) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          // A checkbox or radio inside a label is tapped via the label, so judge the label.
          const wrap = el.closest('label');
          if (wrap && (el.tagName === 'INPUT') && wrap.getBoundingClientRect().height >= MIN_TAP) continue;
          const inProse = !!el.closest('p') || (el.tagName === 'A' && getComputedStyle(el).display.includes('inline'));
          const floor = inProse ? 24 : MIN_TAP; // inline links just need padding, not a 44px block
          const key = `${el.tagName}.${(el.className || '').toString().slice(0, 30)}`;
          if ((r.height < floor || r.width < floor) && !seen.has(key)) {
            seen.add(key);
            out.smallTaps.push({ tag: el.tagName.toLowerCase(), cls: key.slice(0, 55), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent || '').trim().slice(0, 24) });
          }
        }
        out.smallTaps = out.smallTaps.slice(0, 8);

        const fseen = new Set();
        for (const el of document.querySelectorAll('body *')) {
          if (!el.childNodes.length) continue;
          const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 3);
          if (!hasText) continue;
          const size = parseFloat(getComputedStyle(el).fontSize);
          const key = (el.className || '').toString().slice(0, 40) || el.tagName;
          if (size && size < MIN_FONT && !fseen.has(key)) {
            fseen.add(key);
            out.smallText.push({ cls: key, px: +size.toFixed(1), text: el.textContent.trim().slice(0, 28) });
          }
        }
        out.smallText = out.smallText.slice(0, 6);

        return out;
      },
      { MIN_TAP, MIN_FONT },
    );

    if (result.overflow) findings.push({ route, vp: vp.name, kind: 'overflow', detail: `${result.overflow.scrollWidth}px in ${result.overflow.clientWidth}px`, offenders: result.offenders });
    for (const t of result.smallTaps) findings.push({ route, vp: vp.name, kind: 'tap', detail: `${t.w}x${t.h} "${t.text}"`, cls: t.cls });
    for (const t of result.smallText) findings.push({ route, vp: vp.name, kind: 'text', detail: `${t.px}px "${t.text}"`, cls: t.cls });
  }

  await context.close();
}

await browser.close();

/* ── report ──────────────────────────────────────────────────────────────── */
const byKind = findings.reduce((a, f) => ((a[f.kind] = (a[f.kind] ?? 0) + 1), a), {});
console.log(`\n${findings.length} findings:`, byKind, '\n');

for (const kind of ['load', 'overflow', 'tap', 'text']) {
  const rows = findings.filter((f) => f.kind === kind);
  if (!rows.length) continue;
  console.log(`── ${kind} ──`);
  const grouped = new Map();
  for (const r of rows) {
    const key = `${r.route} :: ${r.cls ?? ''} :: ${r.detail}`;
    if (!grouped.has(key)) grouped.set(key, { ...r, vps: [] });
    grouped.get(key).vps.push(r.vp);
  }
  for (const g of grouped.values()) {
    console.log(`  ${g.route.padEnd(18)} ${g.vps.join(',').padEnd(34)} ${g.detail}${g.cls ? '  ' + g.cls : ''}`);
    for (const o of g.offenders ?? []) console.log(`      ↳ <${o.tag} class="${o.cls}"> ${o.left}→${o.right} (w ${o.width})`);
  }
  console.log('');
}
