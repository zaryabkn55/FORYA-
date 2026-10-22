# Deploying FORYA

One container serves the API and the web app on a single origin. That is the whole
architecture: no CORS to misconfigure, one TLS certificate, one deploy that can't drift out
of step with itself, and one service to pay for.

```
  browser ──▶ [ Railway / Render edge: TLS ] ──▶ [ FORYA container ] ──▶ [ Postgres ]
                                                   Express API  /api/*
                                                   static SPA   everything else
```

---

## Before you start

You need three things, and only you can supply them:

| Thing | Where | Notes |
|---|---|---|
| A GitHub repo | github.com | The host deploys from it. `git push` is the trigger. |
| A Railway **or** Render account | railway.app / render.com | Card on file. Expect roughly £10–20/month for app + database. |
| An Anthropic API key | console.anthropic.com | Optional. Without it the on-device stylist runs instead, free. |

---

## Option A · Railway (fastest)

1. **Push the code.**
   ```bash
   cd FORYA
   git init && git add -A && git commit -m "FORYA: production-ready"
   gh repo create forya --private --source=. --push      # or create it in the UI and push
   ```

2. **New project → Deploy from GitHub repo → pick `forya`.**
   Railway reads `railway.json`, sees the `Dockerfile`, and builds. The first build takes
   4–6 minutes (it compiles the web app and the API).

3. **Add the database.** In the project: **New → Database → PostgreSQL.** Railway creates it
   and exposes `DATABASE_URL` to the project automatically.

4. **Set the variables.** On the app service → **Variables**:

   ```
   NODE_ENV             production
   DATABASE_URL         ${{Postgres.DATABASE_URL}}     ← Railway's reference syntax
   JWT_SECRET           <openssl rand -base64 48>
   ADMIN_TOKEN          <openssl rand -hex 32>
   TRUST_PROXY_HOPS     1
   ALLOWED_ORIGINS      (fill in at step 6)
   ANTHROPIC_API_KEY    <your key, or leave unset>
   ```

5. **Generate the domain.** Settings → Networking → **Generate Domain**. You'll get something
   like `forya-production.up.railway.app`.

6. **Set `ALLOWED_ORIGINS` to that URL** (with `https://`, no trailing slash) and redeploy.
   The app *refuses to start in production* without it — that is deliberate.

7. **Check it.**
   ```bash
   curl https://<your-domain>/health
   # {"status":"ok","database":"connected"}
   ```
   `database: connected` is the one that matters. If it says `unavailable`, the app is
   serving demo data — check `DATABASE_URL`.

Migrations run automatically on every boot via `docker-entrypoint.sh`. `prisma migrate
deploy` only applies committed migrations; it never generates, prompts, or drops anything.

---

## Option B · Render (infrastructure as code)

1. Push to GitHub as above.
2. **New → Blueprint →** point it at the repo. Render reads `render.yaml` and creates both
   the database and the web service, wiring `DATABASE_URL` between them and generating
   `JWT_SECRET` and `ADMIN_TOKEN` itself.
3. It will prompt for `ALLOWED_ORIGINS` and `ANTHROPIC_API_KEY`. Leave `ALLOWED_ORIGINS`
   blank for the first build, then set it to the URL Render assigns and redeploy.
4. **Move the database off the free tier before launch.** Render's free Postgres is deleted
   after 30 days.

---

## Seeding the catalogue

The database starts empty, so Discover and the wardrobe will be bare. From the deployed
service's shell (Render: the **Shell** tab; Railway: `railway run`):

```bash
npm run seed:catalogue
```

That loads the 736-piece starter catalogue. It upserts on SKU, so it is safe to run again
after a redeploy or a catalogue change — pieces are updated in place, never duplicated.

Locally, where dev dependencies are installed, it needs a build first:

```bash
cd backend && npm run build && npm run seed:catalogue
```

> **`npm run seed` does not work on a deployed service.** It runs `prisma/seed.ts` through
> `tsx`, which is a dev dependency and is stripped by `npm ci --omit=dev`, and it imports from
> `src/`, which the runtime image doesn't ship. It is the local-development seeder: it also
> creates the two demo accounts (`demo@forya.com`, `james@forya.com`). Those passwords are in
> version control, so seed them on a deployed service only after changing them.

Don't paste a seeding script into the web shell by hand. A `£` typed through a browser
terminal arrives mis-encoded, which is how the live catalogue once ended up showing
`GBP295` instead of `£295`. The command above builds the prices in code.

To pull live retailer data instead, use the operator route with your `ADMIN_TOKEN`:

```bash
curl -X POST https://<your-domain>/api/products/sync-all-brands \
     -H "Authorization: Bearer $ADMIN_TOKEN"
```

This spends ScrapingBee credits and puts load on retailers' sites. It is closed to the
public — without `ADMIN_TOKEN` set, it answers 404.

---

## Environment variables

Everything is declared and validated in `backend/src/env.ts`. A production start with
anything required missing fails immediately, which the platform shows as a failed release
while the previous version keeps serving. The full list with explanations is in
`.env.example`.

The four that matter most:

- **`JWT_SECRET`** — signs sessions. Rotating it signs everyone out, which is exactly what
  you want if it leaks. Never reuse it between environments.
