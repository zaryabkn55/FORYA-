"""FORya · Creator Partnerships — a landscape, slide-style brief.

16:9 at 297x167mm. White ground, charcoal ink, one flame accent used once per slide
at most. The two-voice heading (sans statement, serif-italic turn) is the brand's own
pattern and carries the whole deck.

Anything Zaryab must fill in before sending is wrapped in .fill and prints in flame,
so no placeholder can reach a creator unnoticed.
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
    face("instrument-serif",    "instrument-serif-latin-400-normal.woff2",    "IS", 400),
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

/* The wordmark. Page-level span rules have broken this three times before, so the
   two halves are pinned explicitly against anything inherited. */
.wm{{font-size:0;white-space:nowrap;line-height:1}}
.wm .wf,.wm .wy{{display:inline;color:inherit;white-space:nowrap}}
.wm .wf{{font-family:'BG';font-weight:800;letter-spacing:-.06em;font-size:1em}}
.wm .wy{{font-family:'IS';font-style:italic;font-weight:400;letter-spacing:-.02em;
  padding-left:.02em;font-size:1em}}
.wm-24{{font-size:24px}} .wm-19{{font-size:19px}} .wm-96{{font-size:96px}}

.eb{{font-family:'GM';font-size:8px;font-weight:500;letter-spacing:.2em;
  text-transform:uppercase;color:{STONE};display:flex;align-items:center;gap:7px}}
.eb::before{{content:"";width:4px;height:4px;border-radius:50%;background:{FLAME};flex:none}}

h2{{font-family:'BG';font-weight:700;font-size:35px;line-height:1.08;letter-spacing:-.035em;
  margin:5mm 0 0;max-width:210mm}}
h2 em{{font-family:'IS';font-style:italic;font-weight:400;letter-spacing:-.012em}}
.lede{{font-size:14.5px;line-height:1.6;color:{PEB};max-width:135mm;margin-top:3.5mm}}

.body-z{{flex:1;display:flex;flex-direction:column;justify-content:center;margin-top:7mm;padding-bottom:4mm}}
.folio{{position:absolute;left:20mm;right:20mm;bottom:7mm;display:flex;
  justify-content:space-between;font-family:'GM';font-size:7.5px;letter-spacing:.14em;
  text-transform:uppercase;color:{STONE}}}

p{{font-size:13.5px;line-height:1.68;color:{SOFT}}}
.sm{{font-size:12px;line-height:1.6;color:{PEB}}}
.fill{{color:{DEEP};font-family:'GM';font-size:.92em;letter-spacing:.02em}}

/* cover */
.cover{{justify-content:space-between;padding:20mm}}
.cv-rule{{width:46mm;height:2px;background:{FLAME};margin:7mm 0}}
.cv-sub{{font-family:'IS';font-style:italic;font-size:27px;color:{SOFT};letter-spacing:-.01em}}

/* generic grids */
.g2{{display:grid;grid-template-columns:1fr 1fr;gap:9mm}}
.g3{{display:grid;grid-template-columns:repeat(3,1fr);gap:7mm}}
.g4{{display:grid;grid-template-columns:repeat(4,1fr);gap:5.5mm}}
.card{{border:1px solid {LINE};border-radius:3mm;padding:9mm}}
.card.soft{{background:{SURF};border-color:{LINE}}}
.card.flamed{{background:{WASH};border-color:{FLAME}}}
.card h3{{font-size:16px;font-weight:700;letter-spacing:-.022em;margin-bottom:3.5mm;line-height:1.2}}
.card h3 em{{font-family:'IS';font-style:italic;font-weight:400}}
.n{{font-family:'GM';font-size:8px;letter-spacing:.16em;color:{FLAME};margin-bottom:3mm;display:block}}

ul{{list-style:none}}
li{{font-size:13px;line-height:1.6;color:{SOFT};padding-left:8mm;position:relative;margin-bottom:4.5mm}}
li::before{{content:"";position:absolute;left:0;top:7px;width:3.5mm;height:1px;background:{FLAME}}}
li b{{font-weight:600;color:{INK}}}

/* say / don't say */
.say{{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid {LINE};border-radius:3mm;overflow:hidden}}
.say>div{{padding:8mm 9mm}}
.say .yes{{background:{SURF}}}
.say .no{{border-left:1px solid {LINE}}}
.say h4{{font-family:'GM';font-size:8px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:4mm}}
.say .yes h4{{color:{DEEP}}} .say .no h4{{color:{STONE}}}
.say p{{font-size:12.5px;line-height:1.75;margin-bottom:3mm}}
.say .no p{{color:{PEB}}}

/* table */
table{{width:100%;border-collapse:collapse;font-size:13px}}
th{{font-family:'GM';font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:{STONE};
  text-align:left;padding:0 0 3mm;border-bottom:1px solid {LINE};font-weight:500}}
td{{padding:5.5mm 0;border-bottom:1px solid {LINE};color:{SOFT};vertical-align:top}}
tr:last-child td{{border-bottom:0}}
td:first-child{{font-weight:600;color:{INK};width:52mm}}
td.num{{text-align:right;font-family:'GM';font-size:12px;color:{INK};width:38mm}}

/* timeline */
.tl{{display:grid;grid-template-columns:repeat(5,1fr);gap:0;margin-top:4mm}}
.tl>div{{padding-right:6mm;border-top:2px solid {LINE};padding-top:4mm;position:relative}}
.tl>div::after{{content:"";position:absolute;top:-2px;left:0;width:9mm;height:2px;background:{FLAME}}}
.tl b{{display:block;font-family:'GM';font-size:8px;letter-spacing:.14em;color:{STONE};margin-bottom:2.5mm}}
.tl span{{font-size:12.5px;line-height:1.55;color:{SOFT};display:block}}

/* swatches */
.sw{{display:flex;gap:4mm;margin-top:2mm}}
.sw div{{flex:1}}
.sw i{{display:block;height:21mm;border-radius:2mm;border:1px solid {LINE}}}
.sw span{{display:block;font-family:'GM';font-size:7.5px;letter-spacing:.1em;color:{STONE};margin-top:2mm}}

.quiet{{color:{PEB};font-size:12px;line-height:1.6}}
.rule{{height:1px;background:{LINE};margin:6mm 0}}
.big{{font-family:'BG';font-weight:700;font-size:54px;line-height:1.08;letter-spacing:-.038em}}
.big em{{font-family:'IS';font-style:italic;font-weight:400;letter-spacing:-.015em}}
"""

