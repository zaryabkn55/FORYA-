// FORya × ZIMA Atelier — one-to-one proposal email with an in-app simulation.
//   node marketing/email/zima/build.cjs
// Product photos in src/ are ZIMA Atelier's own (zimaatelier.com), used only to show ZIMA
// how its pieces would appear. Graphics go to frontend/public/email/zima/.

const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '../../..');
const CUT = path.join(ROOT, 'marketing/instagram/cutouts');
const FONTS = path.join(ROOT, 'marketing/instagram/fonts');
const SRC = path.join(__dirname, 'src');
const OUT = path.join(ROOT, 'frontend/public/email/zima');
const HOST = 'https://forya.onrender.com/email/';
const C = { ink: '#1A1A1A', soft: '#3A3A3A', peb: '#666666', stone: '#8A8A8A', line: '#E3E3E3', well: '#F4F4F4' };
const cut = n => 'file://' + path.join(CUT, n + '.png');
const z = n => 'file://' + path.join(SRC, n + '.jpg');

const face = (pkg, f, fam, w, st = 'normal') => `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FONTS, pkg, 'files', f)).toString('base64')}) format('woff2')}`;
const BASE = [
  face('bricolage-grotesque', 'bricolage-grotesque-latin-400-normal.woff2', 'BG', 400),
  face('bricolage-grotesque', 'bricolage-grotesque-latin-600-normal.woff2', 'BG', 600),
  face('bricolage-grotesque', 'bricolage-grotesque-latin-700-normal.woff2', 'BG', 700),
  face('bricolage-grotesque', 'bricolage-grotesque-latin-800-normal.woff2', 'BG', 800),
  face('instrument-serif', 'instrument-serif-latin-400-italic.woff2', 'IS', 400, 'italic'),
  face('geist-mono', 'geist-mono-latin-500-normal.woff2', 'GM', 500),
].join('') + `*{margin:0;padding:0;box-sizing:border-box}body{background:transparent}
.a{position:relative;overflow:hidden;font-family:'BG';color:${C.ink};background:#fff}
.wm{display:inline-flex;align-items:baseline;line-height:1}.wm .f{font-weight:800;letter-spacing:-.06em;font-size:var(--s)}.wm .y{font-family:'IS';font-style:italic;letter-spacing:-.02em;padding-left:.02em;font-size:var(--s)}
.eb{font-family:'GM';font-weight:500;text-transform:uppercase;letter-spacing:.18em;color:${C.peb}}
.em{font-family:'IS';font-style:italic;font-weight:400}
.g{display:flex;align-items:center;justify-content:center}.g img{max-width:100%;max-height:100%;object-fit:contain}
.ph{width:100%;height:100%;object-fit:cover;display:block}
.pill{display:inline-block;border-radius:999px;font-weight:600;white-space:nowrap}
.on{background:${C.ink};color:#fff}.off{background:#fff;color:${C.ink};border:1.4px solid ${C.ink}}
.phone{font-family:'BG';color:#1A1A1A;position:absolute;left:12px;top:12px;width:390px;height:780px;border-radius:52px;background:#fff;box-shadow:0 0 0 10px ${C.ink};overflow:hidden}
.isl{position:absolute;left:136px;top:11px;width:118px;height:32px;border-radius:16px;background:#000}
.sb{position:absolute;left:32px;top:17px;font-weight:600;font-size:14px}`;
const wm = px => `<span class="wm" style="--s:${px}px"><span class="f">FOR</span><span class="y">ya</span></span>`;
const svg = (d, s, col = C.ink, sw = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d.map(p => `<path d="${p}"/>`).join('')}</svg>`;

const G = [];
const SCREENS = [];
const phone = (file, inner) => SCREENS.push(inner) && G.push({ file, w: 414, h: 804, scale: 2, transparent: true, body: `<div style="position:relative;width:414px;height:804px"><div class="phone"><div class="isl"></div><div class="sb">9:41</div>${inner}</div></div>` });

// 01 · Home: the next Moment, with ZIMA in the look
const thumb = (src, isPhoto) => `<div style="flex:1;height:96px;border-radius:12px;background:${C.well};overflow:hidden;${isPhoto ? '' : 'padding:9px'}" class="${isPhoto ? '' : 'g'}"><img class="${isPhoto ? 'ph' : ''}" src="${src}" style="${isPhoto ? 'object-position:50% 30%' : ''}"></div>`;
phone('screen-1-moment.png', `
  <div style="position:absolute;left:24px;top:66px">${wm(26)}</div>
  <div style="position:absolute;left:24px;top:112px;font-size:13px;color:${C.peb}">Thursday 27 November</div>
  <div style="position:absolute;left:24px;top:132px;font-weight:700;font-size:28px;letter-spacing:-.035em">You’ve got <span class="em">plans.</span></div>
  <div style="position:absolute;left:20px;right:20px;top:186px;border:1px solid ${C.line};border-radius:18px;overflow:hidden">
    <div style="padding:15px 16px 12px;display:flex;justify-content:space-between;gap:8px">
      <div><div class="eb" style="font-size:10px">Sat 29 Nov · 3:00pm</div>
        <div style="font-weight:700;font-size:19px;letter-spacing:-.02em;margin-top:5px;line-height:1.15">Afternoon tea at<br>The Berkeley</div>
        <div style="font-size:12.5px;color:${C.peb};margin-top:4px">Knightsbridge · Smart</div></div>
      <div style="text-align:right"><div style="font-weight:700;font-size:22px">6°</div><div style="font-size:11.5px;color:${C.peb}">Clear, cold</div></div></div>
    <div style="display:flex;gap:7px;padding:0 16px 14px">${thumb(z('pink-tweed-swarovski'), 1)}${thumb(cut('slipDress'))}${thumb(cut('shoulderBag'))}${thumb(cut('suedeHeelBoots'))}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-top:1px solid ${C.line};font-size:12.5px">
      <span style="color:${C.peb}">3 yours · 1 from ZIMA Atelier</span><span class="pill on" style="font-size:11px;padding:4px 10px">Look planned</span></div></div>
  <div style="position:absolute;left:20px;right:20px;top:452px;border-radius:13px;background:${C.ink};color:#fff;text-align:center;padding:15px;font-weight:600;font-size:15px">Open your look →</div>
  <div style="position:absolute;left:20px;right:20px;top:528px;border-radius:14px;background:${C.well};padding:14px 16px;font-size:12.5px;line-height:1.45;color:${C.soft}">
    <b style="color:${C.ink}">Why a coat?</b> It’s 6° at 3pm and you’ll be walking from Knightsbridge station. Your wardrobe has no warm layer that suits a smart dress code.</div>
  <div class="eb" style="position:absolute;left:24px;top:650px;font-size:9.5px">Coming up</div>
  <div style="position:absolute;left:20px;right:20px;top:670px;border:1px solid ${C.line};border-radius:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center">
    <div><div style="font-weight:600;font-size:14px">Christmas drinks</div><div style="font-size:11.5px;color:${C.peb};margin-top:2px">Fri 12 Dec · 7pm · Mayfair</div></div>
    <span class="pill off" style="font-size:10.5px;padding:3px 9px">Plan it</span></div>`);

// 02 · The look canvas
const tile = (src, tag, on, photo, h = 250) => `<div style="position:relative;height:${h}px;border-radius:16px;border:1px solid ${C.line};overflow:hidden;background:${photo ? '#fff' : C.well}">
  ${photo ? `<img class="ph" src="${src}" style="object-position:50% 25%">` : `<div class="g" style="position:absolute;inset:16px 16px 38px"><img src="${src}"></div>`}
  <span class="pill ${on ? 'on' : 'off'}" style="position:absolute;left:10px;bottom:10px;font-size:10.5px;padding:3px 9px">${tag}</span></div>`;
phone('screen-2-look.png', `
  <div style="position:absolute;left:20px;right:20px;top:58px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:20px">←</span><span style="font-size:13px;font-weight:600;text-decoration:underline">Saved</span></div>
  <div style="position:absolute;left:24px;top:94px;font-weight:700;font-size:21px;letter-spacing:-.03em">Afternoon tea at The Berkeley</div>
  <div style="position:absolute;left:24px;top:124px;font-size:12px;color:${C.peb}">Sat 29 Nov · 3:00pm · 6° · Smart</div>
  <div style="position:absolute;left:20px;right:20px;top:152px;display:grid;grid-template-columns:1.25fr 1fr;gap:9px">
    ${tile(z('pink-tweed-swarovski'), 'ZIMA Atelier · new', 1, 1, 330)}
    <div style="display:grid;gap:9px">${tile(cut('slipDress'), 'Yours', 0, 0, 160)}${tile(cut('suedeHeelBoots'), 'Yours', 0, 0, 161)}</div>
  </div>
  <div style="position:absolute;left:20px;right:20px;top:496px;display:grid;grid-template-columns:1fr 1fr;gap:9px">
    ${tile(cut('shoulderBag'), 'Yours', 0, 0, 120)}
    <div style="border-radius:16px;border:1px dashed ${C.stone};display:flex;align-items:center;justify-content:center;font-size:12px;color:${C.peb}">+ Add a piece</div></div>
  <div style="position:absolute;left:20px;right:20px;top:632px;border-radius:14px;border:1px solid ${C.line};padding:12px 14px;display:flex;gap:10px;align-items:center;font-size:12px;line-height:1.4">
    <span style="width:22px;height:22px;flex:none;border-radius:50%;background:${C.ink};display:flex;align-items:center;justify-content:center">${svg(['M5 12.5 10 17.5 19 7'], 13, '#fff', 3)}</span>
    <span><b>Look Check:</b> complete, smart, and warm enough for 6°.</span></div>
  <div style="position:absolute;left:20px;right:20px;top:704px;border-radius:13px;background:${C.ink};color:#fff;text-align:center;padding:14px;font-weight:600;font-size:14.5px">Enquire about 1 piece</div>`);

// 03 · The piece
phone('screen-3-piece.png', `
  <div style="position:absolute;left:20px;right:20px;top:58px;display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600">
    <span><span style="font-size:18px">←</span>&nbsp; The piece</span>${svg(['M7 4h10v16l-5-3.5L7 20V4Z'], 20)}</div>
  <div style="position:absolute;left:20px;right:20px;top:92px;height:330px;border-radius:18px;overflow:hidden"><img class="ph" src="${z('pink-tweed-swarovski')}" style="object-position:50% 30%"></div>
  <div style="position:absolute;left:24px;right:24px;top:436px">
    <div class="eb" style="font-size:10px;color:${C.ink}">ZIMA Atelier</div>
    <div style="font-weight:700;font-size:18px;letter-spacing:-.02em;margin-top:5px;line-height:1.2">Pink Tweed Swarovski Crystal Coat with Mink Fur Sleeves</div>
    <div style="display:flex;gap:6px;margin-top:9px"><span class="pill off" style="font-size:10.5px;padding:3px 9px">Limited edition</span><span class="pill off" style="font-size:10.5px;padding:3px 9px">Price on request</span></div>
    <div style="margin-top:12px;border-radius:12px;background:${C.well};padding:11px 13px;font-size:12px;line-height:1.45;color:${C.soft}"><b style="color:${C.ink}">Why this piece for your Moment:</b> Italian tweed with mink cuffs keeps out a 6° afternoon, and it works over your champagne slip dress without hiding it.</div></div>
  <div style="position:absolute;left:20px;right:20px;top:660px;border-radius:13px;background:${C.ink};color:#fff;text-align:center;padding:13px;font-weight:600;font-size:14px">Enquire on WhatsApp</div>
  <div style="position:absolute;left:20px;right:20px;top:714px;border-radius:13px;border:1.4px solid ${C.ink};text-align:center;padding:12px;font-weight:600;font-size:13.5px">Book a fitting · Bagista, Knightsbridge</div>`);

// 04 · ZIMA's brand page
const card = (src, name) => `<div><div style="height:164px;border-radius:14px;overflow:hidden;background:${C.well}"><img class="ph" src="${z(src)}" style="object-position:50% 25%"></div>
  <div class="eb" style="font-size:8.5px;margin-top:7px;color:${C.ink}">ZIMA Atelier</div>
  <div style="font-size:12px;font-weight:600;line-height:1.25;margin-top:2px">${name}</div>
  <div style="font-size:11px;color:${C.peb};margin-top:2px">Price on request</div></div>`;
phone('screen-4-brand.png', `
  <div style="position:absolute;left:20px;top:58px;font-size:13px;font-weight:600"><span style="font-size:18px">←</span>&nbsp; Brands</div>
  <div style="position:absolute;left:24px;right:24px;top:96px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><div style="font-weight:700;font-size:26px;letter-spacing:.14em">ZIMA</div><div class="eb" style="font-size:9.5px;letter-spacing:.3em;margin-top:2px">Atelier</div></div>
      <span class="pill off" style="font-size:11px;padding:5px 12px">♡ Save brand</span></div>
    <div style="font-size:13px;line-height:1.45;color:${C.soft};margin-top:12px">Handcrafted outerwear in limited editions, from Italian fabrics with fur details. Showroom appointments in Knightsbridge.</div>
    <div style="display:flex;gap:6px;margin-top:12px">${['All', 'Coats', 'Jackets', 'Knitwear'].map((t, i) => `<span class="pill ${i ? 'off' : 'on'}" style="font-size:11px;padding:4px 11px">${t}</span>`).join('')}</div></div>
  <div style="position:absolute;left:20px;right:20px;top:252px;display:grid;grid-template-columns:1fr 1fr;gap:12px 10px">
    ${card('light-pink-chinchilla', 'Light pink coat with chinchilla fur')}${card('classic-zima-black', 'Classic ZIMA Coat')}
    ${card('light-pink-mink-swarovski', 'Light pink mink coat with Swarovski crystals')}${card('hooded-mink-cashmere', 'Hooded jacket with mink fur and cashmere')}</div>`);

// Hero: the coat, and the Moment it was chosen for.
G.push({ file: 'hero.png', w: 1200, h: 820, scale: 1, transparent: false, body: `<div class="a" style="width:1200px;height:820px">
  <img src="${z('pink-tweed-swarovski')}" style="position:absolute;left:0;top:0;width:600px;height:820px;object-fit:cover;object-position:50% 22%">
  <div style="position:absolute;left:660px;right:64px;top:70px">
    <div class="eb" style="font-size:18px">A FORya Moment · Sat 29 Nov · 3pm</div>
    <div style="font-weight:700;font-size:54px;letter-spacing:-.04em;line-height:1;margin-top:20px">Afternoon tea<br><span class="em">at The Berkeley.</span></div>
    <div style="display:flex;gap:28px;margin-top:34px;padding:22px 0;border-top:2px solid ${C.ink};border-bottom:1px solid ${C.line}">
      <div><div class="eb" style="font-size:14px">Forecast</div><div style="font-weight:700;font-size:30px;margin-top:6px">6°, clear</div></div>
      <div><div class="eb" style="font-size:14px">Dress code</div><div style="font-weight:700;font-size:30px;margin-top:6px">Smart</div></div></div>
    <div style="font-size:24px;line-height:1.45;color:${C.soft};margin-top:28px">Her wardrobe covers the dress, bag and boots. The one thing missing is a coat that’s warm enough and still worth being seen in.</div>
    <div style="display:flex;align-items:center;gap:16px;margin-top:34px">
      <span class="pill on" style="font-size:20px;padding:10px 20px">ZIMA Atelier</span>
      <span style="font-size:21px;font-weight:600">Pink Tweed Swarovski Crystal Coat</span></div>
  </div></div>` });
G.push({ file: '../logo.png', skip: true });


// ── animation frames (assembled into GIFs by gif.py) ─────────────────────
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const owned = (n, top) => `<div style="position:absolute;left:356px;top:${top}px;width:204px;height:236px;border-radius:20px;background:#fff;border:1.5px solid ${C.line}">
  <div class="g" style="position:absolute;inset:18px 18px 48px"><img src="${cut(n)}"></div>
  <span class="pill off" style="position:absolute;left:14px;bottom:14px;font-size:15px;padding:4px 12px">Yours</span></div>`;
const heroFrame = (p, q) => `<div class="a" style="width:1200px;height:820px">
  <div style="position:absolute;left:0;top:0;width:600px;height:820px;background:${C.well}"></div>
  <div style="position:absolute;left:40px;top:40px;width:300px;height:740px;border-radius:24px;border:2.5px dashed ${C.ink};opacity:${1 - p};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#fff">
    <div style="width:64px;height:64px;border-radius:50%;background:${C.ink};display:flex;align-items:center;justify-content:center">${svg(['M12 5v14', 'M5 12h14'], 32, '#fff', 2.2)}</div>
    <div style="font-weight:700;font-size:28px;letter-spacing:-.02em">Your piece</div>
    <div style="font-size:18px;color:${C.peb};text-align:center;line-height:1.35">The one thing<br>this look needs</div></div>
  <div style="position:absolute;left:40px;top:40px;width:300px;height:740px;border-radius:24px;overflow:hidden;opacity:${p};transform:translateY(${(1 - p) * 70}px) scale(${0.96 + 0.04 * p})">
    <img class="ph" src="${z('pink-tweed-swarovski')}" style="object-position:50% 25%">
    <span class="pill on" style="position:absolute;left:18px;bottom:18px;font-size:17px;padding:6px 14px">ZIMA Atelier · new</span></div>
  ${owned('slipDress', 40)}${owned('suedeHeelBoots', 292)}${owned('shoulderBag', 544)}
  <div style="position:absolute;left:660px;right:64px;top:70px">
    <div class="eb" style="font-size:18px">A FORya Moment · Sat 29 Nov · 3pm</div>
    <div style="font-weight:700;font-size:54px;letter-spacing:-.04em;line-height:1;margin-top:20px">Afternoon tea<br><span class="em">at The Berkeley.</span></div>
    <div style="display:flex;gap:28px;margin-top:34px;padding:22px 0;border-top:2px solid ${C.ink};border-bottom:1px solid ${C.line}">
      <div><div class="eb" style="font-size:14px">Forecast</div><div style="font-weight:700;font-size:30px;margin-top:6px">6°, clear</div></div>
      <div><div class="eb" style="font-size:14px">Dress code</div><div style="font-weight:700;font-size:30px;margin-top:6px">Smart</div></div></div>
    <div style="font-size:23px;line-height:1.45;color:${C.soft};margin-top:28px">Her wardrobe covers the dress, boots and bag. What’s missing is a coat warm enough for 6°, and still worth being seen in.</div>
    <div style="position:relative;height:150px;margin-top:30px">
      <div style="position:absolute;inset:0;opacity:${1 - q};font-size:22px;color:${C.peb};display:flex;align-items:center;gap:12px">
        <span style="width:14px;height:14px;border-radius:50%;border:2px solid ${C.peb};display:block"></span>3 yours · 1 missing</div>
      <div style="position:absolute;left:0;right:0;top:0;opacity:${q};transform:translateY(${(1 - q) * 24}px)">
        <div style="display:flex;align-items:center;gap:14px;font-size:22px;font-weight:600">
          <span style="width:38px;height:38px;border-radius:50%;background:${C.ink};display:flex;align-items:center;justify-content:center">${svg(['M5 12.5 10 17.5 19 7'], 22, '#fff', 3)}</span>Look Check: complete, and warm enough</div>
        <div style="font-size:20px;color:${C.peb};margin-top:16px">Completed by <b style="color:${C.ink}">ZIMA Atelier</b>, Pink Tweed Swarovski Crystal Coat</div></div>
    </div>
  </div></div>`;
const HERO_FRAMES = [];
const hf = (p, q, ms) => HERO_FRAMES.push({ html: heroFrame(p, q), ms });
hf(0, 0, 1500);
for (let i = 1; i <= 10; i++) hf(ease(i / 10), 0, 60);
for (let i = 1; i <= 6; i++) hf(1, ease(i / 6), 60);
hf(1, 1, 3200);
for (let i = 1; i <= 6; i++) hf(1 - ease(i / 6), 1 - ease(i / 6), 60);

// The phone: swipe through the four screens, like moving through the app.
const stripHTML = x => `<div style="position:relative;width:414px;height:804px;background:#fff"><div class="phone">
  <div id="strip" style="position:absolute;left:${-x}px;top:0;width:${390 * 5}px;height:780px;display:flex">
    ${[...SCREENS, SCREENS[0]].map(sc => `<div style="position:relative;flex:none;width:390px;height:780px;overflow:hidden;background:#fff">${sc}</div>`).join('')}</div>
  <div class="isl"></div><div class="sb" style="background:#fff;padding:0 4px">9:41</div></div></div>`;
const SIM_FRAMES = [];
for (let i = 0; i < 4; i++) {
  SIM_FRAMES.push({ x: i * 390, ms: 2200 });
  for (let k = 1; k <= 6; k++) SIM_FRAMES.push({ x: (i + ease(k / 6)) * 390, ms: 70 });
}
SIM_FRAMES.pop(); // last frame equals the first: let the loop take it

// ── email ────────────────────────────────────────────────────────────────
const F = { sans: "'Bricolage Grotesque',Helvetica,Arial,sans-serif", serif: "'Instrument Serif',Georgia,'Times New Roman',serif", mono: "'Geist Mono',Menlo,Consolas,monospace" };
const eb = t => `<div style="font-family:${F.mono};font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:${C.peb};line-height:16px">${t}</div>`;
const h = (a, b, size, br) => `<h1 style="margin:0;font-family:${F.sans};font-size:${size}px;line-height:${Math.round(size * 1.08)}px;font-weight:700;letter-spacing:-1px;color:${C.ink}">${a}${br ? '<br>' : ' '}<span style="font-family:${F.serif};font-style:italic;font-weight:400;letter-spacing:-.3px">${b}</span></h1>`;
const p = (t, x = '') => `<p style="margin:0 0 16px;font-family:${F.sans};font-size:16px;line-height:25px;color:${C.soft};${x}">${t}</p>`;
const rule = (c = C.ink, w = 2) => `<tr><td style="padding:0 40px" class="px"><div style="border-top:${w}px solid ${c};font-size:0;line-height:0">&nbsp;</div></td></tr>`;
const sp = n => `<tr><td style="height:${n}px;font-size:0;line-height:0">&nbsp;</td></tr>`;
const SENDER = { name: 'Zaryab', title: 'Co-founder, FORya', email: 'zaryabthakur@decusatio.com' };
const MAIL = `mailto:${SENDER.email}?subject=${encodeURIComponent('ZIMA × FORya')}`;
const btn = (label, href) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="${C.ink}" style="border-radius:999px">
  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:52px;v-text-anchor:middle;width:260px" arcsize="50%" fillcolor="${C.ink}" stroke="f"><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">${label}</center></v:roundrect><![endif]-->
  <!--[if !mso]><!--><a href="${href}" style="display:inline-block;padding:16px 34px;font-family:${F.sans};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${label}&nbsp;&rarr;</a><!--<![endif]--></td></tr></table>`;