- **`ALLOWED_ORIGINS`** — the exact public URL, with scheme.
- **`TRUST_PROXY_HOPS=1`** — without it every visitor shares one rate-limit bucket and the
  first busy minute locks everyone out.
- **`ADMIN_TOKEN`** — guards the catalogue ingest routes. Missing means closed, not open.

---

## What was hardened to get here

The code as it stood would have been expensive to expose. Fixed before deployment:

| Was | Now |
|---|---|
| `POST /api/ai/complete` open to anyone — your Anthropic key, anyone's bill | Sign-in required, 40 calls/user/hour, 2000/day server-wide; past the cap the app falls back to the on-device stylist |
| `POST /api/products/sync-all-brands` and `/ingest-live` unauthenticated | `ADMIN_TOKEN`, constant-time compare, 404 rather than 403 so the routes aren't advertised |
| `/api/products/proxy-image` would fetch *any* URL — an open proxy into the private network | Scheme check, DNS resolution with private/loopback/link-local refused, no redirects, 8 MB cap, image content-types only, SVG refused |
| `cors({ origin: true })` reflected every origin | Allowlist from `ALLOWED_ORIGINS` |
| No rate limiting anywhere | 300/min overall, 20 failed sign-ins per 15 min, 240/min on images |
| No security headers | helmet with a CSP, HSTS, `nosniff`, `frame-ancestors 'none'` |
| Unbounded request bodies | 256 kB cap, 413 past it |
| Malformed JSON returned 500 | Returns 400 |
| `prisma db push`, no migration history | Committed baseline migration, applied by `migrate deploy` on boot |
| Dev image (`tsx watch`, `NODE_ENV=development`, dev deps) | Multi-stage production image, non-root, tini for signal handling, healthcheck |
| No graceful shutdown — deploys cut requests mid-response | SIGTERM drains in-flight requests, 15s ceiling |

---

## Verified before handover

Run against the built production server:

- Production guard refuses to start without `DATABASE_URL`, with a short `JWT_SECRET`, or
  without `ALLOWED_ORIGINS`.
- `/health` stays 200 with `database: unavailable` when Postgres is down, so the app
  degrades to demo data rather than showing an error page. `/health/ready` returns 503, so
  the platform won't route traffic to a broken instance.
- Operator routes answer 404 with no token and with a wrong token.
- `/api/ai/complete` answers 401 anonymously and with a bad token.
- The image proxy refuses `169.254.169.254` (cloud metadata), `127.0.0.1`, `10.0.0.0/8`,
  `[::1]` and `file://`.
- CORS: allowed origin 200, unknown origin 403.
- Malformed JSON 400; a 1 MB body 413.
- The sign-in limiter engages after exactly 20 failures.
- Deep links (`/moments`) survive a refresh; `/api/*` misses return JSON, not the SPA.
- `index.html` is `no-cache`, fingerprinted assets are `max-age=31536000`; gzip is on.
- The migration applies cleanly to a real Postgres 16: 7 tables, 4 enums, 21 indexes, 7
  cascading foreign keys. Unique constraints, enum validation and cascade deletes all behave
  — deleting a user removes their moments, looks, canvas pieces, wardrobe and shared looks,
  and leaves the shared product catalogue intact.

---

## Known gaps — read before launch

1. **The AI budget counters are in-process.** Correct for one instance. If you scale to
   several replicas, either divide `AI_DAILY_CALLS` by the replica count or move the
   counters in `backend/src/lib/aiBudget.ts` to Redis.
2. **Accounts created before 22 Oct 2026 may be filed in the wrong country.** The default was
   `Pakistan`/`PK` and the registration form never sent a country code, so early rows can read
   `Pakistan`, or a correct country name against a `GB` code. Both are fixed going forward
   (migration `20261022170000_default_country_uk`, and `backend/src/lib/countries.ts`), but
   existing rows were left untouched on purpose — a row saying `Pakistan` might be a member who
   chose it. The migration carries the one-off `UPDATE` if you want them rewritten.
3. **Calendar sync is a placeholder.** `POST /api/sync` inserts two sample moments; Google
   and Outlook OAuth are not wired up. Fine for launch, but it is not what the marketing
   implies, so either build it or soften the copy.
4. **No backups configured.** Railway and Render both offer automated Postgres backups on
   paid tiers — turn them on before you have real users, not after.
5. **No error tracking.** Nothing reports a 500 to you except the platform log. Sentry is
   about twenty minutes of work and worth doing in week one.
6. **If any API key was ever committed to git, rotate it.** Removing it from the working
   tree does not remove it from history.
7. **The container runs migrations on boot.** With more than one replica, two containers can
   race on first deploy. Prisma takes an advisory lock so this is safe, but the loser's
   start is delayed — expect a slow first boot when scaling up.

---

## Day-to-day

```bash
# local development, hot reload
docker compose -f docker-compose.dev.yml up

# local production stack, exactly what the host builds
cp .env.example .env     # fill in POSTGRES_PASSWORD, JWT_SECRET, ALLOWED_ORIGINS
docker compose up -d --build

# a schema change
cd backend
npx prisma migrate dev --name describe_the_change   # creates the migration
git add prisma/migrations && git commit && git push # the host applies it on deploy
```

Never run `prisma db push` against production: it has no history and can drop columns
without telling you.