W = '<span class="wm wm-{s}"><span class="wf">FOR</span><span class="wy">ya</span></span>'
def wm(size): return W.format(s=size)

PAGES = []
def page(body, num="", section="", cls=""):
    foot = (f'<div class="folio"><span>{section}</span><span>{num}</span></div>') if num else ""
    PAGES.append(f'<section class="pg {cls}">{body}{foot}</section>')

# ── 01 cover ────────────────────────────────────────────────────────────────
page(f"""
  <div>{wm(24)}</div>
  <div>
    <p class="eb">Creator partnerships · Autumn / Winter 2026</p>
    <div class="cv-rule"></div>
    <div class="big" style="max-width:180mm">You’ve got plans.<br><em>We’ve got the look.</em></div>
    <p class="lede" style="margin-top:7mm;max-width:118mm">An invitation to a small group of style
    creators to shape how {wm(19)} arrives in the world.</p>
  </div>
  <div class="folio" style="position:static;margin-top:auto">
    <span>Decusatio Ltd · London</span><span>Invitation only</span>
  </div>
""", cls="cover")

# ── 02 the invitation ───────────────────────────────────────────────────────
page(f"""
  <p class="eb">The invitation</p>
  <h2>We’re not looking for an ad. <em>We’re looking for a Tuesday.</em></h2>
  <div class="body-z">
    <div class="g2">
      <div>
        <p>{wm(19)} plans what you’ll wear around the thing you’re actually going to — a dinner,
        an interview, a wedding in a field in October. It reads the date, the place and the weather,
        looks at what’s already in your wardrobe, and builds the outfit from there.</p>
        <p style="margin-top:4mm">We call those <b style="color:{INK};font-weight:600">Moments</b>.
        Not events. Not occasions. The small, specific things that make getting dressed harder
        than it needs to be.</p>
      </div>
      <div>
        <p>What we’d like from you is not a product demo. It’s one honest piece of content about a
        real Moment in your own week, and what it looked like to plan for it without the usual
        half hour of standing in front of a wardrobe.</p>
        <p style="margin-top:4mm">If that sounds like something you’d post anyway — only easier —
        you’re exactly who this is for.</p>
      </div>
    </div>
  </div>
""", "02", "The invitation")

