# FORYA

**You've got plans. We've got the look.** A style journal for every moment, with a price check on every piece.

- `frontend/` — React 18 + TypeScript + Vite
- `backend/` — Express + TypeScript + Prisma (PostgreSQL)

## Run it

```bash
npm run install:all
npm run dev:demo --prefix frontend   # UI only, sample data, no database needed → http://localhost:5173
```

Full stack with Docker (Postgres, schema, starter catalogue and demo account are all set up for you):

```bash
docker compose -f docker-compose.dev.yml up --build   # hot reload  → http://localhost:5173
docker compose up --build                             # production  → http://localhost:8080
```

Demo login on the full stack: `demo@forya.com` / `forya-demo-2026` (or the "Explore the demo account" button on the log-in page).

Without Docker: copy `backend/.env.example` to `backend/.env`, start Postgres, then
`cd backend && npx prisma db push && npm run seed`, then `npm run dev` from the root.

## Brands and weather

- **Tiers:** Discover is split into Affordable, Attainable and Aspirational. Picking a tier shows only that tier's brands:
  the full brand list (14 / 15 / 28) (`TIER_BRANDS` in `frontend/src/lib/catalogue.ts`, `LAUNCH_BRANDS` in `backend/src/data/brands.ts`).
  Farfetch and Flannels are multi-brand stores, so their pieces are marked "Sold through …".
- **Departments:** every account shops either womenswear or menswear (`User.shopsFor`, picked at sign-up, switchable from the account menu;
  older accounts are asked once). Products carry `gender` (`women` / `men` / `unisex`) and an account only ever sees its own department plus unisex pieces.
  Womenswear covers all 57 brands (456 pieces); menswear covers the 47 that sell it (282 pieces).
  Every brand carries eight womenswear pieces and six menswear pieces, spread across the categories it sells
  (`catalogue.ts` and `catalogueMen.ts` hold the signature pieces, `catalogueExtra.ts` the depth). Womenswear-only labels are hidden for menswear accounts.
- **Weather (AI weather match):** the stylist engine (`frontend/src/lib/stylist.ts`) reads each piece's fabric and cut (linen breathes, down insulates,
  suede hates rain, shorts and sandals are bare) and scores it 0–100 against the forecast, using feels-like, rain chance and wind when known.
  Discover and the canvas shelf show only pieces scoring 55+, best first, each with a match badge and a one-line reason; a switch turns it off.
  New moments get the forecast for the day (Open-Meteo, up to 16 days ahead). Further out, FORYA uses the typical weather for that week
  (the same dates last year, from the Open-Meteo archive), so a summer trip booked in winter is dressed for summer.

## Demo mode

