/**
 * The environment contract.
 *
 * Everything the server reads from the environment is declared here and validated once at
 * boot, so a misconfigured deploy fails immediately with a readable message instead of
 * throwing somewhere deep in a request six hours later.
 *
 * In production the required values are genuinely required: the process refuses to start
 * without them. In development sensible local defaults are filled in.
 */
import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

function required(name: string, devFallback?: string): string {
  const v = process.env[name]?.trim();
  if (v) return v;
  if (!isProd && devFallback !== undefined) return devFallback;
  throw new Error(
    `${name} is not set. It is required when NODE_ENV=production. ` +
      `See DEPLOYMENT.md for the full list of environment variables.`,
  );
}

function optional(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${name} must be a non-negative number, got "${raw}".`);
  return n;
}

/**
 * Origins allowed to call the API with credentials. Comma-separated.
 * In development anything on localhost is allowed so the Vite dev server just works.
 */
function allowedOrigins(): string[] {
  const raw = optional('ALLOWED_ORIGINS');
  const list = raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (list.length) return list;
  if (isProd) {
    throw new Error(
      'ALLOWED_ORIGINS is not set. Set it to the exact origin(s) of the web app, ' +
        'e.g. ALLOWED_ORIGINS=https://forya.up.railway.app',
    );
  }
  return ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173'];
}

export const env = {
  isProd,
  nodeEnv: process.env.NODE_ENV || 'development',
  port: int('PORT', 4000),

  /** Postgres. Optional at boot: the API stays up and reports the database as unavailable
   *  so the web app can fall back to its demo data rather than showing an error page. */
  databaseUrl: optional('DATABASE_URL'),

  /** Signs session tokens. Must be long and random in production. */
  jwtSecret: required('JWT_SECRET', 'forya-dev-only-secret'),

  allowedOrigins: allowedOrigins(),

  /** Set behind Railway/Render/any reverse proxy so req.ip is the real client,
   *  not the load balancer — without it every visitor shares one rate-limit bucket. */
  trustProxy: int('TRUST_PROXY_HOPS', isProd ? 1 : 0),

  /** Guards the catalogue ingest routes, which spend scraping credits and hammer retailers. */
  adminToken: optional('ADMIN_TOKEN'),

  ai: {
    key: optional('ANTHROPIC_API_KEY'),
    model: optional('ANTHROPIC_MODEL', 'claude-sonnet-5-5'),
    modelQuick: optional('ANTHROPIC_MODEL_QUICK', 'claude-haiku-5-5'),
    /** Per-user ceiling, per rolling hour. */
    userHourlyCalls: int('AI_USER_HOURLY_CALLS', 40),
    /** Whole-server ceiling per UTC day. The spend cap: once hit, the app falls back
     *  to its on-device stylist until midnight rather than running up a bill. */
    dailyCalls: int('AI_DAILY_CALLS', 2000),
    maxOutputTokens: int('AI_MAX_OUTPUT_TOKENS', 1200),
  },
} as const;

/** Called once at boot so misconfiguration is loud and immediate. */
/**
 * Origins the Capacitor shell serves the bundled app from. They carry no http(s) scheme but are
 * ours, so the production check treats them as valid entries rather than malformed ones.
 *   iOS      capacitor://localhost
 *   Android  https://localhost  (already valid https, listed for completeness)
 */
const NATIVE_ORIGINS = new Set(['capacitor://localhost', 'ionic://localhost', 'https://localhost']);

export function assertProductionReady(): void {
  if (!isProd) return;
  const problems: string[] = [];

  if (env.jwtSecret === 'forya-dev-only-secret') problems.push('JWT_SECRET is still the development default.');
  if (env.jwtSecret.length < 32) problems.push('JWT_SECRET should be at least 32 characters.');
  if (!env.databaseUrl) problems.push('DATABASE_URL is not set — the app would serve demo data to real users.');
  if (env.ai.key && !env.adminToken) {
    // Not fatal, but worth shouting about: ingest routes spend money.
    console.warn('⚠️  ADMIN_TOKEN is not set. Catalogue ingest routes are disabled until it is.');
  }
  for (const o of env.allowedOrigins) {
    // The native shells are legitimate origins that are not http(s): iOS serves the bundle from
    // capacitor://localhost (ionic://localhost on older shells). Rejecting those would mean the
    // server refuses to boot the moment the mobile app is added to the allowlist.
    if (NATIVE_ORIGINS.has(o)) continue;
    if (!/^https?:\/\//.test(o)) {
      problems.push(`ALLOWED_ORIGINS entry "${o}" must include the scheme, e.g. https://… (native shells: ${[...NATIVE_ORIGINS].join(', ')})`);
    }
    if (o.startsWith('http://') && !o.includes('localhost')) problems.push(`ALLOWED_ORIGINS entry "${o}" is plain HTTP.`);
  }

  if (problems.length) {
    throw new Error('Refusing to start in production:\n  - ' + problems.join('\n  - '));
  }
}
