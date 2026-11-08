// FORya partnership email — graphics + two HTML templates (brands, creators).
//
//   node marketing/email/build.cjs
//
// Graphics are rendered at 2x into frontend/public/email/, so once deployed they are served from
// https://forya.onrender.com/email/…, which is where the templates point. The templates are
// table-based with inline styles, so they hold up in Gmail, Outlook and Apple Mail.
// Merge fields use {{double_braces}}; swap them for your sending tool's syntax if it differs.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT  = path.resolve(__dirname, '../..');
const IMG   = path.join(ROOT, 'frontend/public/images');
const CUT   = path.join(ROOT, 'marketing/instagram/cutouts');
const FONTS = path.join(ROOT, 'marketing/instagram/fonts');
const OUT   = path.join(ROOT, 'frontend/public/email');
const HERE  = __dirname;
const HOST  = 'https://forya.onrender.com/email/';

const C = { ink: '#1A1A1A', soft: '#3A3A3A', peb: '#666666', stone: '#8A8A8A', line: '#E3E3E3', well: '#F4F4F4' };
const cut = n => 'file://' + path.join(CUT, n + '.png');
const photo = n => 'file://' + path.join(IMG, n + '.webp');

// ── graphics ─────────────────────────────────────────────────────────────
const face = (pkg, f, fam, w, st = 'normal') => `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(FONTS, pkg, 'files', f)).toString('base64')}) format('woff2')}`;
const FONTCSS = [
  face('bricolage-grotesque', 'bricolage-grotesque-latin-400-normal.woff2', 'BG', 400),
  face('bricolage-grotesque', 'bricolage-grotesque-latin-600-normal.woff2', 'BG', 600),
  face('bricolage-grotesque', 'bricolage-grotesque-latin-700-normal.woff2', 'BG', 700),
  face('bricolage-grotesque', 'bricolage-grotesque-latin-800-normal.woff2', 'BG', 800),
  face('instrument-serif', 'instrument-serif-latin-400-italic.woff2', 'IS', 400, 'italic'),
  face('geist-mono', 'geist-mono-latin-500-normal.woff2', 'GM', 500),
].join('');
const BASE = `${FONTCSS}*{margin:0;padding:0;box-sizing:border-box}html,body{background:transparent}
.a{position:relative;overflow:hidden;font-family:'BG';color:${C.ink};background:#fff}
.wm{display:inline-flex;align-items:baseline;line-height:1;white-space:nowrap}
.wm .f{font-weight:800;letter-spacing:-.06em;font-size:var(--s)}.wm .y{font-family:'IS';font-style:italic;letter-spacing:-.02em;padding-left:.02em;font-size:var(--s)}
.eb{font-family:'GM';font-weight:500;text-transform:uppercase;letter-spacing:.2em;color:${C.peb}}
.g{display:flex;align-items:center;justify-content:center}.g img{max-width:100%;max-height:100%;object-fit:contain;filter:grayscale(1) contrast(1.05)}
.pill{display:inline-block;border-radius:999px;font-weight:600;white-space:nowrap}
.on{background:${C.ink};color:#fff}.off{background:#fff;color:${C.ink};border:2px solid ${C.ink}}`;
const wm = px => `<span class="wm" style="--s:${px}px"><span class="f">FOR</span><span class="y">ya</span></span>`;
const icon = (d, size, sw = 1.6) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${C.ink}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d.map(p => `<path d="${p}"/>`).join('')}</svg>`;

const G = [];
const add = (file, w, h, body, transparent = false) => G.push({ file, w, h, transparent, body });

// Wordmark for the header (2x).
add('logo.png', 300, 76, `<div style="height:76px;display:flex;align-items:center">${wm(64)}</div>`, true);

// Hero: a planned Moment with one slot left open — the partner's piece.
const slot = (n, tag, on = true) => `<div style="position:relative;width:258px;height:300px;border:2px solid ${C.line};border-radius:24px;background:#fff">
  <div class="g" style="position:absolute;inset:26px 26px 64px"><img src="${cut(n)}"></div>
  <span class="pill ${on ? 'on' : 'off'}" style="position:absolute;left:18px;bottom:18px;font-size:19px;padding:6px 14px">${tag}</span></div>`;
add('hero.png', 1200, 1000, `<div class="a" style="width:1200px;height:1000px">
  <img src="${photo('edWorkday')}" style="position:absolute;left:0;top:0;width:560px;height:1000px;object-fit:cover;object-position:50% 40%;filter:grayscale(1) contrast(1.08)">
  <div style="position:absolute;left:610px;top:64px;right:56px">
    <div class="eb" style="font-size:18px">Moment · Fri 7:30pm · 8°</div>
    <div style="font-weight:700;font-size:44px;letter-spacing:-.035em;margin-top:14px">Dinner in Mayfair</div>
    <div style="border-top:2px solid ${C.ink};margin:26px 0 30px"></div>
    <div style="display:grid;grid-template-columns:258px 258px;gap:18px">
      ${slot('tuxedoBlazer', 'Yours')}${slot('slipDress', 'Yours')}${slot('suedeHeelBoots', 'Yours')}
      <div style="width:258px;height:300px;border:2.5px dashed ${C.ink};border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">
        <div style="width:64px;height:64px;border-radius:50%;background:${C.ink};display:flex;align-items:center;justify-content:center">${icon(['M12 5v14', 'M5 12h14'], 34, 2.2).replace(C.ink, '#fff')}</div>
        <div style="font-weight:700;font-size:28px;letter-spacing:-.02em">Your piece</div>
        <div style="font-size:19px;color:${C.peb};text-align:center;line-height:1.3">The one thing<br>this look needs</div></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:34px;font-size:24px">
      <span style="color:${C.peb}">3 yours · 1 to shop</span><span style="font-weight:700">At your store ↗</span></div>
  </div></div>`);

// Step icons (transparent, 2x of 56px).
[['icon-moment', ['M4 6h16v15H4z', 'M4 10.5h16', 'M8.5 3v4', 'M15.5 3v4']],
 ['icon-wardrobe', ['M12 5.6a1.9 1.9 0 1 1 1.7 1.9v1.5', 'M13.7 9 21 15.8H3L10.3 9']],
 ['icon-shop', ['M5 8h14l-1 13H6L5 8Z', 'M9 8a3 3 0 0 1 6 0']],
 ['icon-feed', ['M4 5h16v14H4z', 'M4 9h16', 'M8 13h8', 'M8 16h5']],
 ['icon-link', ['M7 17 17 7', 'M9 7h8v8']],
 ['icon-check', ['M5 12.5 10 17.5 19 7']],
 ['icon-spark', ['M12 3v4', 'M12 17v4', 'M3 12h4', 'M17 12h4', 'M6 6l2.5 2.5', 'M15.5 15.5 18 18', 'M18 6l-2.5 2.5', 'M8.5 15.5 6 18']],
].forEach(([n, d]) => add(n + '.png', 112, 112, `<div style="width:112px;height:112px;border-radius:50%;border:2.5px solid ${C.ink};display:flex;align-items:center;justify-content:center">${icon(d, 54, 1.6)}</div>`, true));

// Placement: how a partner's piece appears in FORya, with callouts.
add('placement.png', 1200, 860, `<div class="a" style="width:1200px;height:860px">
  <div style="position:absolute;left:70px;top:50px;width:440px;height:760px;border-radius:64px;box-shadow:0 0 0 12px ${C.ink},0 30px 70px -30px rgba(0,0,0,.35);overflow:hidden;background:#fff">
    <div style="position:absolute;left:146px;top:14px;width:148px;height:40px;border-radius:20px;background:#000"></div>
    <div style="position:absolute;left:34px;top:92px;font-size:18px;color:${C.peb}">← Shop your look</div>
    <div style="position:absolute;left:34px;top:138px;font-weight:700;font-size:40px;letter-spacing:-.035em;line-height:1">The pieces<br><span style="font-family:'IS';font-style:italic;font-weight:400">to make it.</span></div>
    <div style="position:absolute;left:34px;right:34px;top:268px;border-top:1.5px solid ${C.line}"></div>
    <div style="position:absolute;left:34px;right:34px;top:290px;display:flex;gap:20px">
      <div class="g" style="width:120px;height:140px;border-radius:16px;background:${C.well};padding:14px"><img src="${cut('shoulderBag')}"></div>
      <div style="flex:1"><div class="eb" style="font-size:14px;color:${C.ink}">Your brand</div>
        <div style="font-weight:700;font-size:24px;margin-top:6px;letter-spacing:-.02em">Leather shoulder bag</div>
        <div style="font-size:17px;color:${C.peb};margin-top:4px">Ivory · One size</div>
        <div style="font-weight:700;font-size:24px;margin-top:10px">£180</div>
        <div style="font-size:17px;margin-top:8px;text-decoration:underline;text-underline-offset:4px">View at your store ↗</div></div></div>
    <div style="position:absolute;left:34px;right:34px;top:460px;border-top:1.5px solid ${C.line}"></div>
    <div style="position:absolute;left:34px;right:34px;top:482px;display:flex;gap:20px;opacity:.55">
      <div class="g" style="width:120px;height:140px;border-radius:16px;background:${C.well};padding:14px"><img src="${cut('cashmereScarf')}"></div>
      <div><div class="eb" style="font-size:14px">Another retailer</div><div style="font-weight:700;font-size:24px;margin-top:6px">Cashmere scarf</div>
        <div style="font-size:17px;color:${C.peb};margin-top:4px">Grey · One size</div><div style="font-weight:700;font-size:24px;margin-top:10px">£95</div></div></div>
    <div style="position:absolute;left:34px;right:34px;bottom:44px;border-radius:18px;background:${C.ink};color:#fff;text-align:center;padding:20px;font-weight:600;font-size:21px">Back to your look</div>
  </div>
  ${[[300, 'Named, priced and pictured', 'Your product data, exactly as you supply it.'],
     [430, 'Shown for a real plan', 'Suggested when a Moment needs it, by date, place, dress code and weather.'],
     [560, 'Bought on your site', 'FORya never takes payment. Every tap goes to your store.']]
    .map(([y, t, s]) => `<div style="position:absolute;left:518px;top:${y + 18}px;width:92px;border-top:2px solid ${C.ink}"></div>
      <div style="position:absolute;left:510px;top:${y + 11}px;width:16px;height:16px;border-radius:50%;background:${C.ink}"></div>
      <div style="position:absolute;left:630px;top:${y}px;width:500px"><div style="font-weight:700;font-size:30px;letter-spacing:-.025em">${t}</div>
      <div style="font-size:22px;color:${C.peb};margin-top:6px;line-height:1.35">${s}</div></div>`).join('')}
