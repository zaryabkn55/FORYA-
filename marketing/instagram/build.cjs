/**
 * FORya · Instagram starter pack.
 *
 * Every asset is HTML rendered by Chromium at Instagram's exact pixel size (deviceScaleFactor 1),
 * using the brand's own faces and the app's own imagery from frontend/public/images.
 *
 *   node marketing/instagram/build.cjs        → marketing/instagram/pack/**.png
 *
 * Grid posts are 1080x1350 (4:5) but the profile grid shows them cropped to 3:4, which takes
 * ~34px off each side — nothing important sits within 80px of either edge.
 * Stories keep the top 250px and bottom 340px clear of text; Instagram's own UI lives there.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT  = path.resolve(__dirname, '../..');
const IMG   = path.join(ROOT, 'frontend/public/images');
const OUT   = path.join(__dirname, 'pack');
const TMP   = path.join(__dirname, '.tmp');
const FONTS = process.env.FORYA_FONTS ||
  path.join(__dirname, 'fonts');

// One palette: charcoal on white. Greys are tints of the same ink, for secondary text and rules only.
const C = { ink:'#1A1A1A', soft:'#3A3A3A', peb:'#666666', stone:'#8A8A8A', line:'#E3E3E3',
  well:'#F4F4F4', white:'#FFFFFF' };

const CUT = path.join(__dirname, 'cutouts');
// Product shots use the lifted cut-outs (see cutouts.py); editorial photographs use the originals.
const img = n => fs.existsSync(path.join(CUT, n + '.png')) ? 'file://' + path.join(CUT, n + '.png')
                                                          : 'file://' + path.join(IMG, n + '.webp');

// ── fonts, written once and linked from every page ───────────────────────────
function fontsCss() {
  const face = (pkg, f, fam, w, st = 'normal') =>
    `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};font-display:block;` +
    `src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FONTS, pkg, 'files', f)).toString('base64')}) format('woff2')}`;
  return [
    face('bricolage-grotesque','bricolage-grotesque-latin-400-normal.woff2','BG',400),
    face('bricolage-grotesque','bricolage-grotesque-latin-500-normal.woff2','BG',500),
    face('bricolage-grotesque','bricolage-grotesque-latin-600-normal.woff2','BG',600),
    face('bricolage-grotesque','bricolage-grotesque-latin-700-normal.woff2','BG',700),
    face('bricolage-grotesque','bricolage-grotesque-latin-800-normal.woff2','BG',800),
    face('instrument-serif','instrument-serif-latin-400-italic.woff2','IS',400,'italic'),
    face('geist-mono','geist-mono-latin-500-normal.woff2','GM',500),
  ].join('\n');
}

const BASE = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{overflow:hidden;background:#fff;-webkit-font-smoothing:antialiased}
.a{position:relative;overflow:hidden;font-family:'BG',Helvetica,Arial,sans-serif;color:${C.ink};background:#fff}

/* The lockup — one colour, both halves. Sized through a variable so no inherited rule can shrink one half. */
.wm{display:inline-flex;align-items:baseline;white-space:nowrap;line-height:1;color:${C.ink}}
.wm .f{font-family:'BG';font-weight:800;letter-spacing:-.06em;font-size:var(--s)}
.wm .y{font-family:'IS';font-style:italic;font-weight:400;letter-spacing:-.02em;padding-left:.02em;font-size:var(--s)}

.h{font-family:'BG';font-weight:700;letter-spacing:-.042em;line-height:.98}
.h em{font-family:'IS';font-style:italic;font-weight:400;letter-spacing:-.016em}
.eb{font-family:'GM';font-weight:500;text-transform:uppercase;letter-spacing:.22em;font-size:21px;color:${C.peb}}
.sub{font-size:34px;line-height:1.42;color:${C.peb};letter-spacing:-.005em}
.mono{font-family:'GM';font-weight:500;text-transform:uppercase;letter-spacing:.2em;font-size:20px;color:${C.peb}}

