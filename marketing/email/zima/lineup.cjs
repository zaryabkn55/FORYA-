// ZIMA line-up: the collection data, the boutique page inside FORya, and the extra email and
// web sections that showcase it. Used by build.cjs, which passes in its helpers.

const PIECES = [
  ['pink-tweed-swarovski', 'Pink Tweed Swarovski Crystal Coat with Mink Fur Sleeves', 'Tweed & crystal'],
  ['light-pink-mink-swarovski', 'Light pink mink coat with Swarovski crystals', 'Tweed & crystal'],
  ['mink-swarovski', 'Mink coat with Swarovski crystals', 'Tweed & crystal'],
  ['hooded-mink-cashmere', 'Hooded jacket with mink fur and cashmere', 'Mink & chinchilla'],
  ['light-pink-chinchilla', 'Light pink coat with chinchilla fur', 'Mink & chinchilla'],
  ['light-beige-mink-sleeves', 'Light beige coat with mink fur sleeves', 'Mink & chinchilla'],
  ['light-pink-mink-sleeves', 'Light pink coat with mink fur sleeves', 'Mink & chinchilla'],
  ['fox-sleeves-embroidery', 'ZIMA coat with fox sleeves and embroidery', 'Fox-trimmed'],
  ['fox-sleeves', 'ZIMA coat with fox sleeves', 'Fox-trimmed'],
  ['classic-arctic-fox', 'Classic ZIMA coat with arctic fox', 'Fox-trimmed'],
  ['classic-zima-black', 'Classic ZIMA Coat', 'The Classic ZIMA'],
  ['classic-embroidery', 'Classic ZIMA coat with embroidery', 'The Classic ZIMA'],
];
const ARCHIVE = [
  ['so-white-tweed-mink', 'White tweed coat with mink fur'],
  ['so-tweed-sequin-bomber', 'Tweed sequin Bomber'],
  ['so-tweed-classic', 'Tweed Classic ZIMA'],
  ['so-tweed-fox-sleeves', 'Tweed Coat with fox sleeves'],
];
const MOMENTS = [
  ['light-pink-mink-sleeves', 'Winter wedding · Cotswolds', 'Sat 13 Dec · 1pm · 3°', 'Light pink coat with mink fur sleeves', 'A soft colour that photographs beautifully, and warm enough between the church and the reception.'],
  ['classic-zima-black', 'Christmas drinks · Mayfair', 'Fri 12 Dec · 7pm · 4°', 'Classic ZIMA Coat', 'Black with a fox hem: evening-smart over a cocktail dress.'],
  ['hooded-mink-cashmere', 'A weekend in Paris', 'Sat 17 Jan · all day · 7°', 'Hooded jacket with mink fur and cashmere', 'Warm, easy and hooded, for long days on foot.'],
  ['mink-swarovski', 'New Year’s Eve dinner · Chelsea', 'Wed 31 Dec · 8pm · 2°', 'Mink coat with Swarovski crystals', 'Crystals for midnight, mink for two degrees.'],
];
const COLLECTIONS = ['Tweed & crystal', 'Mink & chinchilla', 'Fox-trimmed', 'The Classic ZIMA'];
const BOUTIQUE_NOTES = [
  ['Campaign and story', 'Your imagery and your story at the top, the way you’d dress a showroom window.'],
  ['Shop by Moment', 'Clients browse by what they’re dressing for: a winter wedding, Christmas drinks, a weekend in Paris.'],
  ['Your collections', 'Tweed & crystal, mink & chinchilla, fox-trimmed, the Classic ZIMA, grouped the way you’d group them.'],
  ['The archive', 'Sold-out pieces stay visible, with a waitlist for the next edition.'],
  ['Fittings, booked', 'A direct route to a showroom appointment at Bagista, Knightsbridge.'],
];

