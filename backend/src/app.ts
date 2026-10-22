import 'express-async-errors';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import momentRoutes from './routes/moments';
import brandRoutes from './routes/brands';
import wardrobeRoutes from './routes/wardrobe';
import syncRoutes from './routes/sync';
import sharedRoutes from './routes/shared';
import aiRoutes from './routes/ai';
import weatherRoutes from './routes/weather';
import { databaseReady } from './db/config';
import { env } from './env';

export const app = express();

/* ── Behind a proxy ───────────────────────────────────────────────────────────
   Railway, Render and every other PaaS terminate TLS in front of the app. Without
   this, req.ip is the load balancer for every request — so the rate limiters below
   would put the whole internet in one bucket, and the first busy minute would lock
   everyone out. Set to the number of proxies in front of the app. */
app.set('trust proxy', env.trustProxy);
app.disable('x-powered-by');

/* ── Baseline hardening ─────────────────────────────────────────────────────── */
app.use(
  helmet({
    // The SPA is served from this same origin; the policy below is tight but has to
    // allow the Google Fonts the brand type comes from and the retailer images the
    // catalogue points at.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: env.isProd ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // retailer CDNs don't send CORP headers
    hsts: env.isProd ? { maxAge: 31_536_000, includeSubDomains: true, preload: false } : false,
  }),
);
app.use(compression());

/* ── CORS ─────────────────────────────────────────────────────────────────────
   The web app is served from this same origin, so in the normal case no CORS is
   involved at all. The allowlist exists for the cases that do cross origins: a
   separately hosted frontend, a staging build, or the mobile app later. */
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // same-origin, curl, server-to-server
      const normalised = origin.replace(/\/$/, '');
      if (env.allowedOrigins.includes(normalised)) return cb(null, true);
      return cb(new Error('Origin not allowed'));
    },
    credentials: true,
  }),
);

/* ── Body limits ──────────────────────────────────────────────────────────────
   The largest legitimate body is a look with its canvas pieces; 256 kB is ample and
   stops someone posting a 50 MB JSON document at an unauthenticated route. */
app.use(express.json({ limit: '256kb' }));

/* ── Rate limits ──────────────────────────────────────────────────────────────
   Three tiers. The broad one protects the service; the auth one makes credential
   stuffing expensive; the ingest/proxy one protects bandwidth and upstream sites. */
const broad = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Give it a minute.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count, so a busy real user isn't punished
  message: { error: 'Too many sign-in attempts. Please wait a few minutes.' },
});

const imageLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many image requests.' },
});

app.use('/api/', broad);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/products/proxy-image', imageLimiter);

/* ── Routes ───────────────────────────────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/moments', momentRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/shared', sharedRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/weather', weatherRoutes);

/* ── Health ───────────────────────────────────────────────────────────────────
   `database` is what the web app reads to decide between live data and demo mode, so
   this stays 200 even when Postgres is down — the product degrades, it doesn't die.
   /health/ready is the strict one: use it as the platform's health check so a deploy
   with a broken database never takes traffic. */
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ status: 'ok', database: databaseReady ? 'connected' : 'unavailable' });
});

app.get('/health/ready', (_req, res) => {
  if (!databaseReady) return res.status(503).json({ status: 'degraded', database: 'unavailable' });
  res.json({ status: 'ok', database: 'connected' });
});

/* ── The web app ──────────────────────────────────────────────────────────────
   In production the API also serves the built SPA, so the whole product is one
   service on one origin: no CORS, no second deploy to keep in step, one TLS cert.
   Unknown /api/* paths 404 as JSON; everything else falls through to index.html so
   client-side routes survive a refresh. */
const webRoot = process.env.WEB_ROOT || path.resolve(__dirname, '../public');
const hasWeb = fs.existsSync(path.join(webRoot, 'index.html'));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

if (hasWeb) {
  // Fingerprinted assets can be cached hard; index.html must never be.
  app.use(
    express.static(webRoot, {
      index: false,
      maxAge: '1y',
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(webRoot, 'index.html'));
  });
} else {
  console.warn(`⚠️  No web build found at ${webRoot}. Serving the API only.`);
}

/* ── Errors ───────────────────────────────────────────────────────────────────
   One place for everything that escapes a route. The message sent to the client is
   deliberately generic: stack traces and database errors leak schema and file paths. */
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof Error && err.message === 'Origin not allowed') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  // Errors raised by middleware for a bad *request* carry their own status — body-parser
  // uses 400 for malformed JSON and 413 for an oversized body. Reporting those as 500 would
  // both mislead the caller and bury real server faults in a log full of client typos.
  const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    if (res.headersSent) return;
    const message =
      status === 413 ? 'That request was too large.' : status === 400 ? 'That request could not be read.' : 'Bad request.';
    return res.status(status).json({ error: message });
  }

  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});