function email(src) {
  const im = (f, w, alt, st = '') => `<img src="${src}${f}" width="${w}" alt="${alt}" style="display:block;width:100%;max-width:${w}px;height:auto;border:0;${st}">`;
  const screen = (n, f, t, s) => `<td class="col" width="50%" valign="top" style="padding:0 10px 30px">
    ${im('zima/' + f, 250, t + ': ' + s, 'margin:0 auto')}
    <div style="padding:14px 6px 0">${eb(n)}<div style="font-family:${F.sans};font-size:17px;line-height:22px;font-weight:700;color:${C.ink};margin:4px 0 4px;letter-spacing:-.2px">${t}</div>
    <div style="font-family:${F.sans};font-size:14px;line-height:21px;color:${C.peb}">${s}</div></div></td>`;
  const why = ([t, s]) => `<tr><td style="padding:16px 0;border-top:1px solid ${C.line}">
    <div style="font-family:${F.sans};font-size:17px;line-height:22px;font-weight:700;color:${C.ink};letter-spacing:-.2px;margin-bottom:4px">${t}</div>
    <div style="font-family:${F.sans};font-size:15px;line-height:23px;color:${C.peb}">${s}</div></td></tr>`;
  const step = (t, i) => `<tr><td style="padding:14px 0;border-top:1px solid ${C.line}"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="44" valign="top" style="font-family:${F.mono};font-size:12px;letter-spacing:2px;color:${C.peb};padding-top:3px">0${i + 1}</td>
    <td style="font-family:${F.sans};font-size:16px;line-height:24px;color:${C.ink}">${t}</td></tr></table></td></tr>`;

  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<title>ZIMA, styled for the Moments your clients dress for</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=Instrument+Serif:ital@1&family=Geist+Mono:wght@500&display=swap" rel="stylesheet">
<style>body{margin:0;padding:0;width:100%!important;background:#fff}table{border-collapse:collapse}a{color:${C.ink}}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:no-preference){.rise{animation:rise .9s cubic-bezier(.2,.7,.2,1) both}.d1{animation-delay:.15s}.d2{animation-delay:.3s}}
@media (max-width:620px){.wrap{width:100%!important}.px{padding-left:24px!important;padding-right:24px!important}.col{display:block!important;width:100%!important;padding:0 0 30px!important}.h1 h1{font-size:31px!important;line-height:34px!important}}</style>
</head><body style="margin:0;padding:0;background:#fff">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#fff;opacity:0">We planned a Moment in Knightsbridge around your Pink Tweed coat. Here’s how ZIMA would look on FORya.&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF"><tr><td align="center" style="padding:24px 0">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px">

<tr><td align="right" style="padding:0 40px 14px;font-family:${F.mono};font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:${C.stone}" class="px"><a href="https://forya.onrender.com/email/zima/view.html" style="color:${C.peb}">Open the interactive version &rarr;</a></td></tr>
<tr><td style="padding:8px 40px 14px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td valign="bottom">${eb('Prepared for ZIMA Atelier')}</td>
  <td align="right" valign="bottom"><img src="${src}logo.png" width="118" alt="FORya" style="display:block;border:0;width:118px;height:auto"></td></tr></table></td></tr>
${rule()}${sp(28)}

<tr><td style="padding:0 40px" class="px h1 rise">${h('When the forecast turns cold,', 'we’d like the coat to be ZIMA.', 36, true)}</td></tr>
${sp(18)}
<tr><td style="padding:0 40px" class="px rise d1">${p('A short preview of ZIMA Atelier on FORya, built from the pieces in your current collection.', `font-size:18px;line-height:27px;color:${C.peb};margin:0`)}</td></tr>
${sp(26)}
<tr><td style="padding:0 40px" class="px rise d2">${im('zima/hero.gif', 520, 'Animated: a FORya Moment: afternoon tea at The Berkeley, Saturday 29 November at 3pm, 6° and clear. The empty slot in the look fills with ZIMA Atelier’s Pink Tweed Swarovski Crystal Coat.', 'border-radius:14px')}</td></tr>
${sp(34)}

<tr><td style="padding:0 40px" class="px">
  ${p('Dear Kristin and Daniela,', `color:${C.ink}`)}
  ${p('I’m Zaryab, co-founder of FORya, an outfit planner built in London. Our users tell FORya about something they’re going to (a dinner in Mayfair, a wedding, afternoon tea), and it builds the whole look for that day, starting with the clothes they already own and the forecast for that place and hour.')}
  ${p('When a Moment turns cold and the wardrobe has nothing right to wear over the look, FORya suggests the piece that’s missing. Through the winter, that piece is almost always a coat. Pieces like your pink tweed with mink sleeves, or the light pink coat with the chinchilla collar, are exactly what we’d want our users to find there.')}
  ${p('So we built a preview of how ZIMA would appear on FORya, using your current collection.')}
</td></tr>
${sp(20)}${rule(C.line, 1)}${sp(30)}

<tr><td style="padding:0 40px 8px" class="px">${eb('The simulation')}</td></tr>
<tr><td style="padding:0 40px 28px" class="px">${h('ZIMA on FORya,', 'in four screens.', 28)}</td></tr>
<tr><td style="padding:0 30px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td class="col" width="270" valign="top" style="padding:0 10px 24px">${im('zima/sim.gif', 260, 'Animated: the FORya app moving through four screens: the Moment, the look, the ZIMA piece and the ZIMA brand page.', 'margin:0 auto')}</td>
  <td class="col" valign="middle" style="padding:0 10px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${[['01 · The Moment', 'A plan, not a feed', 'Afternoon tea in Knightsbridge at 6°. FORya explains why a coat is needed.'],
       ['02 · The look', 'Styled with what she owns', 'Your coat completes her own dress, boots and bag, and passes Look Check.'],
       ['03 · The piece', 'Sold your way', 'Limited edition, price on request. Enquiries go to WhatsApp or a Bagista fitting.'],
       ['04 · Your page', 'A home for the collection', 'A ZIMA page in Brands, showing only pieces still available.']]
      .map(([n, t, d], i) => `<tr><td style="padding:${i ? 14 : 0}px 0 14px;${i ? 'border-top:1px solid ' + C.line + ';' : ''}">${eb(n)}
        <div style="font-family:${F.sans};font-size:16px;line-height:21px;font-weight:700;color:${C.ink};margin:3px 0 3px">${t}</div>
        <div style="font-family:${F.sans};font-size:14px;line-height:20px;color:${C.peb}">${d}</div></td></tr>`).join('')}
  </table></td></tr></table></td></tr>
