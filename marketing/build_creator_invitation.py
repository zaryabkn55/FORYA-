"""FORya · a collaboration invitation, addressed to one creator.

Ten landscape slides at 297x167mm. This replaces the first draft, which read like an
internal strategy deck: it argued with itself about reach, explained our ASA exposure
and set out why we were being selective. None of that is a creator's business.

What is left is addressed to one person: who we are in four lines, what we'd like them
to make, how to shoot it, what they get paid. Everything Zaryab fills in before sending
prints in flame.
"""
import base64, pathlib, subprocess

FONTS = pathlib.Path("/tmp/claude-0/-home-claude/60053dfc-c740-5fe2-9f5d-955d7badfb41/scratchpad/brandfonts/node_modules/@fontsource")
OUT   = pathlib.Path("/home/claude/work/FORYA/marketing")
OUT.mkdir(parents=True, exist_ok=True)

def face(pkg, fname, family, weight, style="normal"):
    b = base64.b64encode((FONTS / pkg / "files" / fname).read_bytes()).decode()
    return (f"@font-face{{font-family:'{family}';font-weight:{weight};font-style:{style};"
            f"font-display:block;src:url(data:font/woff2;base64,{b}) format('woff2')}}")

FACES = "".join([
    face("bricolage-grotesque", "bricolage-grotesque-latin-400-normal.woff2", "BG", 400),
    face("bricolage-grotesque", "bricolage-grotesque-latin-500-normal.woff2", "BG", 500),
    face("bricolage-grotesque", "bricolage-grotesque-latin-600-normal.woff2", "BG", 600),
    face("bricolage-grotesque", "bricolage-grotesque-latin-700-normal.woff2", "BG", 700),
    face("bricolage-grotesque", "bricolage-grotesque-latin-800-normal.woff2", "BG", 800),
    face("instrument-serif",    "instrument-serif-latin-400-italic.woff2",    "IS", 400, "italic"),
    face("geist-mono",          "geist-mono-latin-400-normal.woff2",          "GM", 400),
    face("geist-mono",          "geist-mono-latin-500-normal.woff2",          "GM", 500),
])

INK, SOFT, PEB, STONE = "#18181B", "#3F3F46", "#6B6B76", "#8C8C97"
LINE, PANEL, SURF     = "#E4E4E7", "#F5F5F6", "#FAFAFA"
FLAME, DEEP, WASH     = "#F05A1E", "#C2410C", "#FFF2EA"