module.exports = ({ C, z, svg, F, eb, h, p, sp, rule }) => {
  // ── the boutique page, as it would look inside the app (390px wide, any height) ──
  const pc = (s, name, w = 150, ht = 176) => `<div style="flex:none;width:${w}px">
    <div style="height:${ht}px;border-radius:14px;overflow:hidden;background:${C.well}"><img class="ph" src="${z(s)}" style="object-position:50% 25%"></div>
    <div style="font-size:12px;font-weight:600;line-height:1.25;margin-top:7px">${name}</div>
    <div style="font-size:11px;color:${C.peb};margin-top:2px">Price on request</div></div>`;
  const secHead = (t, s) => `<div style="display:flex;justify-content:space-between;align-items:baseline;margin:0 0 12px">
    <div style="font-weight:700;font-size:19px;letter-spacing:-.025em">${t}</div><div style="font-size:12px;color:${C.peb}">${s}</div></div>`;
  const boutique = () => `<div style="width:390px;background:#fff;font-family:'BG';color:${C.ink};padding-bottom:40px">
    <div style="position:relative;height:470px;overflow:hidden">
      <img class="ph" src="${z('light-pink-mink-sleeves')}" style="object-position:50% 20%">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.28) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%)"></div>
      <div style="position:absolute;left:20px;right:20px;top:60px;display:flex;justify-content:space-between;color:#fff;font-size:13px;font-weight:600"><span>← Brands</span>${svg(['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z'], 20, '#fff', 1.8)}</div>
      <div style="position:absolute;left:24px;right:24px;bottom:24px;color:#fff">
        <div style="font-weight:700;font-size:40px;letter-spacing:.16em;line-height:1">ZIMA</div>
        <div style="font-family:'GM';font-size:10px;letter-spacing:.34em;margin-top:6px">ATELIER</div>
        <div style="font-size:14px;line-height:1.4;margin-top:12px;max-width:290px">Handcrafted outerwear in limited editions, from Italian fabrics with fur details.</div></div>
    </div>
    <div style="padding:18px 20px 0;display:flex;gap:8px">
      <div style="flex:1;border-radius:12px;background:${C.ink};color:#fff;text-align:center;padding:12px;font-weight:600;font-size:13.5px">Book a fitting</div>
      <div style="flex:1;border-radius:12px;border:1.4px solid ${C.ink};text-align:center;padding:11px;font-weight:600;font-size:13.5px">Follow ZIMA</div></div>
    <div style="padding:12px 20px 0;font-size:12px;color:${C.peb}">Knightsbridge, London · ${PIECES.length} pieces available · Limited editions</div>

    <div style="padding:28px 0 0 20px">${secHead('New this season', 'Autumn 2025–26&nbsp;&nbsp;&nbsp;&nbsp;')}
      <div style="display:flex;gap:10px;overflow:hidden">${pc('pink-tweed-swarovski', 'Pink Tweed Swarovski Crystal Coat')}${pc('light-pink-chinchilla', 'Light pink coat with chinchilla fur')}${pc('hooded-mink-cashmere', 'Hooded jacket with mink fur')}</div></div>

    <div style="padding:28px 20px 0">${secHead('Shop by Moment', '')}
      <div style="display:flex;flex-wrap:wrap;gap:7px">${['Winter wedding', 'Christmas drinks', 'Afternoon tea', 'City weekend', 'New Year’s Eve', 'Theatre night'].map((t, i) => `<span class="pill ${i ? 'off' : 'on'}" style="font-size:12px;padding:6px 13px">${t}</span>`).join('')}</div>
      <div style="display:flex;gap:10px;margin-top:14px">${pc('light-pink-mink-sleeves', 'Light pink coat with mink fur sleeves', 170, 196)}${pc('classic-arctic-fox', 'Classic ZIMA coat with arctic fox', 170, 196)}</div></div>

    <div style="padding:28px 20px 0">${secHead('Collections', '4')}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${[['Tweed & crystal', 'mink-swarovski'], ['Mink & chinchilla', 'light-beige-mink-sleeves'], ['Fox-trimmed', 'classic-arctic-fox'], ['The Classic ZIMA', 'classic-embroidery']].map(([t, s]) =>
          `<div style="position:relative;height:150px;border-radius:14px;overflow:hidden"><img class="ph" src="${z(s)}" style="object-position:50% 25%">
            <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.55))"></div>
            <div style="position:absolute;left:12px;bottom:10px;color:#fff;font-weight:700;font-size:14px">${t}<div style="font-weight:400;font-size:11px;opacity:.9">${PIECES.filter(x => x[2] === t).length} pieces</div></div></div>`).join('')}</div></div>

    <div style="padding:28px 20px 0">${secHead('The archive', 'Sold out')}
      <div style="font-size:12.5px;line-height:1.45;color:${C.peb};margin:-4px 0 12px">Every coat is a limited edition. Join a waitlist and hear first when the next edition arrives.</div>
      <div style="display:flex;gap:10px">${ARCHIVE.slice(0, 2).map(([s, n]) => `<div style="flex:1"><div style="position:relative;height:170px;border-radius:14px;overflow:hidden"><img class="ph" src="${z(s)}" style="object-position:50% 25%;filter:grayscale(.85) brightness(1.08);opacity:.7">
        <span class="pill on" style="position:absolute;left:8px;top:8px;font-size:10px;padding:3px 9px">Sold out</span></div>
        <div style="font-size:12px;font-weight:600;margin-top:7px">${n}</div><div style="font-size:11.5px;margin-top:3px;text-decoration:underline">Join the waitlist</div></div>`).join('')}</div></div>

    <div style="margin:28px 20px 0;border:1px solid ${C.line};border-radius:16px;padding:16px;display:flex;gap:14px;align-items:center">
      <div style="width:44px;height:44px;border-radius:50%;background:${C.well};display:flex;align-items:center;justify-content:center;flex:none">${svg(['M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z', 'M12 12.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z'], 22)}</div>
      <div style="flex:1"><div style="font-weight:700;font-size:14px">Visit the showroom</div><div style="font-size:12px;color:${C.peb};margin-top:2px">Bagista, Knightsbridge · by appointment</div></div>
      <span class="pill off" style="font-size:11px;padding:5px 11px">Book</span></div>
  </div>`;

  // ── email sections ──────────────────────────────────────────────────────
  const T = (x = '') => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${x}>`;
  const VIEW = 'https://forya.onrender.com/email/zima/view.html';
  const emailSections = src => {
    const img = (f, w, alt, st = '') => `<img src="${src}zima/${f}" width="${w}" alt="${alt}" style="display:block;width:100%;max-width:${w}px;height:auto;border:0;${st}">`;
    const tile = ([s, n, c]) => `<td class="t3" width="33.33%" valign="top" style="padding:0 6px 20px">
        ${img('pieces/' + s + '.jpg', 168, n, 'border-radius:10px')}
        <div style="font-family:${F.sans};font-size:13px;line-height:17px;font-weight:600;color:${C.ink};margin-top:8px">${n}</div>
        <div style="font-family:${F.mono};font-size:9.5px;letter-spacing:1.4px;text-transform:uppercase;color:${C.peb};margin-top:4px">${c}</div></td>`;
    const rows = [];
    for (let i = 0; i < PIECES.length; i += 3) rows.push(`<tr>${PIECES.slice(i, i + 3).map(tile).join('')}</tr>`);
    const moment = ([s, m, when, piece, why], i) => `<tr><td style="padding:16px 0;${i ? `border-top:1px solid ${C.line};` : ''}">${T()}<tr>
        <td width="96" valign="top">${img('pieces/' + s + '.jpg', 96, piece, 'border-radius:10px')}</td><td width="18"></td>
        <td valign="top">${eb(when)}
          <div style="font-family:${F.sans};font-size:18px;line-height:23px;font-weight:700;color:${C.ink};letter-spacing:-.3px;margin:4px 0 6px">${m}</div>
          <div style="font-family:${F.sans};font-size:14px;line-height:20px;color:${C.ink}">&rarr; <b>ZIMA Atelier</b>, ${piece}</div>
          <div style="font-family:${F.sans};font-size:14px;line-height:20px;color:${C.peb};margin-top:4px">${why}</div></td></tr></table></td></tr>`;
    const arch = ([s, n]) => `<td class="t4" width="25%" valign="top" style="padding:0 5px">
        ${img('pieces/' + s + '.jpg', 124, n + ' (sold out)', 'border-radius:10px')}
        <div style="font-family:${F.sans};font-size:12px;line-height:16px;font-weight:600;color:${C.ink};margin-top:7px">${n}</div>
        <div style="font-family:${F.sans};font-size:12px;line-height:16px;color:${C.peb};margin-top:2px;text-decoration:underline">Join the waitlist</div></td>`;

    return `