# ── 03 what it does ─────────────────────────────────────────────────────────
page(f"""
  <p class="eb">In three parts</p>
  <h2>What the app actually does. <em>No more than that.</em></h2>
  <div class="body-z">
    <div class="g3">
      <div class="card soft">
        <span class="n">01</span>
        <h3>Moments</h3>
        <p class="sm">You tell it what you’re going to, where and when. It handles the dress code,
        the weather and the hour of day so you don’t have to think about any of it.</p>
      </div>
      <div class="card soft">
        <span class="n">02</span>
        <h3>Your wardrobe</h3>
        <p class="sm">Photograph things you already own and they become part of the plan. The
        cut-out happens on your phone — the photo isn’t uploaded anywhere.</p>
      </div>
      <div class="card soft">
        <span class="n">03</span>
        <h3>The look</h3>
        <p class="sm">A complete outfit, built from what you own plus anything missing. If a piece
        needs buying, it shows you where and what it costs. Nothing is hidden behind a limit.</p>
      </div>
    </div>
    <p class="quiet" style="margin-top:9mm;max-width:170mm">Please don’t describe it as a shop, a
    styling service or an AI stylist that buys things for you. It plans; you decide; the retailer
    sells. That boundary matters to us and to the ASA.</p>
  </div>
""", "03", "The invitation")

# ── 04 who ──────────────────────────────────────────────────────────────────
page(f"""
  <p class="eb">Who we’re asking</p>
  <h2>Taste, not reach. <em>We mean it.</em></h2>
  <div class="body-z">
    <div class="g2" style="gap:14mm">
      <div>
        <p style="margin-bottom:5mm">We’re working with a deliberately small group. We’d rather
        have fifteen creators whose feeds we genuinely like than three hundred who post once.
        What we look at:</p>
        <ul>
          <li><b>A point of view.</b> Your feed looks like a person, not a catalogue.</li>
          <li><b>You already get dressed on camera.</b> Getting-ready content, outfit planning,
          wardrobe edits — it’s a format you’re fluent in.</li>
          <li><b>Comments that read like conversation.</b> We’d take 4,000 engaged over 90,000 quiet.</li>
          <li><b>UK-based</b>, because the catalogue, the pricing and the weather are UK right now.</li>
        </ul>
      </div>
      <div class="card flamed">
        <h3>What we don’t ask for</h3>
        <p class="sm" style="margin-bottom:3mm">A follower minimum. A posting schedule that takes
        over your month. Scripted lines read to camera.</p>
        <p class="sm" style="margin-bottom:3mm">Exclusivity beyond the obvious: please don’t post
        for a directly competing styling app inside the campaign window.</p>
        <p class="sm">And never a positive review. If you use it and it doesn’t work for you, tell
        us and we’ll pay you for your time anyway. That is a real offer.</p>
      </div>
    </div>
  </div>
""", "04", "Who we're asking")

# ── 05 the one idea ─────────────────────────────────────────────────────────
page(f"""
  <p class="eb">The one idea</p>
  <div class="body-z" style="justify-content:center">
    <div class="big" style="max-width:215mm;font-size:52px">Start with the plan,<br>
    <em>not the product.</em></div>
    <p class="lede" style="margin-top:8mm;max-width:150mm;font-size:14px">Every piece of content
    we love opens the same way: a real thing in your diary, and the small panic that comes with it.
    The app arrives second. If the first two seconds are a logo, we’ve lost.</p>
  </div>
""", "05", "The one idea")

# ── 06 deliverables ─────────────────────────────────────────────────────────
page(f"""
  <p class="eb">The ask</p>
  <h2>One video, a few Stories, <em>and the raw files.</em></h2>
  <div class="body-z">
    <table>
      <thead><tr><th>Deliverable</th><th>Detail</th><th class="num">Due</th></tr></thead>
      <tbody>
        <tr><td>Feed video</td>
          <td>20–40 seconds, shot vertical 9:16. Posted to <b>both</b> TikTok and Instagram Reels.
          Same cut is fine; caption can differ.</td>
          <td class="num"><span class="fill">[ date ]</span></td></tr>
        <tr><td>Stories</td>
          <td>Three to five frames showing you actually using it, with the link sticker on the
          final frame. Instagram only.</td>
          <td class="num"><span class="fill">[ date ]</span></td></tr>
        <tr><td>Raw footage</td>
          <td>Unedited clips and any screen recordings, sent as a single folder. This is the part
          most creators forget and the part we value most.</td>
          <td class="num"><span class="fill">[ date ]</span></td></tr>
        <tr><td>Usage</td>
          <td>Licence for us to run the video as a paid ad on TikTok and Meta for
          <span class="fill">[ 60 ]</span> days from posting, priced into the fee below.</td>
          <td class="num">—</td></tr>
      </tbody>
    </table>
    <p class="quiet" style="margin-top:7mm">One round of notes from us within 48 hours of seeing
    your draft. If we miss that window, post it.</p>
  </div>
""", "06", "The ask")