<tr><td style="padding:4px 40px 0" class="px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1.5px solid ${C.ink};border-radius:999px">
  <a href="https://forya.onrender.com/email/zima/view.html" style="display:inline-block;padding:13px 26px;font-family:${F.sans};font-size:15px;font-weight:600;color:${C.ink};text-decoration:none">Scroll through it in your browser &rarr;</a></td></tr></table></td></tr>
${sp(30)}
${sp(8)}${rule(C.line, 1)}${sp(30)}

<tr><td style="padding:0 40px 8px" class="px">${eb('Why FORya for ZIMA')}</td></tr>
<tr><td style="padding:0 40px 22px" class="px">${h('Made for the way', 'ZIMA already works.', 28)}</td></tr>
<tr><td style="padding:0 40px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  ${why(['Your coats, when they’re needed', 'FORya adds an outer layer when the forecast for a Moment calls for one. From November to March, that’s most looks.'])}
  ${why(['Built for limited editions', 'We only show what’s available. When a fabric runs out and a coat leaves your collection, it leaves FORya too.'])}
  ${why(['Your clients, your conversation', 'FORya never takes payment. Enquiries come to you by WhatsApp, DM or a showroom appointment, exactly as they do today.'])}
  ${why(['Styled for London plans', 'Dinners in Mayfair, afternoon tea in Knightsbridge, winter weddings: the occasions ZIMA is made for.'])}
