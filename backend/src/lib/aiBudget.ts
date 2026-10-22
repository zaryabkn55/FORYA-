/**
 * Spend control for the stylist endpoint.
 *
 * The API key lives on the server, so every call to /api/ai/complete costs the business
 * money. Two ceilings keep that bounded:
 *
 *   1. a per-user rolling-hour limit, so one account can't sit on the endpoint; and
 *   2. a whole-server daily limit, so a compromised account or a bad loop can't run up an
 *      unbounded bill overnight.
 *
 * When the daily ceiling is hit the endpoint returns 429 and the web app quietly falls back
 * to its on-device stylist — the feature degrades, the product keeps working.
 *
 * Counters are in-process. That is the right trade for a single instance; if the API is ever
 * scaled to several replicas these move to Redis, and the daily cap should be divided by the
 * replica count in the meantime. Noted in DEPLOYMENT.md.
 */

const HOUR_MS = 60 * 60 * 1000;

/** Rolling-hour call timestamps, keyed by user id. */
const perUser = new Map<string, number[]>();

let dayKey = utcDay();
let dayCount = 0;

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function rollDayIfNeeded(): void {
  const today = utcDay();
  if (today !== dayKey) {
    dayKey = today;
    dayCount = 0;
  }
}

export type BudgetVerdict =
  | { ok: true }
  | { ok: false; reason: 'user'; retryAfterSeconds: number }
  | { ok: false; reason: 'daily' };

/**
 * Records one call against both ceilings and says whether it may proceed.
 * Only call this when the request is about to be made — it counts.
 */
export function claimAiCall(userId: string, limits: { userHourlyCalls: number; dailyCalls: number }): BudgetVerdict {
  rollDayIfNeeded();

  if (dayCount >= limits.dailyCalls) return { ok: false, reason: 'daily' };

  const now = Date.now();
  const recent = (perUser.get(userId) ?? []).filter((t) => now - t < HOUR_MS);

  if (recent.length >= limits.userHourlyCalls) {
    perUser.set(userId, recent);
    const oldest = recent[0] ?? now;
    return { ok: false, reason: 'user', retryAfterSeconds: Math.max(1, Math.ceil((HOUR_MS - (now - oldest)) / 1000)) };
  }

  recent.push(now);
  perUser.set(userId, recent);
  dayCount += 1;
  return { ok: true };
}

/** For /api/ai/status and operational visibility. */
export function aiBudgetSnapshot(dailyLimit: number) {
  rollDayIfNeeded();
  return { day: dayKey, used: dayCount, limit: dailyLimit, remaining: Math.max(0, dailyLimit - dayCount) };
}

/**
 * Drops users who haven't called in over an hour. Without this the map grows for the life of
 * the process — slow, but a leak all the same on a long-running server.
 */
export function sweepAiBudget(): void {
  const cutoff = Date.now() - HOUR_MS;
  for (const [userId, times] of perUser) {
    const recent = times.filter((t) => t > cutoff);
    if (recent.length) perUser.set(userId, recent);
    else perUser.delete(userId);
  }
}
