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
const phone = (file, inner) => G.push({ file, w: 414, h: 804, scale: 2, transparent: true, body: `<div style="position:relative;width:414px;height:804px"><div class="phone"><div class="isl"></div><div class="sb">9:41</div>${inner}</div></div>` });

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
@media (max-width:620px){.wrap{width:100%!important}.px{padding-left:24px!important;padding-right:24px!important}.col{display:block!important;width:100%!important;padding:0 0 30px!important}.h1 h1{font-size:31px!important;line-height:34px!important}}</style>
</head><body style="margin:0;padding:0;background:#fff">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#fff;opacity:0">We planned a Moment in Knightsbridge around your Pink Tweed coat. Here’s how ZIMA would look on FORya.&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF"><tr><td align="center" style="padding:24px 0">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px">

<tr><td style="padding:8px 40px 14px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td valign="bottom">${eb('Prepared for ZIMA Atelier')}</td>
  <td align="right" valign="bottom"><img src="${src}logo.png" width="118" alt="FORya" style="display:block;border:0;width:118px;height:auto"></td></tr></table></td></tr>
${rule()}${sp(28)}

<tr><td style="padding:0 40px" class="px h1">${h('When the forecast turns cold,', 'we’d like the coat to be ZIMA.', 36, true)}</td></tr>
${sp(18)}
<tr><td style="padding:0 40px" class="px">${p('A short preview of ZIMA Atelier on FORya, built from the pieces in your current collection.', `font-size:18px;line-height:27px;color:${C.peb};margin:0`)}</td></tr>
${sp(26)}
<tr><td style="padding:0 40px" class="px">${im('zima/hero.png', 520, 'A FORya Moment: afternoon tea at The Berkeley, Saturday 29 November at 3pm, 6° and clear. The look is completed by ZIMA Atelier’s Pink Tweed Swarovski Crystal Coat.', 'border-radius:14px')}</td></tr>
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
<tr><td style="padding:0 30px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>${screen('01 · The Moment', 'screen-1-moment.png', 'A plan, not a feed', 'A real afternoon in Knightsbridge at 6°. FORya explains why a coat is needed before suggesting one.')}
      ${screen('02 · The look', 'screen-2-look.png', 'Styled with what she owns', 'Your coat completes a look built from her own dress, boots and bag, and passes Look Check for the cold.')}</tr>
  <tr>${screen('03 · The piece', 'screen-3-piece.png', 'Sold your way', 'Shown as a limited edition, price on request. Enquiries go straight to your WhatsApp or a fitting at Bagista.')}
      ${screen('04 · Your page', 'screen-4-brand.png', 'A home for the collection', 'Your own ZIMA page in Brands, showing only pieces that are still available.')}</tr>
</table></td></tr>
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
  fs.writeFileSync(path.join(__dirname, 'forya-x-zima-atelier.html'), email(HOST));
  fs.writeFileSync(tmp, email('file://' + path.join(ROOT, 'frontend/public/email') + '/'));
  for (const [w, tag] of [[680, 'desktop'], [390, 'mobile']]) {
    const pg = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
    await pg.goto('file://' + tmp, { waitUntil: 'load', timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(400);
    await pg.screenshot({ path: path.join(__dirname, `preview-${tag}.png`), fullPage: true }); await pg.close();
  }
  fs.rmSync(tmp, { force: true }); await b.close(); console.log('ok');
})();