</table></td></tr>
${sp(26)}

<tr><td style="padding:0 40px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px solid ${C.ink};border-radius:16px"><tr><td style="padding:28px 28px 14px">
  ${eb('What it takes')}
  <div style="font-family:${F.sans};font-size:22px;line-height:27px;font-weight:700;color:${C.ink};letter-spacing:-.4px;margin:8px 0 16px">Very little from you.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${['We work from your website and the photographs you already have.', 'We build your ZIMA page, and you approve every listing before it goes live.', 'Tell us when a piece sells out, and we take it down the same day.'].map(step).join('')}
  </table></td></tr></table></td></tr>
${sp(34)}

<tr><td style="padding:0 40px" class="px">
  ${p('We’re inviting a small group of London brands to join us as launch partners, and we’d love ZIMA to be one of them. Could we show you the app properly, on a call or at the showroom, whichever suits you?')}
</td></tr>
${sp(4)}
<tr><td style="padding:0 40px" class="px">${btn('Let’s arrange a time', MAIL)}</td></tr>
${sp(34)}
<tr><td style="padding:0 40px" class="px">
  <p style="margin:0;font-family:${F.sans};font-size:16px;line-height:24px;color:${C.ink}">With best wishes,</p>
  <p style="margin:2px 0 0;font-family:${F.sans};font-size:16px;line-height:24px;color:${C.ink};font-weight:700">${SENDER.name}</p>
  <p style="margin:0;font-family:${F.sans};font-size:14px;line-height:21px;color:${C.peb}">${SENDER.title}<br><a href="mailto:${SENDER.email}" style="color:${C.peb}">${SENDER.email}</a></p>