CSS = f"""
*{{margin:0;padding:0;box-sizing:border-box}}
@page{{size:297mm 167mm;margin:0}}
html,body{{background:#fff;color:{INK};font-family:'BG',Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased}}
.pg{{position:relative;width:297mm;height:167mm;overflow:hidden;background:#fff;
  padding:17mm 20mm 13mm;page-break-after:always;display:flex;flex-direction:column}}
.pg:last-child{{page-break-after:auto}}

.wm{{font-size:0;white-space:nowrap;line-height:1}}
.wm .wf,.wm .wy{{display:inline;color:inherit;white-space:nowrap}}
.wm .wf{{font-family:'BG';font-weight:800;letter-spacing:-.06em;font-size:1em}}
.wm .wy{{font-family:'IS';font-style:italic;font-weight:400;letter-spacing:-.02em;
  padding-left:.02em;font-size:1em}}
.wm-24{{font-size:24px}} .wm-19{{font-size:19px}} .wm-h{{font-size:1em}}

.eb{{font-family:'GM';font-size:8px;font-weight:500;letter-spacing:.2em;
  text-transform:uppercase;color:{STONE};display:flex;align-items:center;gap:7px}}
.eb::before{{content:"";width:4px;height:4px;border-radius:50%;background:{FLAME};flex:none}}

h2{{font-family:'BG';font-weight:700;font-size:35px;line-height:1.08;letter-spacing:-.035em;
  margin:5mm 0 0;max-width:215mm}}
h2 em{{font-family:'IS';font-style:italic;font-weight:400;letter-spacing:-.012em}}
.lede{{font-size:14.5px;line-height:1.6;color:{PEB};max-width:140mm;margin-top:4mm}}
.body-z{{flex:1;display:flex;flex-direction:column;justify-content:center;margin-top:7mm;
  padding-bottom:4mm}}
.folio{{position:absolute;left:20mm;right:20mm;bottom:7mm;display:flex;
  justify-content:space-between;font-family:'GM';font-size:7.5px;letter-spacing:.14em;
  text-transform:uppercase;color:{STONE}}}

p{{font-size:13.5px;line-height:1.68;color:{SOFT}}}
.sm{{font-size:12px;line-height:1.6;color:{PEB}}}
.quiet{{color:{PEB};font-size:12px;line-height:1.6}}
.fill{{color:{DEEP};font-family:'GM';font-size:.9em;letter-spacing:.02em}}
.rule{{height:1px;background:{LINE};margin:7mm 0}}

.g2{{display:grid;grid-template-columns:1fr 1fr;gap:12mm}}
.g3{{display:grid;grid-template-columns:repeat(3,1fr);gap:7mm}}
.card{{border:1px solid {LINE};border-radius:3mm;padding:9mm}}
.card.soft{{background:{SURF}}}
.card.flamed{{background:{WASH};border-color:{FLAME}}}
.card h3{{font-size:16px;font-weight:700;letter-spacing:-.022em;margin-bottom:3.5mm;line-height:1.2}}
.n{{font-family:'GM';font-size:8px;letter-spacing:.16em;color:{FLAME};margin-bottom:3mm;display:block}}

ul{{list-style:none}}
li{{font-size:13px;line-height:1.6;color:{SOFT};padding-left:8mm;position:relative;margin-bottom:4.5mm}}
li::before{{content:"";position:absolute;left:0;top:8px;width:4mm;height:1px;background:{FLAME}}}
li b{{font-weight:600;color:{INK}}}

table{{width:100%;border-collapse:collapse;font-size:13px}}
th{{font-family:'GM';font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:{STONE};
  text-align:left;padding:0 0 3mm;border-bottom:1px solid {LINE};font-weight:500}}
td{{padding:5.5mm 0;border-bottom:1px solid {LINE};color:{SOFT};vertical-align:top}}
tr:last-child td{{border-bottom:0}}
td:first-child{{font-weight:600;color:{INK};width:50mm}}
td.num{{text-align:right;font-family:'GM';font-size:12px;color:{INK};width:40mm}}

/* the brand row — artwork slots, since logo files are the brands' own */
.brands{{display:flex;gap:5mm;margin-top:3mm}}
.brands div{{flex:1;border:1px solid {LINE};border-radius:2.5mm;height:22mm;
  display:flex;align-items:center;justify-content:center;background:{SURF}}}
.brands span{{font-family:'GM';font-size:9px;letter-spacing:.1em;color:{PEB}}}

/* cover */
.cover{{justify-content:space-between;padding:20mm}}
.cv-rule{{width:46mm;height:2px;background:{FLAME};margin:7mm 0}}
.big{{font-family:'BG';font-weight:700;font-size:54px;line-height:1.08;letter-spacing:-.038em}}
.big em{{font-family:'IS';font-style:italic;font-weight:400;letter-spacing:-.015em}}
.to{{font-family:'IS';font-style:italic;font-size:30px;color:{SOFT};letter-spacing:-.01em}}
"""

W = '<span class="wm wm-{s}"><span class="wf">FOR</span><span class="wy">ya</span></span>'
def wm(size): return W.format(s=size)

PAGES = []
def page(body, num="", section="", cls=""):
    foot = (f'<div class="folio"><span>{section}</span><span>{num}</span></div>') if num else ""
    PAGES.append(f'<section class="pg {cls}">{body}{foot}</section>')