# ── 07 four angles ──────────────────────────────────────────────────────────
page(f"""
  <p class="eb">Four ways in</p>
  <h2>Pick the one that’s true for you. <em>Or bring your own.</em></h2>
  <div class="body-z">
    <div class="g4">
      <div class="card">
        <span class="n">ANGLE 01</span>
        <h3>I’ve got a thing on Friday</h3>
        <p class="sm">A real plan in your diary. You open the app, answer three questions, and a
        complete outfit comes back. This is the core one — if in doubt, make this.</p>
      </div>
      <div class="card">
        <span class="n">ANGLE 02</span>
        <h3>The wardrobe already knows</h3>
        <p class="sm">You photograph six things you own. The next look is built from them. Best for
        anyone whose audience is tired of being sold more clothes.</p>
      </div>
      <div class="card">
        <span class="n">ANGLE 03</span>
        <h3>And then it rained</h3>
        <p class="sm">The forecast turns and the outfit changes with it. Short, funny, and the
        easiest one to shoot in a single take.</p>
      </div>
      <div class="card">
        <span class="n">ANGLE 04</span>
        <h3>Planned it last night</h3>
        <p class="sm">A get-ready-with-me where the deciding already happened the evening before.
        Morning is just putting it on.</p>
      </div>
    </div>
    <p class="quiet" style="margin-top:8mm;max-width:175mm">If you’ve got a better idea than all
    four, we’d genuinely rather have that. Send us a sentence before you shoot and we’ll say yes
    or ask one question.</p>
  </div>
""", "07", "Four ways in")

# ── 08 craft ────────────────────────────────────────────────────────────────
page(f"""
  <p class="eb">How to shoot it</p>
  <h2>Six things that make the difference.</h2>
  <div class="body-z">
    <div class="g2" style="gap:14mm">
      <ul>
        <li><b>Open on the problem.</b> The first two seconds are the plan and the panic, never
        the app. “I’ve got a wedding in nine days and nothing that works.”</li>
        <li><b>Show the real screens.</b> Screen-record on your actual phone. Don’t recreate the
        interface, don’t speed it up so fast it can’t be read.</li>
        <li><b>Natural light, real room.</b> Your bedroom beats a studio. We are not trying to look
        expensive.</li>
      </ul>
      <ul>
        <li><b>Say it once.</b> One idea per video. Two features is one too many.</li>
        <li><b>Keep the tone level.</b> Confident and dry travels further than excited. No
        “OBSESSED”, no shouting, no three exclamation marks.</li>
        <li><b>End on the outfit, not the logo.</b> Wear the look. That’s the proof.</li>
      </ul>
    </div>
    <div class="rule"></div>
    <p class="quiet" style="max-width:185mm">Captions: write them the way you write everything
    else. We will never send you a line to read. If a phrase doesn’t sound like you, cut it —
    including anything in this document.</p>
  </div>
""", "08", "How to shoot it")

# ── 09 words ────────────────────────────────────────────────────────────────
page(f"""
  <p class="eb">The words</p>
  <h2>Say this. <em>Not that.</em></h2>
  <div class="body-z">
    <div class="say">
      <div class="yes">
        <h4>Accurate</h4>
        <p>“It plans an outfit around what you’ve got on.”</p>
        <p>“It uses clothes I already own.”</p>
        <p>“It shows me what a missing piece costs and where to get it.”</p>
        <p>“A <b>Moment</b> — a dinner, an interview, a wedding.”</p>
        <p>“The cut-out happens on my phone.”</p>
      </div>
      <div class="no">
        <h4>Not true, please avoid</h4>
        <p>“It buys the clothes for you.” — there’s no checkout in the app.</p>
        <p>“It finds the lowest price.” — it shows sellers it can see, not the whole market.</p>
        <p>“It knows your whole wardrobe.” — only what you’ve added.</p>
        <p>“An event” or “an occasion.” — we say <b>Moment</b>, every time.</p>
        <p>“AI stylist.” — it plans; you choose.</p>
      </div>
    </div>
    <p class="quiet" style="margin-top:7mm">This isn’t pedantry. Claims we can’t evidence are the
    fastest way for both of us to end up in front of the ASA.</p>
  </div>
""", "09", "The words")