</td></tr>
${sp(44)}${rule()}
<tr><td style="padding:22px 40px 8px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td><img src="${src}logo.png" width="84" alt="FORya" style="display:block;border:0;width:84px;height:auto"></td>
  <td align="right" style="font-family:${F.mono};font-size:11px;letter-spacing:2px;text-transform:uppercase"><a href="https://forya.onrender.com" style="color:${C.ink};text-decoration:none">forya.onrender.com</a></td></tr></table></td></tr>
<tr><td style="padding:8px 40px 24px" class="px"><p style="margin:0;font-family:${F.sans};font-size:12px;line-height:19px;color:${C.stone}">FORya is built by Decusatio Ltd, London. The screens above are a design preview made for ZIMA Atelier using images from zimaatelier.com; nothing has been published. If you’d rather not hear from us, just reply and let us know.</p></td></tr>

</table></td></tr></table></body></html>`;
}

// ── web version: the same proposal, with scroll-driven motion ─────────────
function view() {
  const steps = [
    ['01', 'The Moment', 'A plan, <em>not a feed.</em>', 'She tells FORya about afternoon tea at The Berkeley on Saturday at 3pm. FORya reads the forecast for Knightsbridge at that hour (6°, clear) and her dress code, then explains why the look needs a coat before suggesting one.'],
    ['02', 'The look', 'Styled with <em>what she owns.</em>', 'Her own slip dress, boots and bag come first. Your Pink Tweed Swarovski Crystal Coat completes the look, and Look Check confirms it’s smart, complete and warm enough.'],
    ['03', 'The piece', 'Sold <em>your way.</em>', 'Shown as a limited edition, price on request, exactly as you sell today. Enquiries go straight to your WhatsApp or to a fitting at Bagista in Knightsbridge. FORya never takes payment.'],
    ['04', 'Your page', 'A home for <em>the collection.</em>', 'ZIMA gets its own page in Brands with your story, your categories and only the pieces still available. When a fabric runs out, the coat leaves FORya too.'],
  ];
  const why = [
    ['Your coats, when they’re needed', 'FORya adds an outer layer when the forecast for a Moment calls for one. From November to March, that’s most looks.'],
    ['Built for limited editions', 'We only show what’s available. When a fabric runs out and a coat leaves your collection, it leaves FORya too.'],
    ['Your clients, your conversation', 'Enquiries come to you by WhatsApp, DM or a showroom appointment, exactly as they do today.'],
    ['Styled for London plans', 'Dinners in Mayfair, afternoon tea in Knightsbridge, winter weddings: the occasions ZIMA is made for.'],
  ];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ZIMA Atelier × FORya</title><meta name="robots" content="noindex,nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Instrument+Serif:ital@1&family=Geist+Mono:wght@500&display=swap" rel="stylesheet">
<style>
:root{--ink:${C.ink};--soft:${C.soft};--peb:${C.peb};--line:${C.line};--well:${C.well}}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#fff;color:var(--ink);font-family:'Bricolage Grotesque',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
em{font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-weight:400;letter-spacing:-.01em}
.eb{font-family:'Geist Mono',Menlo,monospace;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--peb)}
.wrap{max-width:1120px;margin:0 auto;padding:0 28px}
/* bar + progress */
.bar{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.bar .wrap{display:flex;justify-content:space-between;align-items:center;height:64px;border-bottom:2px solid var(--ink)}
.bar img{height:26px;display:block}
.prog{position:absolute;left:0;bottom:-2px;height:2px;background:var(--ink);width:100%;transform-origin:0 50%;transform:scaleX(0)}
.prog-track{position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--line)}
/* hero */
.hero{padding-top:72px;padding-bottom:40px}
.hero h1{font-size:clamp(40px,7vw,92px);line-height:.98;letter-spacing:-.045em;font-weight:700;max-width:13ch}
.hero h1 .ln{display:block;overflow:hidden}
.hero h1 .ln>span{display:inline-block;transform:translateY(105%);transition:transform 1.1s cubic-bezier(.2,.7,.1,1)}
.loaded .hero h1 .ln>span{transform:none}
.loaded .hero h1 .ln:nth-child(2)>span{transition-delay:.12s}
.lede{font-size:clamp(18px,2vw,22px);line-height:1.5;color:var(--peb);max-width:46ch;margin-top:26px}
.heroimg{margin-top:48px;border-radius:20px;overflow:hidden;background:var(--well)}
.heroimg img{display:block;width:100%;transform:scale(var(--s,1.08));transition:transform .1s linear;will-change:transform}
/* reveal */
.rv{opacity:0;transform:translateY(28px);transition:opacity .9s ease,transform .9s cubic-bezier(.2,.7,.1,1)}
.rv.in{opacity:1;transform:none}
/* letter */
.letter{max-width:736px;margin:0 auto;padding:90px 28px 40px}
.letter p{font-size:19px;line-height:1.65;color:var(--soft);margin-bottom:20px}
.letter p:first-child{color:var(--ink)}
/* story */
.story{padding-top:40px;padding-bottom:60px}
.story .head{max-width:680px;margin:0 auto 20px}
h2{font-size:clamp(30px,4vw,48px);line-height:1.04;letter-spacing:-.035em;font-weight:700;margin-top:10px}
.scrolly{display:grid;grid-template-columns:minmax(260px,400px) 1fr;gap:72px;align-items:start}
.stick{position:sticky;top:96px;height:calc(100vh - 120px);display:flex;align-items:center;justify-content:center}
.phone{position:relative;width:min(100%,360px);aspect-ratio:414/804}
.phone img{position:absolute;inset:0;width:100%;height:100%;opacity:0;transform:scale(.985) translateY(10px);transition:opacity .6s ease,transform .8s cubic-bezier(.2,.7,.1,1)}
.phone img.on{opacity:1;transform:none}
.dots{position:absolute;right:-26px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px}
.dots i{width:7px;height:7px;border-radius:50%;background:var(--line);transition:background .3s,transform .3s}
.dots i.on{background:var(--ink);transform:scale(1.3)}
.step{min-height:82vh;display:flex;flex-direction:column;justify-content:center;padding:40px 0;border-top:1px solid var(--line);opacity:.25;transition:opacity .5s}
.step:first-child{border-top:0}
.step.on{opacity:1}
.step h3{font-size:clamp(28px,3.4vw,44px);line-height:1.05;letter-spacing:-.035em;font-weight:700;margin:12px 0 18px}
.step p{font-size:18px;line-height:1.6;color:var(--soft);max-width:44ch}
/* why */
.why{padding-top:100px;padding-bottom:40px;border-top:1px solid var(--line)}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0 56px;margin-top:40px}
.cell{padding:28px 0;border-top:1px solid var(--line)}
.cell b{display:block;font-size:21px;letter-spacing:-.02em;margin-bottom:8px}
.cell span{font-size:17px;line-height:1.55;color:var(--peb)}
/* box + close */
.box{border:2px solid var(--ink);border-radius:22px;padding:40px;margin:60px 0}
.box ol{list-style:none;counter-reset:n;margin-top:18px}
.box li{counter-increment:n;display:flex;gap:22px;padding:18px 0;border-top:1px solid var(--line);font-size:18px;line-height:1.5}
.box li::before{content:counter(n,decimal-leading-zero);font-family:'Geist Mono',monospace;font-size:13px;color:var(--peb);padding-top:4px}
.close{max-width:736px;margin:0 auto;padding:20px 28px 100px}
.close p{font-size:20px;line-height:1.6;color:var(--soft)}
.cta{display:inline-flex;align-items:center;gap:12px;margin-top:30px;background:var(--ink);color:#fff;text-decoration:none;font-weight:600;font-size:17px;padding:18px 32px;border-radius:999px;transition:transform .25s}
.cta:hover{transform:translateY(-2px)}
.sig{margin-top:40px;font-size:17px;line-height:1.5}.sig span{color:var(--peb);font-size:15px}
footer{border-top:2px solid var(--ink)}footer .wrap{padding:26px 28px 40px;display:flex;justify-content:space-between;gap:24px;font-size:13px;line-height:1.6;color:#8A8A8A}
@media (max-width:820px){
  .scrolly{grid-template-columns:1fr;gap:0}
  .stick{top:64px;height:auto;padding:16px 0;background:#fff;z-index:5}
  .phone{width:min(38vw,170px)}
  .bar .eb{font-size:10px;letter-spacing:.14em}
  .wrap{padding:0 22px}
  .dots{right:-18px}
  .step{min-height:60vh;padding:28px 0}
  .grid{grid-template-columns:1fr}
  .box{padding:26px}
  footer .wrap{flex-direction:column}
}
@media (prefers-reduced-motion:reduce){
  .rv,.phone img,.hero h1 .ln>span{transition:none!important;transform:none!important}
  .rv{opacity:1}.heroimg img{transform:none!important}
}
</style></head><body>
<div class="bar"><div class="wrap" style="position:relative"><span class="eb">Prepared for ZIMA Atelier</span><img src="../logo.png" alt="FORya"><div class="prog-track"></div><div class="prog" id="prog"></div></div></div>

<main>
<section class="hero wrap">
  <div class="eb rv">A proposal from FORya</div>
  <h1 style="margin-top:22px"><span class="ln"><span>When the forecast turns cold,</span></span><span class="ln"><span><em>we’d like the coat to be ZIMA.</em></span></span></h1>
  <p class="lede rv">A short preview of ZIMA Atelier on FORya, built from the pieces in your current collection.</p>
  <div class="heroimg rv"><img id="heroimg" src="hero.png" alt="A FORya Moment: afternoon tea at The Berkeley, Saturday 29 November at 3pm, 6° and clear, completed by ZIMA Atelier’s Pink Tweed Swarovski Crystal Coat."></div>
</section>

<section class="letter">
  <p class="rv">Dear Kristin and Daniela,</p>
  <p class="rv">I’m Zaryab, co-founder of FORya, an outfit planner built in London. Our users tell FORya about something they’re going to (a dinner in Mayfair, a wedding, afternoon tea), and it builds the whole look for that day, starting with the clothes they already own and the forecast for that place and hour.</p>
  <p class="rv">When a Moment turns cold and the wardrobe has nothing right to wear over the look, FORya suggests the piece that’s missing. Through the winter, that piece is almost always a coat. Pieces like your pink tweed with mink sleeves, or the light pink coat with the chinchilla collar, are exactly what we’d want our users to find there.</p>
  <p class="rv">So we built a preview of how ZIMA would appear on FORya. Scroll through it below.</p>
</section>

<section class="story wrap">
  <div class="head rv"><div class="eb">The simulation</div><h2>ZIMA on FORya, <em>in four screens.</em></h2></div>
  <div class="scrolly">
    <div class="stick"><div class="phone" id="phone">
      ${[1, 2, 3, 4].map((n, i) => `<img src="screen-${n}-${['moment', 'look', 'piece', 'brand'][i]}.png" alt="Screen ${n}"${i ? '' : ' class="on"'}>`).join('')}
      <div class="dots">${[0, 1, 2, 3].map(i => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>
    </div></div>
    <div>${steps.map(([n, k, t, d], i) => `<div class="step${i ? '' : ' on'}" data-i="${i}"><div class="eb">${n} · ${k}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
  </div>