</div>`);

// ── email templates ──────────────────────────────────────────────────────
const F = {
  sans: "'Bricolage Grotesque',Helvetica,Arial,sans-serif",
  serif: "'Instrument Serif',Georgia,'Times New Roman',serif",
  mono: "'Geist Mono',Menlo,Consolas,monospace",
};
const eb = t => `<div style="font-family:${F.mono};font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:${C.peb};line-height:16px">${t}</div>`;
const h = (a, b, size = 34, br = false) => `<h1 style="margin:0;font-family:${F.sans};font-size:${size}px;line-height:${Math.round(size * 1.08)}px;font-weight:700;letter-spacing:-1px;color:${C.ink}">${a}${br ? '<br>' : ' '}<span style="font-family:${F.serif};font-style:italic;font-weight:400;letter-spacing:-.3px">${b}</span></h1>`;
const p = (t, extra = '') => `<p style="margin:0 0 16px;font-family:${F.sans};font-size:16px;line-height:25px;color:${C.soft};${extra}">${t}</p>`;
const rule = (c = C.ink, w = 2) => `<tr><td style="padding:0 40px" class="px"><div style="border-top:${w}px solid ${c};font-size:0;line-height:0">&nbsp;</div></td></tr>`;
const space = n => `<tr><td style="height:${n}px;font-size:0;line-height:0">&nbsp;</td></tr>`;
const button = (label, href) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="${C.ink}" style="border-radius:999px">
  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:52px;v-text-anchor:middle;width:240px" arcsize="50%" fillcolor="${C.ink}" stroke="f"><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold">${label}</center></v:roundrect><![endif]-->
  <!--[if !mso]><!--><a href="${href}" style="display:inline-block;padding:16px 34px;font-family:${F.sans};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px">${label}&nbsp;&rarr;</a><!--<![endif]-->
</td></tr></table>`;