<!-- boutique -->
<tr><td style="padding:0 40px 8px" class="px">${eb('Your boutique on FORya')}</td></tr>
<tr><td style="padding:0 40px 14px" class="px">${h('Not a listing.', 'A boutique.', 28)}</td></tr>
<tr><td style="padding:0 40px 18px" class="px">${p('Most platforms give a brand a row of products. We’d give ZIMA a boutique: your campaign, your collections and your way of selling, inside the app your clients use to plan what they wear.', 'margin:0')}</td></tr>
<tr><td style="padding:0 30px" class="px">${T()}<tr>
  <td class="col" width="250" valign="top" style="padding:0 10px 24px">${img('boutique.gif', 230, 'Animated: the ZIMA boutique page in FORya scrolling from the campaign header through New this season, Shop by Moment, Collections, the Archive and showroom booking.', 'margin:0 auto')}</td>
  <td class="col" valign="middle" style="padding:0 10px 24px">${T()}
    ${BOUTIQUE_NOTES.map(([t, d], i) => `<tr><td style="padding:${i ? 13 : 0}px 0 13px;${i ? `border-top:1px solid ${C.line};` : ''}">
      <div style="font-family:${F.sans};font-size:16px;line-height:21px;font-weight:700;color:${C.ink};margin:0 0 3px">${t}</div>
      <div style="font-family:${F.sans};font-size:14px;line-height:20px;color:${C.peb}">${d}</div></td></tr>`).join('')}
  </table></td></tr></table></td></tr>