</section>

<section class="why wrap">
  <div class="rv"><div class="eb">Why FORya for ZIMA</div><h2>Made for the way <em>ZIMA already works.</em></h2></div>
  <div class="grid">${why.map(([t, d], i) => `<div class="cell rv" style="transition-delay:${(i % 2) * 0.12}s"><b>${t}</b><span>${d}</span></div>`).join('')}</div>
  <div class="box rv"><div class="eb">What it takes</div><h2 style="font-size:30px">Very little from you.</h2>
    <ol><li>We work from your website and the photographs you already have.</li><li>We build your ZIMA page, and you approve every listing before it goes live.</li><li>Tell us when a piece sells out, and we take it down the same day.</li></ol></div>
</section>

<section class="close">
  <p class="rv">We’re inviting a small group of London brands to join us as launch partners, and we’d love ZIMA to be one of them. Could we show you the app properly, on a call or at the showroom, whichever suits you?</p>
  <a class="cta rv" href="${MAIL}">Let’s arrange a time <span aria-hidden="true">→</span></a>
  <div class="sig rv">With best wishes,<br><b>${SENDER.name}</b><br><span>${SENDER.title} · <a href="mailto:${SENDER.email}" style="color:inherit">${SENDER.email}</a></span></div>
</section>
</main>