# ── 01 cover, addressed ─────────────────────────────────────────────────────
page(f"""
  <div>{wm(24)}</div>
  <div>
    <p class="eb">A collaboration</p>
    <div class="cv-rule"></div>
    <div class="big" style="max-width:185mm">Prepared for<br>
    <em><span class="fill" style="font-size:.86em">[ creator name ]</span></em></div>
    <p class="lede" style="margin-top:8mm;max-width:120mm">We'd love you to make one piece of
    content with us. Here's who we are and exactly what we're asking for.</p>
  </div>
  <div class="folio" style="position:static;margin-top:auto">
    <span><span class="fill">[ @handle ]</span></span>
    <span><span class="fill">[ month 2026 ]</span></span>
  </div>
""", cls="cover")

# ── 02 hello ────────────────────────────────────────────────────────────────
page(f"""
  <p class="eb">Hello</p>
  <h2>We've been watching your feed <em>for a while.</em></h2>
  <div class="body-z">
    <div class="g2">
      <div>
        <p><span class="fill">[ One or two sentences, written by you, about this specific
        creator — a post you liked, why their audience fits, what made you pick them. Keep it
        true and keep it short. This is the only part of the deck they'll know was written for
        them. ]</span></p>
      </div>
      <div>
        <p>We're a small London team building {wm(19)}, and we're asking a handful of creators
        to show it in their own voice rather than ours.</p>
        <p style="margin-top:4mm">No script, no shot list, no approval committee. One video,
        a few Stories, paid properly. The next few pages cover the whole thing.</p>
      </div>
    </div>
  </div>
""", "02", "Hello")

# ── 03 about us ─────────────────────────────────────────────────────────────
page(f"""
  <p class="eb">About us</p>
  <h2>{wm("h")} plans the outfit, <em>so you don’t have to.</em></h2>
  <div class="body-z">
    <p class="lede" style="max-width:195mm;margin-bottom:9mm">You tell the app what you've got
    on — a dinner, an interview, a wedding in a field in October. It reads the date, the place
    and the weather, looks at what's already in your wardrobe, and builds the whole look.</p>
    <div class="g3">
      <div class="card soft">
        <span class="n">01</span>
        <h3>It starts with the plan</h3>
        <p class="sm">Not a feed to scroll. You put in the thing you're actually going to, and
        the outfit comes back around it.</p>
      </div>
      <div class="card soft">
        <span class="n">02</span>
        <h3>It uses what you own</h3>
        <p class="sm">Photograph clothes from your own wardrobe and they become part of every
        future look. The cut-out happens on your phone.</p>
      </div>
      <div class="card soft">
        <span class="n">03</span>
        <h3>It shows you the gap</h3>
        <p class="sm">If a piece is missing, it tells you what it costs and where to get it.
        You buy from the retailer, not from us.</p>
      </div>
    </div>
  </div>
""", "03", "About us")

# ── 04 the brands inside ────────────────────────────────────────────────────
page(f"""
  <p class="eb">The company we keep</p>
  <h2>Real catalogues from brands <em>you already shop.</em></h2>
  <div class="body-z">
    <p class="lede" style="max-width:190mm">FORya isn't a mood board. The pieces in it come from
    live retail catalogues, with real prices and real stock, connected directly to the app.</p>
    <div class="brands" style="margin-top:9mm">
      <div><span>M&amp;S</span></div>
      <div><span>JOHN LEWIS</span></div>
      <div><span>MYTHERESA</span></div>
      <div><span class="fill">[ brand ]</span></div>
      <div><span class="fill">[ brand ]</span></div>
    </div>
    <p class="quiet" style="margin-top:8mm;max-width:190mm">More joining through the autumn. You
    can say the app works with connected catalogues from these retailers — please don't say they
    sponsor or endorse it, because that's a different thing and not one we've claimed.</p>
  </div>
""", "04", "The company we keep")