/* masthead: the same header on every asset — label left, wordmark right, a charcoal rule beneath */
.mast{position:absolute;display:flex;justify-content:space-between;align-items:flex-end;
  padding-bottom:22px;border-bottom:2px solid ${C.ink}}

/* Monochrome imagery: photographs and garments are shown in black and white. */
.g{display:flex;align-items:center;justify-content:center;overflow:hidden}
.g img{width:100%;height:100%;object-fit:contain;filter:grayscale(1) contrast(1.05)}
.bw{filter:grayscale(1) contrast(1.06)}
.photo{position:absolute;object-fit:cover;filter:grayscale(1) contrast(1.06)}
.well{border:2px solid ${C.line};background:#fff}

.pill{display:inline-block;white-space:nowrap;font-weight:600;border-radius:999px;border:2px solid ${C.ink}}
.pill.on{background:${C.ink};color:#fff}
.pill.off{background:#fff;color:${C.ink}}

/* phone */
.phone{position:absolute;width:390px;height:844px;border-radius:58px;background:#fff;
  box-shadow:0 0 0 11px ${C.ink},0 40px 90px -30px rgba(26,26,26,.4);overflow:hidden;transform-origin:top left}
.sb{position:absolute;left:0;right:0;top:0;height:54px}
.sb .t{position:absolute;left:34px;top:18px;font-weight:600;font-size:15px}
.sb .isl{position:absolute;left:136px;top:11px;width:118px;height:34px;border-radius:17px;background:#000}
.sb .sys{position:absolute;right:30px;top:19px;display:flex;gap:6px;align-items:center}
.sb .bars{display:flex;gap:2.5px;align-items:flex-end}
.sb .bars i{display:block;width:3px;border-radius:1px;background:currentColor}
.sb .bat{width:24px;height:12px;border:1.3px solid currentColor;border-radius:3.5px;padding:1.6px}
.sb .bat i{display:block;height:100%;width:72%;background:currentColor;border-radius:1.5px}
.phone .pill{border-width:1.2px}
`;

function statusbar(col) {
  return `<div class="sb" style="color:${col}"><div class="t">9:41</div><div class="isl"></div>
    <div class="sys"><span class="bars"><i style="height:5px"></i><i style="height:8px"></i><i style="height:11px"></i><i style="height:14px"></i></span>
    <span class="bat"><i></i></span></div></div>`;
}
const wm = px => `<span class="wm" style="--s:${px}px"><span class="f">FOR</span><span class="y">ya</span></span>`;
const svg = (d, size, col, sw) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="${sw || 1.7}" stroke-linecap="round" stroke-linejoin="round">${d.map(p => `<path d="${p}"/>`).join('')}</svg>`;

// Masthead. Feed posts sit it 88px in; stories drop it below Instagram's top controls.
const mast = (label, { story = false, mark = true } = {}) => {
  const x = story ? 96 : 88, y = story ? 270 : 80;
  return `<div class="mast" style="left:${x}px;right:${x}px;top:${y}px">
    <span class="eb">${label}</span>${mark ? wm(story ? 40 : 36) : ''}</div>`;
};
const arrowR = ['M5 12h13', 'M13 6.5 18.5 12 13 17.5'];

// ═══════════════════════════════════════════════════════════════════════════
const ASSETS = [];
const add = (file, w, h, body, extra = '') =>
  ASSETS.push({ file, w, h, html: `<div class="a" style="width:${w}px;height:${h}px">${body}</div>`, extra });

// ── 01 · profile picture ───────────────────────────────────────────────────
// The wordmark alone, charcoal on white, centred optically for the circle crop.
add('01-profile/profile-picture.png', 1080, 1080, `
  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding-bottom:28px">
    ${wm(262)}
  </div>`);

// ── 02 · highlight covers ──────────────────────────────────────────────────
// Instagram shows the centre of a 1080x1920 frame as a circle; one line icon, one weight, no words.
const HI = [
  ['start-here', arrowR],
  ['moments',    [ 'M4 6h16v15H4z', 'M4 10.5h16', 'M8.5 3v4', 'M15.5 3v4' ]],
  ['wardrobe',   [ 'M12 5.6a1.9 1.9 0 1 1 1.7 1.9v1.5', 'M13.7 9 21 15.8H3L10.3 9' ]],
  ['looks',      [ 'M9 3.5 4.5 5.5 2.5 11l3 1.3 1-2.2V20.5h11V10.1l1 2.2 3-1.3-2-5.5L15 3.5c-.6 1.5-1.7 2.3-3 2.3s-2.4-.8-3-2.3Z' ]],
  ['creators',   [ 'M3.5 8h4l1.6-2.5h5.8L16.5 8h4v11.5h-17z', 'M12 16.7a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z' ]],
  ['faq',        [ 'M9.3 9.2a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.2 1-1.2 1.9v.6', 'M12 17.6v.1', 'M12 21.5a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19Z' ]],
];
HI.forEach(([name, d], i) => add(`02-highlights/highlight-${String(i + 1).padStart(2, '0')}-${name}.png`, 1080, 1920, `
  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
    ${svg(d, 500, C.ink, 1.3)}</div>`));

// ── 03 · launch grid — nine posts, numbered in posting order ───────────────
// As the profile shows it (newest top-left):
//   09 hero (type)      08 flat-lay           07 cocktail photo
//   06 Home UI          05 how it works (type) 04 workday photo
//   03 gallery photo    02 cut-out UI          01 hello (type)
// Type tiles on the diagonal, photographs on the corners, product and UI between.

const P = (n, slug) => `03-grid/${String(n).padStart(2, '0')}-${slug}.png`;

// Framed photograph with a caption beneath — the editorial Moment post.
const momentPost = (photo, pos, title, meta) => `
  ${mast('Moment')}
  <img class="photo" src="${img(photo)}" style="left:88px;top:180px;width:904px;height:920px;object-position:${pos}">
  <div style="position:absolute;left:88px;right:88px;top:1136px;display:flex;justify-content:space-between;align-items:baseline">
    <span class="h" style="font-size:54px;letter-spacing:-.035em">${title}</span>
    <span class="mono" style="font-size:20px">${meta}</span></div>`;

// 01 · hello
add(P(1, 'hello'), 1080, 1350, `
  ${mast('Hello', { mark: false })}
  <div style="position:absolute;left:88px;top:400px">${wm(230)}</div>
  <div class="h" style="position:absolute;left:88px;top:690px;width:860px;font-size:76px;line-height:1.04">
    Plan what you’ll wear, <em>before you wear it.</em></div>
  <div class="mono" style="position:absolute;left:88px;bottom:88px">An outfit planner for real plans</div>`);

// 02 · cut-out happens on your phone
function cutoutScreen() {
  return `<div class="phone" style="left:0;top:0">${statusbar(C.ink)}
    <div style="position:absolute;left:20px;top:64px;display:flex;align-items:center;gap:10px">
      ${svg(['M15 5l-7 7 7 7'], 22, C.ink, 2)}<span style="font-weight:700;font-size:16px">New owned piece</span></div>
    <div style="position:absolute;left:20px;right:20px;top:120px;height:420px;border-radius:22px;background:${C.well};overflow:hidden">
      <div style="position:absolute;inset:34px 40px 70px;display:flex;align-items:center;justify-content:center">
        <img class="bw" src="${img('cashmereCrew')}" style="max-width:100%;max-height:100%;object-fit:contain;filter:grayscale(1) contrast(1.05) drop-shadow(0 18px 22px rgba(0,0,0,.18))"></div>
      <div style="position:absolute;left:50%;bottom:22px;transform:translateX(-50%);display:flex;align-items:center;gap:9px;
        background:#fff;border:1px solid ${C.line};border-radius:999px;padding:9px 16px;color:${C.soft};font-size:13px;white-space:nowrap">
        <i style="width:8px;height:8px;border-radius:50%;background:${C.ink};display:block"></i>Lifting the garment…</div>
    </div>
    <div style="position:absolute;left:20px;right:20px;top:560px;border-radius:15px;border:1px solid ${C.line};
      padding:14px 16px;display:flex;align-items:center;gap:11px;font-size:13.5px;line-height:1.35">
      <span style="width:22px;height:22px;border-radius:50%;background:${C.ink};display:flex;align-items:center;justify-content:center;flex:none">
        ${svg(['M5 12.5 10 17.5 19 7'], 14, '#fff', 3)}</span>
      This runs on your phone. The photo is not uploaded.</div>
  </div>`;
}
add(P(2, 'cut-out-on-your-phone'), 1080, 1350, `
  ${mast('Your wardrobe')}
  <div class="h" style="position:absolute;left:88px;top:210px;font-size:104px">Photograph it <em>once.</em></div>
  <div class="sub" style="position:absolute;left:88px;top:336px;width:820px">The cut-out happens on your phone, and the piece joins every look after it.</div>
  <div style="position:absolute;left:${(1080 - 390 * 1.3) / 2}px;top:520px;transform:scale(1.3);transform-origin:top left;width:390px;height:844px">
    ${cutoutScreen()}</div>`);

// 03 · Gallery, Saturday
add(P(3, 'moment-gallery-saturday'), 1080, 1350, momentPost('edWeekend', '50% 35%', 'Gallery, Saturday', 'Sat 12:00 · 14°'));
// 04 · Back to the office
add(P(4, 'moment-back-to-the-office'), 1080, 1350, momentPost('edWorkday', '50% 40%', 'Back to the office', 'Mon 8:40 · 9°'));

// 05 · how it works — a five-slide carousel
add(P(5, 'how-it-works-1-cover'), 1080, 1350, `
  ${mast('How it works')}
  <div class="h" style="position:absolute;left:88px;top:230px;width:900px;font-size:118px">
    Three questions. <em>One complete look.</em></div>
  <div style="position:absolute;left:88px;top:640px;width:904px;display:flex;flex-direction:column">
    ${[['01', 'Tell us the Moment'], ['02', 'We check the weather and your wardrobe'], ['03', 'You get the whole look']]
      .map(([n, t]) => `<div style="display:flex;gap:34px;align-items:baseline;padding:28px 0;border-top:2px solid ${C.line}">
        <span class="mono" style="font-size:22px">${n}</span><span style="font-size:40px;letter-spacing:-.02em">${t}</span></div>`).join('')}
  </div>
  <div style="position:absolute;right:88px;bottom:88px;display:flex;gap:14px;align-items:center;font-size:30px;font-weight:600">
    Swipe ${svg(arrowR, 34, C.ink, 2)}</div>`);

const field = (label, value, w) => `<div style="width:${w}px">
  <div style="font-weight:600;font-size:26px;color:${C.soft};margin-bottom:12px">${label}</div>
  <div style="border:2px solid ${C.line};border-radius:22px;padding:24px 28px;font-size:32px;background:#fff;letter-spacing:-.01em">${value}</div></div>`;

add(P(5, 'how-it-works-2-moment'), 1080, 1350, `
  ${mast('01 · The Moment')}
  <div class="h" style="position:absolute;left:88px;top:210px;font-size:96px">Tell us the <em>Moment.</em></div>
  <div class="sub" style="position:absolute;left:88px;top:326px;width:860px">What it is, where and when. Dress code if there is one.</div>
  <div style="position:absolute;left:88px;top:480px;display:flex;flex-direction:column;gap:30px">
    ${field('What is it?', 'Dinner at Clos Maggiore', 904)}
    ${field('Where', 'Covent Garden, London', 904)}
    <div style="display:flex;gap:24px">${field('Date', 'Fri 14 Nov', 440)}${field('Time', '7:30pm', 440)}</div>
    ${field('Dress code', 'Smart, no tie', 904)}
  </div>`);

const tagged = (name, tag, on) => `<div style="display:flex;flex-direction:column;gap:16px">
  <div class="g well" style="width:280px;height:320px;border-radius:26px;padding:34px"><img src="${img(name)}"></div>
  <span class="pill ${on ? 'on' : 'off'}" style="align-self:flex-start;font-size:23px;padding:7px 18px">${tag}</span></div>`;

add(P(5, 'how-it-works-3-weather-wardrobe'), 1080, 1350, `
  ${mast('02 · Weather & wardrobe')}
  <div class="h" style="position:absolute;left:88px;top:210px;width:920px;font-size:88px">We check the weather<br><em>and your wardrobe.</em></div>
  <div style="position:absolute;left:88px;top:440px;width:904px;border-radius:26px;border:2px solid ${C.line};
    padding:28px 34px;display:flex;align-items:center;gap:26px">
    ${svg(['M7 17.5h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.6 1.2A3.4 3.4 0 0 0 7 17.5Z'], 54, C.ink, 1.6)}
    <div><div style="font-weight:700;font-size:36px;letter-spacing:-.02em">8°, dry after dark</div>
    <div style="font-size:27px;color:${C.peb};margin-top:4px">Fri 7:30pm · Covent Garden</div></div></div>
  <div class="eb" style="position:absolute;left:88px;top:650px">From your wardrobe</div>
  <div style="position:absolute;left:88px;top:706px;display:flex;gap:32px">
    ${tagged('navyBlazer', 'Yours', 1)}${tagged('stoneChinos', 'Yours', 1)}${tagged('suedeLoafers', 'Yours', 1)}</div>`);

add(P(5, 'how-it-works-4-the-look'), 1080, 1350, `
  ${mast('03 · The look')}
  <div class="h" style="position:absolute;left:88px;top:210px;font-size:96px">You get the <em>whole look.</em></div>
  <div style="position:absolute;left:88px;top:360px;display:grid;grid-template-columns:repeat(2,436px);gap:32px">
    ${[['navyBlazer', 'Yours', 1], ['oxfordShirt', 'To shop · £24', 0], ['stoneChinos', 'Yours', 1], ['suedeLoafers', 'Yours', 1]]
      .map(([n, t, on]) => `<div style="position:relative">
        <div class="g well" style="width:436px;height:340px;border-radius:28px;padding:30px"><img src="${img(n)}"></div>
        <span class="pill ${on ? 'on' : 'off'}" style="position:absolute;left:20px;bottom:20px;font-size:22px;padding:6px 16px">${t}</span></div>`).join('')}</div>
  <div style="position:absolute;left:88px;right:88px;bottom:88px;display:flex;justify-content:space-between;align-items:baseline;
    border-top:2px solid ${C.ink};padding-top:26px">
    <span style="font-size:32px;color:${C.peb}">3 yours · 1 to shop</span>
    <span style="font-size:44px;font-weight:700;letter-spacing:-.03em">£24 new</span></div>`);

add(P(5, 'how-it-works-5-end'), 1080, 1350, `
  ${mast('Your turn')}
  <div class="h" style="position:absolute;left:88px;top:470px;width:900px;font-size:128px">
    Plan your next <em>Moment.</em></div>
  <div style="position:absolute;left:88px;bottom:88px;display:flex;align-items:center;gap:14px;font-size:32px;font-weight:600">
    Link in bio ${svg(['M7 17 17 7', 'M9 7h8v8'], 34, C.ink, 2)}</div>`);

// 06 · Home: the next Moment, already dressed
function homeScreen() {
  const piece = n => `<div class="g" style="flex:1;height:96px;border-radius:12px;background:${C.well};padding:10px"><img src="${img(n)}"></div>`;
  const row = (t, s, tag, on) => `<div style="border:1px solid ${C.line};border-radius:15px;padding:14px 16px;
      display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div><div style="font-weight:600;font-size:15px">${t}</div>
        <div style="font-size:12.5px;color:${C.peb};margin-top:3px">${s}</div></div>
      <span class="pill ${on ? 'on' : 'off'}" style="font-size:11.5px;padding:4px 10px">${tag}</span></div>`;
  return `<div class="phone" style="left:0;top:0">${statusbar(C.ink)}
    <div style="position:absolute;left:24px;top:72px">${wm(27)}</div>
    <div style="position:absolute;right:22px;top:68px;display:flex;flex-direction:column;align-items:center;gap:2px">
      ${svg(['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4.5 20.5a7.5 7.5 0 0 1 15 0'], 21, C.ink, 1.7)}
      <span style="font-size:11px">Profile</span></div>
    <div style="position:absolute;left:24px;top:142px;font-weight:700;font-size:22px;letter-spacing:-.02em">Your next Moment</div>
    <div style="position:absolute;left:22px;right:22px;top:182px;border:1px solid ${C.line};border-radius:18px;overflow:hidden">
      <div style="padding:16px 16px 14px;display:flex;justify-content:space-between;gap:8px">
        <div><div style="font-weight:700;font-size:19px;letter-spacing:-.02em;line-height:1.15">Dinner at Clos Maggiore</div>
          <div style="font-size:13px;color:${C.peb};margin-top:4px">Fri 14 Nov · 7:30pm · Covent Garden</div></div>
        <span class="pill on" style="align-self:flex-start;font-size:12px;padding:4px 10px">Ready to wear</span></div>
      <div style="display:flex;gap:7px;padding:0 16px 14px">${piece('navyBlazer')}${piece('oxfordShirt')}${piece('stoneChinos')}${piece('suedeLoafers')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-top:1px solid ${C.line}">
        <span style="font-size:13px;color:${C.peb}">3 yours · 1 to shop</span>
        <span style="font-size:15px;font-weight:600">£24</span></div>
    </div>
    <div style="position:absolute;left:22px;right:22px;top:420px;border-radius:13px;background:${C.ink};color:#fff;
      text-align:center;padding:15px;font-weight:600;font-size:16px">Open the look</div>
    <div style="position:absolute;left:24px;top:500px;font-family:'GM';font-size:10px;letter-spacing:.16em;color:${C.stone}">COMING UP</div>
    <div style="position:absolute;left:22px;right:22px;top:522px">
      ${row('Sunday lunch', 'Sun 16 Nov · 1:00pm · Richmond', 'Look planned', 0)}
      ${row('Interview, Thursday', 'Thu 20 Nov · 9:30am · King’s Cross', 'Plan it', 0)}</div>
  </div>`;
}
add(P(6, 'next-moment-already-dressed'), 1080, 1350, `
  ${mast('Home')}
  <div class="h" style="position:absolute;left:88px;top:210px;width:900px;font-size:92px">Your next Moment, <em>already dressed.</em></div>
  <div style="position:absolute;left:${(1080 - 390 * 1.3) / 2}px;top:540px;transform:scale(1.3);transform-origin:top left;width:390px;height:844px">
    ${homeScreen()}</div>`);

// 07 · Cocktail hour
add(P(7, 'moment-cocktail-hour'), 1080, 1350, momentPost('edCocktail', '50% 35%', 'Cocktail hour', 'Fri 7:30pm · 11°'));

// 08 · the look, before you leave — a flat-lay
add(P(8, 'the-look-before-you-leave'), 1080, 1350, `
  ${mast('Cocktail hour · Fri 7:30pm')}
  <div class="g" style="position:absolute;left:70px;top:200px;width:460px;height:540px"><img src="${img('tuxedoBlazer')}"></div>
  <div class="g" style="position:absolute;left:560px;top:190px;width:440px;height:580px"><img src="${img('slipDress')}"></div>
  <div class="g" style="position:absolute;left:130px;top:760px;width:320px;height:260px"><img src="${img('shoulderBag')}"></div>
  <div class="g" style="position:absolute;left:610px;top:790px;width:310px;height:250px"><img src="${img('suedeHeelBoots')}"></div>
  <div class="h" style="position:absolute;left:88px;bottom:92px;font-size:90px">The look, <em>before you leave.</em></div>`);

// 09 · hero
add(P(9, 'youve-got-plans'), 1080, 1350, `
  ${mast('Now open')}
  <div class="h" style="position:absolute;left:88px;top:420px;width:920px;font-size:116px;line-height:.98;white-space:nowrap">
    You’ve got plans.<br><em>We’ve got the look.</em></div>
  <div style="position:absolute;left:88px;right:88px;bottom:88px;display:flex;justify-content:space-between;align-items:center">
    <span class="mono">Outfit planner</span><span class="mono" style="color:${C.ink}">Link in bio</span></div>`);

// ── 04 · story templates ───────────────────────────────────────────────────
// Clear space is left where each sticker goes; nothing is drawn there, so nothing has to be removed.
const S = { story: true };
add('04-stories/story-launch.png', 1080, 1920, `
  ${mast('Now open', { story: true, mark: false })}
  <div style="position:absolute;left:96px;top:620px">${wm(230)}</div>
  <div class="h" style="position:absolute;left:96px;top:900px;width:890px;font-size:82px;line-height:1.04">
    Plan what you’ll wear, <em>before you wear it.</em></div>
  <div style="position:absolute;left:96px;top:1350px;display:flex;align-items:center;gap:14px;font-size:34px;font-weight:600">
    Tap the link ${svg(['M12 5v14', 'M6 13l6 6 6-6'], 38, C.ink, 2)}</div>`);

add('04-stories/story-ask-us-anything.png', 1080, 1920, `
  ${mast('Questions', S)}
  <div class="h" style="position:absolute;left:96px;top:390px;width:890px;font-size:150px">Ask us <em>anything.</em></div>
  <div class="sub" style="position:absolute;left:96px;top:720px;width:860px">About the app, a Moment you’re dressing for, or what goes with what.</div>
  <div class="g" style="position:absolute;right:80px;bottom:350px;width:280px;height:280px"><img src="${img('cashmereScarf')}"></div>`);

add('04-stories/story-this-or-that.png', 1080, 1920, `
  ${mast('Friday dinner', S)}
  <div class="h" style="position:absolute;left:96px;top:390px;font-size:150px">This <em>or</em> that?</div>
  <div style="position:absolute;left:96px;top:660px;display:flex;gap:30px">
    <div class="g well" style="width:429px;height:520px;border-radius:34px;padding:46px"><img src="${img('suedeLoafers')}"></div>
    <div class="g well" style="width:429px;height:520px;border-radius:34px;padding:46px"><img src="${img('suedeChelsea')}"></div></div>
  <div class="mono" style="position:absolute;left:96px;top:1216px">Vote below</div>`);

add('04-stories/story-countdown.png', 1080, 1920, `
  ${mast('Soon', { story: true, mark: false })}
  <div class="h" style="position:absolute;left:96px;top:390px;width:890px;font-size:150px">Something’s <em>coming.</em></div>
  <div style="position:absolute;left:96px;bottom:400px">${wm(96)}</div>`);

// ── 05 · reel cover ────────────────────────────────────────────────────────
// The grid shows a 3:4 crop from the middle (y 240–1680), so photo and title both sit inside it.
add('05-reel-cover/reel-cover.png', 1080, 1920, `
  ${mast('Moment', S)}
  <img class="photo" src="${img('edParty')}" style="left:96px;top:360px;width:888px;height:820px;object-position:50% 30%">
  <div class="h" style="position:absolute;left:96px;right:96px;top:1250px;font-size:132px">Saturday, <em>sorted.</em></div>`);


// ── 00 · profile preview ───────────────────────────────────────────────────
// How the account reads once it's set up, built from the finished files: avatar, bio, the
// highlight row, and the grid at the 3:4 crop the profile actually uses. A generic layout,
// deliberately not Instagram's own chrome.
function preview() {
  const f = rel => 'file://' + path.join(OUT, rel);
  const order = ['09-youve-got-plans', '08-the-look-before-you-leave', '07-moment-cocktail-hour',
    '06-next-moment-already-dressed', '05-how-it-works-1-cover', '04-moment-back-to-the-office',
    '03-moment-gallery-saturday', '02-cut-out-on-your-phone', '01-hello'];
  const hl = [['01-start-here', 'Start here'], ['02-moments', 'Moments'], ['03-wardrobe', 'Wardrobe'],
    ['04-looks', 'Looks'], ['05-creators', 'Creators'], ['06-faq', 'FAQ']];
  return `<div class="a" style="width:1080px;height:2398px">
    <div style="position:absolute;left:0;right:0;top:0;height:120px;border-bottom:1px solid ${C.line};
      display:flex;align-items:center;justify-content:center;font-weight:700;font-size:34px;letter-spacing:-.02em">forya</div>
    <img src="${f('01-profile/profile-picture.png')}" style="position:absolute;left:56px;top:170px;width:230px;height:230px;border-radius:50%;border:2px solid ${C.line}">
    <div style="position:absolute;left:330px;top:205px;right:56px">
      <div style="font-weight:700;font-size:38px;letter-spacing:-.02em">FORya | Outfit planner</div>
      <div style="font-size:28px;color:${C.stone};margin-top:6px">App page</div></div>
    <div style="position:absolute;left:56px;top:440px;right:56px;font-size:31px;line-height:1.42;letter-spacing:-.005em">
      Plan what you’ll wear, before you wear it.<br>
      Outfits built around your Moments, the weather and your own wardrobe.<br>
      Plan yours ↓<br>
      <span style="font-weight:600;text-decoration:underline;text-underline-offset:5px">forya.onrender.com</span></div>
    <div style="position:absolute;left:40px;right:40px;top:700px;display:flex;justify-content:space-between">
      ${hl.map(([k, l]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:14px;width:150px">
        <div style="width:138px;height:138px;border-radius:50%;padding:6px;border:2px solid ${C.line}">
          <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;
            background:url(${f('02-highlights/highlight-' + k + '.png')}) center/cover"></div></div>
        <span style="font-size:24px">${l}</span></div>`).join('')}</div>
    <div style="position:absolute;left:0;right:0;top:950px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px">
      ${order.map(n => `<div style="aspect-ratio:3/4;background:url(${f('03-grid/' + n + '.png')}) center/cover"></div>`).join('')}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  const fontFile = path.join(TMP, 'fonts.css');
  fs.writeFileSync(fontFile, fontsCss());
  const b = await chromium.launch();
  const page = await b.newPage({ deviceScaleFactor: 1 });
  for (const a of ASSETS) {
    const out = path.join(OUT, a.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const htmlFile = path.join(TMP, 'page.html');
    fs.writeFileSync(htmlFile, `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="file://${fontFile}">
      <style>${BASE}${a.extra}</style>${a.html}`);
    await page.setViewportSize({ width: a.w, height: a.h });
    await page.goto('file://' + htmlFile, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    const broken = await page.evaluate(() => [...document.images].filter(i => !i.naturalWidth).map(i => i.src.split('/').pop()));
    if (broken.length) throw new Error(`${a.file}: images failed to load: ${broken.join(', ')}`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: a.w, height: a.h } });
  }
  // the preview is drawn from the finished files, so it goes last
  const pv = path.join(TMP, 'preview.html');
  fs.writeFileSync(pv, `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="file://${fontFile}"><style>${BASE}</style>${preview()}`);
  await page.setViewportSize({ width: 1080, height: 2398 });
  await page.goto('file://' + pv, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '00-profile-preview.png'), clip: { x: 0, y: 0, width: 1080, height: 2398 } });
  await b.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`  ${ASSETS.length} assets → ${path.relative(ROOT, OUT)}`);
})();