The web app checks `GET /api/health`. If the API or the database is unreachable it switches to **demo mode**
automatically: every feature still works, data is kept in the browser (`localStorage` key `forya.demo.v5`; each account has its own moments; two demo accounts come pre-planned: Celine for womenswear, James for menswear)
and a small "Demo data" flag shows in the corner. Force it with `VITE_DEMO=true` (that's what `npm run dev:demo` does).

## Imagery

All photos are original FORYA images, referenced by key from `frontend/src/lib/imagery.ts`.
They load from the generation CDN until you vendor them:

```bash
cd frontend && npm run images   # downloads to public/images and switches the app to the local copies
```

Product shots have white backgrounds and are shown with `mix-blend-mode: multiply`, so they sit
naturally on the oat canvas. Use the same treatment for any new product photography.

## Design system

Tokens and components live in `frontend/src/styles.css` (page-specific styles sit next to their page).

| Token | Hex | Use |
| --- | --- | --- |
| ink | `#2E2D2B` | text, primary buttons |
| paper | `#F6F5F2` | page background |
| oat | `#E8DFD0` | feature panels, placeholders |
| sheet | `#F1EBE1` | product and canvas backgrounds |
| linen | `#E3DFD8` | borders |
| pebble | `#6E6B65` | secondary text |

Type: Bricolage Grotesque (UI), Instrument Serif Italic for one or two words of "wink",
Geist Mono for labels, Caveat for handwritten canvas notes. The wordmark is always the `<Wordmark />`
component (FOR + *ya*), never typed by hand. Say **moments**, never "events" or "occasions".

## What's real and what's a placeholder

| Feature | Status |
| --- | --- |
| Accounts, moments, canvas, wardrobe | Real (API + Postgres), user-scoped |
| Weather on new moments | Real (Open-Meteo) |
| Price check and offers | **Illustrative** model in `backend/src/lib/pricing.ts`; swap for a live comparison feed |
| Calendar sync | Placeholder: adds two sample moments until Google/Outlook OAuth is wired up |
| Google / Apple sign-in | Placeholder account until OAuth is configured |
| Forgot password | Endpoint exists; sending the email is a TODO |
| Journal | Stored in the browser for now (no table yet) |
| AI stylist | Real. Uses Claude via `/api/ai` when `ANTHROPIC_API_KEY` is set (or the viewer's Claude in the claude.ai preview); otherwise the on-device stylist engine answers |

## API

| Method | Path | |
| --- | --- | --- |
| GET | `/api/health` | `{ status, database }` |
| POST | `/api/auth/register`, `/login`, `/oauth`, `/forgot-password` | register takes `shopsFor` |
| GET/PATCH | `/api/auth/me` | auth, `{ name?, country?, shopsFor? }` |
| GET | `/api/ai/status` | `{ enabled, model }` |
| POST | `/api/ai/complete` | `{ messages, quick? }` → `{ text }`, rate-limited per IP |
| GET | `/api/products`, `/api/products/:id`, `/api/products/:id/prices` | |
| GET/POST | `/api/moments` | auth |
| GET/DELETE | `/api/moments/:id` | auth |
| PUT | `/api/moments/:id/look` | auth, `{ status, pieces: [{ productId, x, y, w, z }] }` |
| POST | `/api/sync` | auth, calendar import |
| GET | `/api/wardrobe` | auth |
| PUT | `/api/wardrobe/:productId` | auth, `{ kind: 'saved' \| 'owned' \| null }` |

Schema changes in this version: `Occasion` gains `DINNER`; `Moment` gains `notes`, `weatherTemp`, `weatherDesc`;
`CanvasPiece` gains `w` and `z` and stores `x`/`y` as canvas percentages; `Product` gains `weather`, `rainReady`, `isStore` and `gender`; `User` gains `shopsFor`. Run `npx prisma db push` (or create a migration).

## Buying and sharing

- **Buy**: every "Buy at …" button opens the brand's own site in a new tab (`frontend/src/lib/shop.ts`). It uses the
  product page when the catalogue has one (`sourceUrl`), otherwise the brand's on-site search for that exact piece.
  Offers in a price check link to that retailer or resale site the same way. All links carry `utm_source=forya`, ready
  to swap for affiliate links.
- **Share a look**: the canvas has a Share button. Friends get a link (`/look/s/:id` on the API, stored in the
  `SharedLook` table, or a self-contained `/look/:payload` link in demo mode) where they can react with
  Wear it / Obsessed / Swap a piece and buy each piece. The share sheet also makes an Instagram-ready image
  (feed 4:5 or story 9:16) and opens WhatsApp, X, Facebook, Pinterest or email. On phones, "Share to Instagram"
  opens the system share sheet with the image attached.
- **Style points**: finishing a look (+10), sharing it (+15) and posting it (+20) earn points towards levels
  (Fresh face → Trendsetter → Style icon → Muse). Stored per account on the device for now (`lib/points.ts`).
- The share image is drawn in the browser, so product photos must be served from your own domain: run
  `npm run images` once before launch.

## AI features

FORYA's AI works at two levels, so it is useful even without a model:

1. **On-device stylist engine** (`lib/stylist.ts`): fabric and cut knowledge, weather scoring, occasion scoring, outfit building,
   look checks and plain-English request parsing. Instant, free, always on.
2. **Claude** (`lib/ai.ts`, `lib/aiStylist.ts`): reasons over the engine's shortlist and writes the advice. In the claude.ai preview it uses the
   viewer's own Claude (the page asks permission the first time); in production it goes through `/api/ai` with the server's key.

What users get:

- **Ask FORYA**: a stylist chat on every page. It knows your moments, their forecasts, your wardrobe and your department, and answers with
  pieces you can save or open ("What should I pack for Lisbon?", "black boots under £400"). It can jump straight to styling a moment.
- **Style it for me** on the canvas: builds a complete look for the moment's weather and occasion, favouring pieces you own or saved,
  with a stylist's note. "Restyle it" gives another option; ⌘Z undoes.
- **Look check** on the canvas: scores the look (complete, ready for the weather, right for the occasion, palette) and suggests one-tap swaps,
  plus an honest opinion from the stylist on request.
- **AI weather match** and **AI picks** in Discover, a **stylist brief** on Home, and **smart search** ("linen for Lisbon under £100" is
  understood as linen, under £100, 26° and sun).
- **A calendar-led Moments page**: the month on the left marks every day that holds something in that
  moment's own colour, today is ringed, picking a marked day filters the list and picking an empty one
  starts a moment on that date. The list beside it is grouped by day, newest first, each row carrying its
  countdown, forecast, status and the look's own pieces.
- **Drawn moment covers**: every moment card and the Home hero are generated from the moment itself, never photographed — a tint from the
  temperature, a pattern from the occasion and one line figure from the forecast (`frontend/src/lib/momentArt.ts`). A customer's moments are
  whatever they type in, so there is no stock photo to run out of: a christening in Dundee gets a cover as considered as a wedding in Somerset.