${sp(18)}${rule(C.line, 1)}${sp(30)}

<!-- line-up -->
<tr><td style="padding:0 40px 8px" class="px">${eb('The line-up')}</td></tr>
<tr><td style="padding:0 40px 14px" class="px">${h('Twelve pieces,', 'ready for their Moments.', 28)}</td></tr>
<tr><td style="padding:0 40px 22px" class="px">${p('Everything currently available on zimaatelier.com, organised into four collections. Each piece carries its own story, its fabrics and fur, and is matched to the Moments it suits.', 'margin:0')}</td></tr>
<tr><td style="padding:0 34px" class="px">${T()}${rows.join('')}</table></td></tr>
${sp(10)}${rule(C.line, 1)}${sp(30)}

<!-- matched to the moment -->
<tr><td style="padding:0 40px 8px" class="px">${eb('Matched to the Moment')}</td></tr>
<tr><td style="padding:0 40px 14px" class="px">${h('The right coat,', 'for the right night.', 28)}</td></tr>
<tr><td style="padding:0 40px 10px" class="px">${p('FORya reads each Moment’s place, time, forecast and dress code, then suggests the piece that completes it. This winter, these are the kinds of plans your coats would be suggested for:', 'margin:0')}</td></tr>
<tr><td style="padding:0 40px" class="px">${T()}${MOMENTS.map(moment).join('')}</table></td></tr>
${sp(20)}${rule(C.line, 1)}${sp(30)}

<!-- archive -->
<tr><td style="padding:0 40px 8px" class="px">${eb('Sold out, still working for you')}</td></tr>
<tr><td style="padding:0 40px 14px" class="px">${h('Limited editions,', 'without the dead ends.', 28)}</td></tr>
<tr><td style="padding:0 40px 22px" class="px">${p('When a ZIMA coat sells out, it doesn’t vanish. It moves to your archive with a waitlist, so a client who falls for it can ask to hear when the next edition is ready, and you can see how many clients are waiting.', 'margin:0')}</td></tr>
<tr><td style="padding:0 35px" class="px">${T()}<tr>${ARCHIVE.map(arch).join('')}</tr></table></td></tr>
${sp(26)}
<tr><td style="padding:0 40px" class="px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td>
  <a href="${VIEW}#lineup" style="display:inline-block;border:1.5px solid ${C.ink};border-radius:999px;padding:13px 26px;font-family:${F.sans};font-size:15px;font-weight:600;color:${C.ink};text-decoration:none">Browse the full line-up &rarr;</a></td></tr></table></td></tr>
${sp(30)}${rule(C.line, 1)}${sp(30)}
`;
  };

  // ── web-version sections, styles and behaviour ──────────────────────────
  const viewCSS = `