# ── 10 the look ─────────────────────────────────────────────────────────────
page(f"""
  <p class="eb">If you want to match us</p>
  <h2>White ground, charcoal type, <em>one flicker of orange.</em></h2>
  <div class="body-z">
    <div class="g2" style="gap:14mm">
      <div>
        <p style="margin-bottom:4mm">You do not have to shoot in our palette — your feed should
        look like your feed. But if you’re adding text, a cover frame or an end card, these are
        ours, and we’ve kept them deliberately plain.</p>
        <div class="sw">
          <div><i style="background:#fff"></i><span>PAPER · FFFFFF</span></div>
          <div><i style="background:{INK}"></i><span>INK · 18181B</span></div>
          <div><i style="background:{FLAME}"></i><span>FLAME · F05A1E</span></div>
          <div><i style="background:{PANEL}"></i><span>PANEL · F5F5F6</span></div>
        </div>
      </div>
      <div>
        <p style="margin-bottom:4mm">Two typefaces, both free: <b>Bricolage Grotesque</b> for
        everything, and <b>Instrument Serif Italic</b> for one word per sentence — the turn, the
        emphasis, the bit with feeling in it.</p>
        <div class="card soft" style="padding:6mm">
          <div style="font-family:'BG';font-weight:700;font-size:26px;letter-spacing:-.03em;line-height:1.15">
            One dinner. <em style="font-family:'IS';font-style:italic;font-weight:400">One decision.</em>
          </div>
          <p class="sm" style="margin-top:3mm">Flame is an accent, never a background. If you’re
          using more than one orange thing in a frame, that’s one too many.</p>
        </div>
      </div>
    </div>
  </div>
""", "10", "If you want to match us")

# ── 11 disclosure ───────────────────────────────────────────────────────────
page(f"""
  <p class="eb">Non-negotiable</p>
  <h2>Label it as an ad. <em>Clearly, and first.</em></h2>
  <div class="body-z">
    <div class="g2" style="gap:14mm">
      <div>
        <ul>
          <li><b>#ad at the very start of the caption</b> — not after a line break, not buried in a
          cluster of hashtags at the bottom, not “#sp” or “gifted”.</li>
          <li><b>Switch on the platform’s paid partnership tool</b> on both TikTok and Instagram,
          with {wm(19)} as the business partner.</li>
          <li><b>Say it out loud or on screen</b> in the first few seconds of the video too. The
          caption alone isn’t enough if the video travels without it.</li>
          <li><b>Stories get it on every frame</b>, not only the first.</li>
        </ul>
      </div>
      <div class="card">
        <h3>Why we’re strict about it</h3>
        <p class="sm" style="margin-bottom:3mm">UK advertising rules apply to paid creator content,
        and the responsibility sits with both of us. An unlabelled post can be removed and ruled
        against publicly.</p>
        <p class="sm" style="margin-bottom:3mm">It also just works better. Audiences have been able
        to spot an undisclosed ad for years, and the ones who notice stop trusting the rest of your
        feed, not just this post.</p>
        <p class="sm">This clause is in the contract. We will ask for a correction before we ask
        for anything else.</p>
      </div>
    </div>
  </div>
""", "11", "Non-negotiable")