# ── 05 your brief ───────────────────────────────────────────────────────────
page(f"""
  <p class="eb">Your brief</p>
  <h2>One real Moment from your week.</h2>
  <div class="body-z">
    <div class="g2">
      <div class="card flamed">
        <span class="n">THE IDEA WE HAD FOR YOU</span>
        <h3><span class="fill" style="font-size:.9em">[ the angle, in a line ]</span></h3>
        <p class="sm"><span class="fill">[ Two or three sentences describing the specific video
        you'd like from this creator. Pick one of the four below, or write your own around
        something already in their diary. ]</span></p>
      </div>
      <div>
        <p style="margin-bottom:5mm">If something else fits you better, take it. These are the
        four that work best:</p>
        <ul style="margin-bottom:0">
          <li><b>I've got a thing on Friday.</b> A real plan, three questions, a finished outfit.</li>
          <li><b>The wardrobe already knows.</b> You photograph six things you own and it builds
          from them.</li>
          <li><b>And then it rained.</b> The forecast turns, the outfit changes with it.</li>
          <li><b>Planned it last night.</b> A get-ready-with-me where the deciding already
          happened.</li>
        </ul>
      </div>
    </div>
  </div>
""", "05", "Your brief")

# ── 06 what to send ─────────────────────────────────────────────────────────
page(f"""
  <p class="eb">What we'd love back</p>
  <h2>One video, a few Stories, <em>and the raw files.</em></h2>
  <div class="body-z">
    <table>
      <thead><tr><th>Deliverable</th><th>Detail</th><th class="num">Due</th></tr></thead>
      <tbody>
        <tr><td>Feed video</td>
          <td>20–40 seconds, vertical 9:16, posted to both TikTok and Instagram Reels. The same
          cut is fine; write each caption however suits the platform.</td>
          <td class="num"><span class="fill">[ date ]</span></td></tr>
        <tr><td>Stories</td>
          <td>Three to five frames using the app, with the link sticker on the last one.</td>
          <td class="num"><span class="fill">[ date ]</span></td></tr>
        <tr><td>Raw footage</td>
          <td>Your unedited clips and screen recordings, in one folder.</td>
          <td class="num"><span class="fill">[ date ]</span></td></tr>
        <tr><td>Usage</td>
          <td>Permission for us to run the video as a paid ad on TikTok and Meta for
          <span class="fill">[ 60 ]</span> days. Included in the fee.</td>
          <td class="num">—</td></tr>
      </tbody>
    </table>
    <p class="quiet" style="margin-top:7mm">Send a draft and we'll come back within 48 hours with
    notes, once. If we're slower than that, post it anyway.</p>
  </div>
""", "06", "What we'd love back")

# ── 07 shooting notes ───────────────────────────────────────────────────────
page(f"""
  <p class="eb">A few notes</p>
  <h2>Shoot it the way you'd shoot anything.</h2>
  <div class="body-z">
    <div class="g2">
      <ul>
        <li><b>Open on the plan, not the app.</b> "I've got a wedding in nine days and nothing
        that works" is a better first line than anything about us.</li>
        <li><b>Show your real screen.</b> Screen-record on your own phone, and leave it slow
        enough to read.</li>
        <li><b>Your room beats a studio.</b> Natural light, normal mess, no production.</li>
      </ul>
      <ul>
        <li><b>One idea per video.</b> Two features is one too many.</li>
        <li><b>End on the outfit.</b> Wearing it is the proof — the logo isn't.</li>
        <li><b>Sound like yourself.</b> We'll never send you a line to read. If a phrase in this
        deck doesn't sound like you, cut it.</li>
      </ul>
    </div>
    <div class="rule"></div>
    <p class="quiet" style="max-width:195mm">Two small things to keep accurate, because they're
    the ones people assume: there's <b style="color:{INK}">no checkout in the app</b> — you buy
    from the retailer — and it only knows the clothes you've actually added, not your whole
    wardrobe. We also call them <b style="color:{INK}">Moments</b>, never events or occasions.</p>
  </div>
""", "07", "A few notes")

# ── 08 disclosure ───────────────────────────────────────────────────────────
page(f"""
  <p class="eb">The legal bit, briefly</p>
  <h2>Label it as an ad. <em>Right at the start.</em></h2>
  <div class="body-z">
    <div class="g2">
      <div>
        <ul>
          <li><b>#ad as the first thing in the caption</b> — not after a line break, not down in
          the hashtags.</li>
          <li><b>Turn on the paid partnership tool</b> on both TikTok and Instagram.</li>
          <li><b>Say it on screen too</b>, in the first few seconds.</li>
          <li><b>Every Story frame</b>, not just the first.</li>
        </ul>
      </div>
      <div class="card soft">
        <h3>That's the whole requirement</h3>
        <p class="sm">You almost certainly do this already. It's in the contract because UK rules
        put the responsibility on both of us, and we'd rather it be boring and clear than a
        conversation later.</p>
      </div>
    </div>
  </div>
""", "08", "The legal bit, briefly")