function email(v, src) {
  const img = (f, w, alt, style = '') => `<img src="${src}${f}" width="${w}" alt="${alt}" style="display:block;width:100%;max-width:${w}px;height:auto;border:0;outline:none;text-decoration:none;${style}">`;
  const steps = SHARED_HOW.map(([ic, t, s], i) => `
    <tr><td style="padding:0 40px 22px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="56" valign="top"><img src="${src}${ic}.png" width="56" height="56" alt="" style="display:block;border:0"></td>
      <td width="20"></td>
      <td valign="top">${eb('0' + (i + 1))}<div style="font-family:${F.sans};font-size:19px;line-height:24px;font-weight:700;color:${C.ink};margin:4px 0 4px;letter-spacing:-.3px">${t}</div>
        <div style="font-family:${F.sans};font-size:15px;line-height:22px;color:${C.peb}">${s}</div></td></tr></table></td></tr>`).join('');
  const cell = ([ic, t, s]) => `<td class="col" width="50%" valign="top" style="padding:0 10px 26px">
      <img src="${src}${ic}.png" width="40" height="40" alt="" style="display:block;border:0;margin-bottom:12px">
      <div style="font-family:${F.sans};font-size:17px;line-height:22px;font-weight:700;color:${C.ink};letter-spacing:-.2px;margin-bottom:6px">${t}</div>
      <div style="font-family:${F.sans};font-size:15px;line-height:22px;color:${C.peb}">${s}</div></td>`;
  const benefits = [0, 2].map(i => `<tr>${cell(v.why[i])}${cell(v.why[i + 1])}</tr>`).join('');
  const start = v.start.map((t, i) => `<tr><td style="padding:14px 0;border-top:1px solid ${C.line}">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="44" valign="top" style="font-family:${F.mono};font-size:12px;letter-spacing:2px;color:${C.peb};padding-top:3px">0${i + 1}</td>
      <td style="font-family:${F.sans};font-size:16px;line-height:24px;color:${C.ink}">${t}</td></tr></table></td></tr>`).join('');
  const mail = `mailto:{{reply_email}}?subject=${encodeURIComponent(v.mailSubject)}`;

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<title>${v.subject}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=Instrument+Serif:ital@1&family=Geist+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  body{margin:0;padding:0;width:100%!important;background:#FFFFFF}
  table{border-collapse:collapse}img{-ms-interpolation-mode:bicubic}
  a{color:${C.ink}}
  @media (max-width:620px){
    .wrap{width:100%!important}
    .px{padding-left:24px!important;padding-right:24px!important}
    .col{display:block!important;width:100%!important;padding:0 0 22px!important}
    .h1 h1{font-size:30px!important;line-height:33px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#FFFFFF">
<!-- Preheader: the line most inboxes show after the subject. -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#FFFFFF;opacity:0">${v.preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF"><tr><td align="center" style="padding:24px 0">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;background:#FFFFFF">

  <!-- masthead -->
  <tr><td style="padding:8px 40px 14px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="bottom">${eb(v.eyebrow)}</td>
    <td align="right" valign="bottom"><a href="https://forya.onrender.com" style="text-decoration:none"><img src="${src}logo.png" width="118" alt="FORya" style="display:block;border:0;width:118px;height:auto"></a></td>
  </tr></table></td></tr>
  ${rule()}
  ${space(28)}

  <!-- hero -->
  <tr><td style="padding:0 40px" class="px h1">${h(v.h1[0], v.h1[1], 38, true)}</td></tr>
  ${space(18)}
  <tr><td style="padding:0 40px" class="px">${p(v.lede, `font-size:18px;line-height:27px;color:${C.peb};margin:0`)}</td></tr>
  ${space(26)}
  <tr><td style="padding:0 40px" class="px">${img('hero.png', 520, v.heroAlt, `border-radius:14px`)}</td></tr>
  ${space(34)}

  <!-- letter -->
  <tr><td style="padding:0 40px" class="px">
    ${p('Hi {{first_name}},', `color:${C.ink}`)}
    ${v.letter.map(t => p(t)).join('')}
  </td></tr>
  ${space(6)}
  <tr><td style="padding:0 40px" class="px">${button(v.cta, mail)}</td></tr>
  ${space(44)}

  <!-- how it works -->
  ${rule(C.line, 1)}
  ${space(30)}
  <tr><td style="padding:0 40px 8px" class="px">${eb('How FORya works')}</td></tr>
  <tr><td style="padding:0 40px 26px" class="px">${h('Three questions,', 'one complete look.', 28)}</td></tr>
  ${steps}
  ${space(18)}

  <!-- placement -->
  <tr><td style="padding:0 40px" class="px">${img('placement.png', 520, 'How a partner’s product appears in FORya: named, priced and pictured; shown for a real plan; bought on the partner’s own site.', 'border:1px solid ' + C.line + ';border-radius:14px')}</td></tr>
  ${space(44)}

  <!-- why -->
  ${rule(C.line, 1)}
  ${space(30)}
  <tr><td style="padding:0 40px 8px" class="px">${eb(v.whyEyebrow)}</td></tr>
  <tr><td style="padding:0 40px 28px" class="px">${h(v.whyH[0], v.whyH[1], 28)}</td></tr>
  <tr><td style="padding:0 30px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${benefits}</table></td></tr>
  ${space(16)}

  <!-- getting started -->
  <tr><td style="padding:0 40px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px solid ${C.ink};border-radius:16px"><tr><td style="padding:28px 28px 14px">
    ${eb('Getting started')}
    <div style="font-family:${F.sans};font-size:22px;line-height:27px;font-weight:700;color:${C.ink};letter-spacing:-.4px;margin:8px 0 16px">${v.startH}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${start}</table>
  </td></tr></table></td></tr>
  ${space(36)}

  <!-- close -->
  <tr><td style="padding:0 40px" class="px">
    ${v.close.map(t => p(t)).join('')}
    ${space(4)}
  </td></tr>
  <tr><td style="padding:0 40px" class="px">${button(v.cta, mail)}</td></tr>
  ${space(34)}
  <tr><td style="padding:0 40px" class="px">
    <p style="margin:0;font-family:${F.sans};font-size:16px;line-height:24px;color:${C.ink}">Best,</p>
    <p style="margin:2px 0 0;font-family:${F.sans};font-size:16px;line-height:24px;color:${C.ink};font-weight:700">{{sender_name}}</p>
    <p style="margin:0;font-family:${F.sans};font-size:14px;line-height:21px;color:${C.peb}">{{sender_title}}, FORya<br><a href="mailto:{{reply_email}}" style="color:${C.peb}">{{reply_email}}</a></p>
  </td></tr>
  ${space(44)}

  <!-- footer -->
  ${rule()}
  <tr><td style="padding:22px 40px 8px" class="px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="top"><img src="${src}logo.png" width="84" alt="FORya" style="display:block;border:0;width:84px;height:auto"></td>
    <td align="right" valign="top" style="font-family:${F.mono};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.peb}"><a href="https://forya.onrender.com" style="color:${C.ink};text-decoration:none">forya.onrender.com</a></td>
  </tr></table></td></tr>
  <tr><td style="padding:8px 40px 24px" class="px">
    <p style="margin:0;font-family:${F.sans};font-size:12px;line-height:19px;color:${C.stone}">FORya is built by Decusatio Ltd, London, United Kingdom. ${v.footerWhy}
    If you’d rather not hear from us again, <a href="{{unsubscribe_url}}" style="color:${C.peb}">unsubscribe</a> or simply reply “no thanks”.</p>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

const SHARED_HOW = [
  ['icon-moment', 'Tell us the Moment', 'A dinner, an interview, a wedding. Where, when and the dress code.'],
  ['icon-wardrobe', 'We check the weather and the wardrobe', 'The forecast for that place and hour, and the pieces they already own.'],
  ['icon-shop', 'The gap is where you come in', 'If a piece is missing, FORya shows one, with its price and the store that sells it.'],
];

const VARIANTS = {
  brands: {
    file: 'forya-partner-brands.html',
    subject: 'A place for {{brand_name}} in the outfit, not just the feed',
    preheader: 'FORya plans outfits for real plans, and suggests the one piece that completes the look. We’d like it to be yours.',
    eyebrow: 'Brand partnerships',
    h1: ['Be the piece that', 'completes the look.'],
    lede: 'Your catalogue, shown at the moment someone is deciding what to wear, for a plan they’ve already made.',
    heroAlt: 'A planned look for Dinner in Mayfair on Friday at 7:30pm: three pieces the user owns and one open slot labelled “Your piece”.',
    letter: [
      'I’m {{sender_name}}, {{sender_title}} at FORya, an outfit planner built in London. People tell FORya about something they’re going to, and it builds the whole look for it, starting with the clothes they already own.',
      'When a look is missing a piece, FORya suggests one, with a real price and a link to the store that sells it. We’d like that piece to come from <strong style="color:#1A1A1A">{{brand_name}}</strong>, and we’d love to bring your catalogue onto the platform.',
    ],
    cta: 'Let’s talk',
    mailSubject: 'FORya × {{brand_name}}',
    whyEyebrow: 'Why partner with FORya',
    whyH: ['Shown with', 'intent, not interruption.'],
    why: [
      ['icon-moment', 'Seen for a real plan', 'Your pieces appear when a specific Moment needs them, matched to its date, place, dress code and forecast.'],
      ['icon-wardrobe', 'Styled, not listed', 'Each piece is shown inside a complete outfit, next to clothes the shopper already owns.'],
      ['icon-link', 'Every sale is yours', 'FORya never takes payment. Shoppers buy on your own site, through your own checkout.'],
      ['icon-feed', 'Your data, kept accurate', 'We work from your product feed and check images, prices and links, so your listings stay right.'],
    ],
    startH: 'Three steps to go live.',
    start: [
      'Share your product feed: a CSV or XML file, or through your affiliate network.',
      'We map it to FORya’s categories and check every image, price and link.',
      'Your pieces go live in looks, in Discover and on your own brand page.',
    ],
    close: [
      'If this sounds like a fit, reply to this email or book a short call and we’ll walk you through the app and how your catalogue would appear. Terms are something we’d shape together.',
    ],
    footerWhy: 'You’re receiving this because we think {{brand_name}} would be a great fit for FORya.',
  },
  creators: {
    file: 'forya-partner-creators.html',
    subject: 'Your label, styled for real plans',
    preheader: 'We’d love to bring {{brand_name}} onto FORya, the outfit planner that suggests the one piece a look is missing.',
    eyebrow: 'Creator partnerships',
    h1: ['Your label,', 'styled for real plans.'],
    lede: 'Put the pieces you design in front of people planning exactly the kind of Moment you dress for.',
    heroAlt: 'A planned look for Dinner in Mayfair on Friday at 7:30pm: three pieces the user owns and one open slot labelled “Your piece”.',
    letter: [
      'I’m {{sender_name}}, {{sender_title}} at FORya. We’ve loved watching how you style {{brand_name}}, and how your audience dresses for real life rather than for a feed.',
      'FORya is an outfit planner built in London. People tell it about a dinner, an interview or a weekend away, and it builds the look around clothes they already own. When something’s missing, it suggests a piece with its price and a link to the store. We’d love some of those pieces to be yours.',
    ],
    cta: 'I’m interested',
    mailSubject: 'FORya × {{brand_name}}',
    whyEyebrow: 'Why partner with FORya',
    whyH: ['Your pieces,', 'in your audience’s outfits.'],
    why: [
      ['icon-wardrobe', 'Styled with what they own', 'Your designs appear inside complete looks, next to the clothes your customers already have.'],
      ['icon-moment', 'Matched to the Moment', 'Pieces are suggested for a specific plan, by date, place, dress code and weather.'],
      ['icon-link', 'Straight to your store', 'FORya never takes payment. Every tap goes to your own shop.'],
      ['icon-spark', 'A launch-partner feature', 'We’d love to feature {{brand_name}} in our launch content, made together and posted on both our channels.'],
    ],
    startH: 'Simple to get started.',
    start: [
      'Send us your product list, or connect us to your store or affiliate link.',
      'We bring it into FORya and check every image, price and link with you.',
      'Your pieces go live, and we plan a piece of content together.',
    ],
    close: [
      'If you’re open to it, reply here and we’ll set up a quick call to show you the app and talk about what would work for you.',
    ],
    footerWhy: 'You’re receiving this because we admire your work and think {{brand_name}} would be a great fit for FORya.',
  },
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const pg = await b.newPage({ deviceScaleFactor: 1 });
  for (const g of G) {
    await pg.setViewportSize({ width: g.w, height: g.h });
    const gtmp = path.join(HERE, 'preview', '.g.html');
    fs.writeFileSync(gtmp, `<!doctype html><html><head><style>${BASE}</style></head><body>${g.body}</body></html>`);
    await pg.goto('file://' + gtmp, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(OUT, g.file), omitBackground: g.transparent, clip: { x: 0, y: 0, width: g.w, height: g.h } });
  }
  // Templates: one for sending (absolute image URLs), one local preview of each.
  for (const v of Object.values(VARIANTS)) {
    fs.writeFileSync(path.join(HERE, v.file), email(v, HOST));
    const preview = email(v, 'file://' + OUT + '/');
    for (const [w, tag] of [[680, 'desktop'], [390, 'mobile']]) {
      const page = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
      const tmp = path.join(HERE, 'preview', '.tmp.html'); fs.writeFileSync(tmp, preview);
      await page.goto('file://' + tmp, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(HERE, 'preview', v.file.replace('.html', `-${tag}.png`)), fullPage: true });
      await page.close();
    }
  }
  fs.rmSync(path.join(HERE, 'preview', '.tmp.html'), { force: true }); fs.rmSync(path.join(HERE, 'preview', '.g.html'), { force: true });
  await b.close();
  console.log('graphics:', G.length, '· templates:', Object.keys(VARIANTS).length);
})();