.boutique{position:relative;height:340vh;border-top:1px solid var(--line)}
.bq-stick{position:sticky;top:64px;height:calc(100vh - 64px);display:grid;grid-template-columns:minmax(260px,400px) 1fr;gap:72px;align-items:center}
.bq-phone{position:relative;width:min(100%,340px);aspect-ratio:414/804;justify-self:center}
.bq-frame{position:absolute;inset:1.5% 2.9%;border-radius:12.5% / 6.4%;overflow:hidden;box-shadow:0 0 0 10px var(--ink),0 40px 80px -40px rgba(0,0,0,.4);background:#fff}
.bq-frame img{position:absolute;left:0;top:0;width:100%;will-change:transform}
.bq-isl{position:absolute;left:50%;top:2.6%;width:30%;height:4%;transform:translateX(-50%);background:#000;border-radius:999px;z-index:2}
.bq-notes{list-style:none}
.bq-notes li{padding:20px 0;border-top:1px solid var(--line);opacity:.3;transition:opacity .4s}
.bq-notes li.on{opacity:1}
.bq-notes b{display:block;font-size:24px;letter-spacing:-.025em;margin-bottom:6px}
.bq-notes span{font-size:17px;line-height:1.55;color:var(--peb)}
.lineup{padding:110px 0 40px;border-top:1px solid var(--line)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:30px 0 26px}
.chip{font:600 14px 'Bricolage Grotesque',sans-serif;border:1.5px solid var(--ink);background:#fff;color:var(--ink);border-radius:999px;padding:9px 16px;cursor:pointer;transition:background .2s,color .2s}
.chip[aria-pressed="true"]{background:var(--ink);color:#fff}
.pieces{display:grid;grid-template-columns:repeat(4,1fr);gap:28px 18px}
.piece{transition:opacity .35s,transform .35s}
.piece.hide{display:none}
.piece .im{aspect-ratio:6/7;border-radius:16px;overflow:hidden;background:var(--well)}
.piece img{width:100%;height:100%;object-fit:cover;object-position:50% 25%;transition:transform .8s cubic-bezier(.2,.7,.1,1)}
.piece:hover img{transform:scale(1.04)}
.piece b{display:block;font-size:15px;line-height:1.3;margin-top:12px;letter-spacing:-.01em}
.piece span{font-family:'Geist Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--peb);display:block;margin-top:5px}
.moments{padding:110px 0 40px;border-top:1px solid var(--line)}
.mrow{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;padding:30px 0 14px;scrollbar-width:thin}
.mcard{flex:none;width:min(78vw,340px);scroll-snap-align:start;border:1px solid var(--line);border-radius:20px;overflow:hidden;background:#fff}
.mcard .im{height:300px}.mcard img{width:100%;height:100%;object-fit:cover;object-position:50% 22%}
.mcard .tx{padding:18px 20px 22px}
.mcard h4{font-size:21px;letter-spacing:-.025em;margin:8px 0 8px}
.mcard p{font-size:15px;line-height:1.5;color:var(--peb)}
.mcard .pc{font-size:15px;line-height:1.4;margin-top:4px}
.archive{padding:110px 0 40px;border-top:1px solid var(--line)}
.arch{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:30px}
.arch .im{position:relative;aspect-ratio:6/7;border-radius:16px;overflow:hidden}
.arch img{width:100%;height:100%;object-fit:cover;object-position:50% 25%;filter:grayscale(.85) brightness(1.06);opacity:.75}
.arch .so{position:absolute;left:12px;top:12px;background:var(--ink);color:#fff;font-size:12px;font-weight:600;border-radius:999px;padding:4px 11px}
.arch b{display:block;font-size:15px;margin-top:12px}
.wl{margin-top:8px;font:600 14px 'Bricolage Grotesque',sans-serif;background:none;border:0;border-bottom:1.5px solid var(--ink);padding:0 0 2px;cursor:pointer;color:var(--ink)}
.wl.done{border-color:transparent;color:var(--peb)}
@media (max-width:820px){
  .boutique{height:300vh}
  .bq-stick{grid-template-columns:1fr;gap:18px;align-content:center}
  .bq-phone{width:min(46vw,200px)}
  .bq-notes li{padding:10px 0;display:none}.bq-notes li.on{display:block}
  .bq-notes b{font-size:20px}
  .pieces{grid-template-columns:repeat(2,1fr)}
  .arch{grid-template-columns:repeat(2,1fr)}
}`;
  const viewHTML = () => `
<section class="boutique" id="boutique"><div class="wrap bq-stick">
  <div class="bq-phone"><div class="bq-isl"></div><div class="bq-frame"><img id="bqimg" src="boutique-long.jpg" alt="The ZIMA boutique page inside FORya"></div></div>
  <div><div class="eb">Your boutique on FORya</div><h2 style="margin-bottom:22px">Not a listing. <em>A boutique.</em></h2>
    <ul class="bq-notes" id="bqnotes">${BOUTIQUE_NOTES.map(([t, d], i) => `<li${i ? '' : ' class="on"'}><b>${t}</b><span>${d}</span></li>`).join('')}</ul></div>
</div></section>

<section class="lineup wrap" id="lineup">
  <div class="rv"><div class="eb">The line-up</div><h2>Twelve pieces, <em>ready for their Moments.</em></h2>
  <p class="lede" style="margin-top:16px">Everything currently available on zimaatelier.com, organised into four collections, the way your boutique would show them.</p></div>
  <div class="chips rv" role="group" aria-label="Filter by collection">
    <button class="chip" aria-pressed="true" data-c="all">All ${PIECES.length}</button>
    ${COLLECTIONS.map(c => `<button class="chip" aria-pressed="false" data-c="${c}">${c} ${PIECES.filter(x => x[2] === c).length}</button>`).join('')}</div>
  <div class="pieces">${PIECES.map(([s, n, c], i) => `<div class="piece rv" data-c="${c}" style="transition-delay:${(i % 4) * 0.07}s"><div class="im"><img src="pieces/${s}.jpg" alt="${n}" loading="lazy"></div><b>${n}</b><span>${c}</span></div>`).join('')}</div>
</section>

<section class="moments wrap">
  <div class="rv"><div class="eb">Matched to the Moment</div><h2>The right coat, <em>for the right night.</em></h2>
  <p class="lede" style="margin-top:16px">FORya reads each Moment’s place, time, forecast and dress code, then suggests the piece that completes it. Swipe through a few of the plans this winter might bring.</p></div>
  <div class="mrow">${MOMENTS.map(([s, m, w, piece, why]) => `<article class="mcard"><div class="im"><img src="pieces/${s}.jpg" alt="${piece}" loading="lazy"></div>
    <div class="tx"><div class="eb">${w}</div><h4>${m}</h4><div class="pc">→ <b>ZIMA Atelier</b>, ${piece}</div><p style="margin-top:8px">${why}</p></div></article>`).join('')}</div>
</section>

<section class="archive wrap">
  <div class="rv"><div class="eb">Sold out, still working for you</div><h2>Limited editions, <em>without the dead ends.</em></h2>
  <p class="lede" style="margin-top:16px">When a coat sells out it moves to your archive with a waitlist, so clients can ask to hear about the next edition, and you can see how many are waiting.</p></div>
  <div class="arch">${ARCHIVE.map(([s, n]) => `<div class="rv"><div class="im"><img src="pieces/${s}.jpg" alt="${n} (sold out)" loading="lazy"><span class="so">Sold out</span></div><b>${n}</b><button class="wl" type="button">Join the waitlist</button></div>`).join('')}</div>
  <p class="eb" style="margin-top:22px;letter-spacing:.12em;text-transform:none">Preview only: the waitlist buttons here are a demonstration.</p>
</section>`;
  const viewJS = `
  // boutique: page scroll drives the phone's own scroll
  const bq = document.getElementById('boutique'), bqimg = document.getElementById('bqimg'), notes = [...document.querySelectorAll('#bqnotes li')];
  const bqTick = () => {
    const r = bq.getBoundingClientRect(), span = r.height - innerHeight, t = Math.min(1, Math.max(0, -r.top / span));
    const frame = bqimg.parentElement, max = bqimg.offsetHeight - frame.offsetHeight;
    bqimg.style.transform = 'translateY(' + (-max * (reduce ? 0 : t)).toFixed(1) + 'px)';
    const k = Math.min(notes.length - 1, Math.floor(t * notes.length));
    notes.forEach((n, i) => n.classList.toggle('on', i === k));
  };
  addEventListener('scroll', () => requestAnimationFrame(bqTick), { passive: true }); addEventListener('resize', bqTick); bqimg.addEventListener('load', bqTick); bqTick();
  // line-up filter
  const chips = [...document.querySelectorAll('.chip')], cards = [...document.querySelectorAll('.piece')];
  chips.forEach(ch => ch.addEventListener('click', () => {
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === ch)));
    cards.forEach(card => { const show = ch.dataset.c === 'all' || card.dataset.c === ch.dataset.c; card.classList.toggle('hide', !show); if (show) { card.classList.add('in'); } });
  }));
  // waitlist demo
  document.querySelectorAll('.wl').forEach(b => b.addEventListener('click', () => { b.textContent = 'On the waitlist ✓'; b.classList.add('done'); }));`;

  return { PIECES, ARCHIVE, MOMENTS, boutique, emailSections, viewCSS, viewHTML, viewJS };
};