# ── 09 fee and dates ────────────────────────────────────────────────────────
page(f"""
  <p class="eb">What you get</p>
  <h2>Paid properly, <em>and on time.</em></h2>
  <div class="body-z">
    <table>
      <thead><tr><th>Item</th><th>Terms</th><th class="num">Amount</th></tr></thead>
      <tbody>
        <tr><td>Content fee</td>
          <td>For the video and the Stories, whatever the numbers turn out to be. No performance
          bonus, and nothing clawed back.</td>
          <td class="num"><span class="fill">[ £fee ]</span></td></tr>
        <tr><td>Usage</td>
          <td>Paid social for <span class="fill">[ 60 ]</span> days. Longer only by a new
          agreement and a new fee.</td>
          <td class="num"><span class="fill">[ £usage ]</span></td></tr>
        <tr><td>Payment</td>
          <td>Half on signing, half within <span class="fill">[ 14 ]</span> days of posting.
          Invoice to Decusatio Ltd.</td>
          <td class="num">—</td></tr>
        <tr><td>If it's not for you</td>
          <td>Try it for a week, decide it isn't your thing, tell us — we pay the content fee for
          your time and nothing goes out.</td>
          <td class="num">Full fee</td></tr>
      </tbody>
    </table>
    <p class="quiet" style="margin-top:7mm">The content stays yours. We won't ask you to take it
    down when the campaign ends.</p>
  </div>
""", "09", "What you get")

# ── 10 yes ──────────────────────────────────────────────────────────────────
page(f"""
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>{wm(24)}</div>
    <p class="eb" style="margin-top:3mm">A collaboration</p>
  </div>
  <div class="body-z" style="justify-content:center">
    <div class="big" style="max-width:200mm">If you're in,<br>
    <em>just reply to this email.</em></div>
    <div class="g2" style="gap:14mm;margin-top:11mm;max-width:190mm">
      <div>
        <p class="sm" style="margin-bottom:2mm">Write to</p>
        <p style="font-size:14px;font-weight:600;color:{INK}">
          <span class="fill">[ partnerships@forya.app ]</span></p>
        <p class="sm" style="margin-top:4mm">Tell us which angle you'd take, or the better idea
        you had instead. A paragraph is plenty, and we'll get you access the same day.</p>
      </div>
      <div>
        <p class="sm" style="margin-bottom:2mm">Have a look first</p>
        <p style="font-size:14px;font-weight:600;color:{INK}">forya.onrender.com</p>
        <p class="sm" style="margin-top:4mm">If it doesn't move you, it won't move your audience
        either — and we'd both rather know that now.</p>
      </div>
    </div>
  </div>
  <div class="folio" style="position:static;margin-top:auto">
    <span>{wm(19)} is a product of Decusatio Ltd · London</span>
    <span>Thank you for reading</span>
  </div>
""", cls="cover")

html = (f"<!doctype html><html><head><meta charset='utf-8'><style>{FACES}{CSS}</style></head>"
        f"<body>{''.join(PAGES)}</body></html>")
src = OUT / "FORYA-creator-invitation.html"
src.write_text(html)

js = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://{src}', {{ waitUntil: 'networkidle' }});
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(700);
  await p.pdf({{ path: '{OUT}/FORYA-creator-invitation.pdf',
    width: '297mm', height: '167mm', printBackground: true }});
  await b.close();
}})();
"""
r = OUT / "_r.cjs"; r.write_text(js)
subprocess.run(["node", str(r)], check=True)
r.unlink()
print(f"  slides: {len(PAGES)}")
print(f"  {OUT}/FORYA-creator-invitation.pdf")