<footer><div class="wrap"><img src="../logo.png" alt="FORya" style="height:22px"><span style="max-width:640px">FORya is built by Decusatio Ltd, London. This page is a design preview made for ZIMA Atelier using images from zimaatelier.com; nothing here has been published in the app.</span></div></footer>

<script>
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => document.documentElement.classList.add('loaded'));
  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
  // sticky phone: the step in the middle of the screen picks the screen
  const imgs = [...document.querySelectorAll('#phone img')], dots = [...document.querySelectorAll('.dots i')], steps = [...document.querySelectorAll('.step')];
  const set = i => { imgs.forEach((m, k) => m.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); steps.forEach((s, k) => s.classList.toggle('on', k === i)); };
  const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(+e.target.dataset.i); }), { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => so.observe(s));
  // progress bar + slow zoom-out on the hero image
  const prog = document.getElementById('prog'), hero = document.getElementById('heroimg');
  let ticking = false;
  const tick = () => {
    const h = document.documentElement, max = h.scrollHeight - innerHeight;
    prog.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    if (!reduce && hero) { const r = hero.getBoundingClientRect(), t = Math.min(1, Math.max(0, 1 - r.top / innerHeight)); hero.style.setProperty('--s', (1.08 - 0.08 * t).toFixed(4)); }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
  tick();
})();
</script>
</body></html>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const tmp = path.join(__dirname, '.tmp.html');
  for (const g of G.filter(g => !g.skip)) {
    const pg = await b.newPage({ viewport: { width: g.w, height: g.h }, deviceScaleFactor: g.scale });
    fs.writeFileSync(tmp, `<!doctype html><html><head><style>${BASE}</style></head><body>${g.body}</body></html>`);
    await pg.goto('file://' + tmp, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(OUT, g.file), omitBackground: g.transparent });
    await pg.close();
  }
  // Animated hero and phone, rendered frame by frame then assembled by gif.py.
  const FR = path.join(__dirname, '.frames'); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR);
  const page = body => `<!doctype html><html><head><style>${BASE}</style></head><body>${body}</body></html>`;
  {
    const pg = await b.newPage({ viewport: { width: 1200, height: 820 }, deviceScaleFactor: 0.65 });
    for (const [i, f] of HERO_FRAMES.entries()) {
      fs.writeFileSync(tmp, page(f.html)); await pg.goto('file://' + tmp, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
      await pg.screenshot({ path: `${FR}/hero-${String(i).padStart(3, '0')}.png` });
    }
    fs.writeFileSync(`${FR}/hero.json`, JSON.stringify(HERO_FRAMES.map(f => f.ms))); await pg.close();
  }
  {
    const pg = await b.newPage({ viewport: { width: 414, height: 804 }, deviceScaleFactor: 430 / 414 });
    fs.writeFileSync(tmp, page(stripHTML(0))); await pg.goto('file://' + tmp, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready);
    for (const [i, f] of SIM_FRAMES.entries()) {
      await pg.evaluate(x => { document.getElementById('strip').style.left = -x + 'px'; }, f.x);
      await pg.screenshot({ path: `${FR}/sim-${String(i).padStart(3, '0')}.png` });
    }
    fs.writeFileSync(`${FR}/sim.json`, JSON.stringify(SIM_FRAMES.map(f => f.ms))); await pg.close();
  }
  for (const n of ['hero', 'sim']) console.log(require('child_process').execFileSync('python3', [path.join(__dirname, 'gif.py'), FR, n, path.join(OUT, n + '.gif'), n === 'sim' ? '160' : '255']).toString().trim());
  fs.rmSync(FR, { recursive: true, force: true });
  fs.writeFileSync(path.join(OUT, 'view.html'), view());

  fs.writeFileSync(path.join(__dirname, 'forya-x-zima-atelier.html'), email(HOST));
  fs.writeFileSync(tmp, email('file://' + path.join(ROOT, 'frontend/public/email') + '/'));
  for (const [w, tag] of [[680, 'desktop'], [390, 'mobile']]) {
    const pg = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
    await pg.goto('file://' + tmp, { waitUntil: 'load', timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(400);
    await pg.screenshot({ path: path.join(__dirname, `preview-${tag}.png`), fullPage: true }); await pg.close();
  }
  fs.rmSync(tmp, { force: true }); await b.close(); console.log('ok');
})();