# ── 12 what you get ─────────────────────────────────────────────────────────
page(f"""
  <p class="eb">What you receive</p>
  <h2>Paid properly, <em>and on time.</em></h2>
  <div class="body-z">
    <table>
      <thead><tr><th>Item</th><th>Terms</th><th class="num">Amount</th></tr></thead>
      <tbody>
        <tr><td>Content fee</td>
          <td>For the video and the Stories, whatever the engagement turns out to be. No bonus
          structure, no performance clawback.</td>
          <td class="num"><span class="fill">[ £fee ]</span></td></tr>
        <tr><td>Usage licence</td>
          <td>Paid social on TikTok and Meta for <span class="fill">[ 60 ]</span> days. Extended
          only by a new agreement and a new fee.</td>
          <td class="num"><span class="fill">[ £usage ]</span></td></tr>
        <tr><td>Payment terms</td>
          <td>Half on signature, half within <span class="fill">[ 14 ]</span> days of posting.
          Invoice to Decusatio Ltd.</td>
          <td class="num">—</td></tr>
        <tr><td>If it isn’t for you</td>
          <td>Use it for a week, decide it isn’t your thing, tell us honestly — we pay the content
          fee for your time and nothing goes out.</td>
          <td class="num">Full fee</td></tr>
      </tbody>
    </table>
    <p class="quiet" style="margin-top:7mm">You keep the content and may keep it on your profile
    indefinitely. We won’t ask you to delete a post if the campaign ends.</p>
  </div>
""", "12", "What you receive")

# ── 13 timeline ─────────────────────────────────────────────────────────────
page(f"""
  <p class="eb">How it runs</p>
  <h2>Five steps, <em>about three weeks.</em></h2>
  <div class="body-z">
    <div class="tl">
      <div><b>STEP 01</b><span>You say yes. We send the contract and get you early access to the
      app.</span></div>
      <div><b>STEP 02</b><span>Live with it for a week. Plan something real. Tell us what’s
      annoying — that feedback is worth as much as the post.</span></div>
      <div><b>STEP 03</b><span>Send us your idea in a sentence. We reply within a day with yes, or
      one question.</span></div>
      <div><b>STEP 04</b><span>Shoot and send a draft. One round of notes from us inside 48
      hours.</span></div>
      <div><b>STEP 05</b><span>Post to both platforms, with the paid partnership label on. Raw
      files over the same week.</span></div>
    </div>
    <div class="rule" style="margin-top:12mm"></div>
    <div class="g2" style="gap:14mm">
      <p class="quiet">Nothing here is designed to eat your month. From yes to posted is about
      three weeks, and most of that is you simply using the app in your normal life.</p>
      <p class="quiet">Campaign window: <span class="fill">[ dates ]</span>. If your schedule needs
      to move, say so — we would much rather shift a date than get a rushed video.</p>
    </div>
  </div>
""", "13", "How it runs")

# ── 14 yes ──────────────────────────────────────────────────────────────────
page(f"""
  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>{wm(24)}</div>
    <p class="eb" style="margin-top:3mm">Creator partnerships</p>
  </div>
  <div class="body-z" style="justify-content:center">
    <div class="big" style="max-width:200mm">If this sounds like your thing,<br>
    <em>we’d love to hear from you.</em></div>
    <div class="g2" style="gap:14mm;margin-top:11mm;max-width:190mm">
      <div>
        <p class="sm" style="margin-bottom:2mm">Reply to this email, or write to</p>
        <p style="font-size:14px;font-weight:600;color:{INK}">
          <span class="fill">[ partnerships@forya.app ]</span></p>
        <p class="sm" style="margin-top:4mm">Tell us which of the four angles you’d take, or the
        better idea you had instead. One paragraph is plenty.</p>
      </div>
      <div>
        <p class="sm" style="margin-bottom:2mm">The app</p>
        <p style="font-size:14px;font-weight:600;color:{INK}">forya.onrender.com</p>
        <p class="sm" style="margin-top:4mm">Have a look before you decide. If it doesn’t move you,
        it won’t move your audience either, and we’d both rather know now.</p>
      </div>
    </div>
  </div>
  <div class="folio" style="position:static;margin-top:auto">
    <span>{wm(19)} is a product of Decusatio Ltd · London</span>
    <span>Autumn / Winter 2026</span>
  </div>
""", cls="cover")

html = (f"<!doctype html><html><head><meta charset='utf-8'><style>{FACES}{CSS}</style></head>"
        f"<body>{''.join(PAGES)}</body></html>")
src = OUT / "FORYA-creator-brief.html"
src.write_text(html)

js = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://{src}', {{ waitUntil: 'networkidle' }});
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(700);
  await p.pdf({{ path: '{OUT}/FORYA-creator-brief.pdf',
    width: '297mm', height: '167mm', printBackground: true, pageRanges: '1-14' }});
  await b.close();
}})();
"""
(OUT / "_render.cjs").write_text(js)
subprocess.run(["node", str(OUT / "_render.cjs")], check=True)
print(f"  slides: {len(PAGES)}")
print(f"  {OUT}/FORYA-creator-brief.pdf")
