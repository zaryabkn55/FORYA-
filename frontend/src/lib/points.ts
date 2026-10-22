/**
 * Style points: a light reward loop. You earn points for finishing looks and sharing them, and climb
 * through levels. Kept per account on this device for now; move to the API when there's a points table.
 */
export type PointEvent = 'look-ready' | 'shared' | 'shared-social';

export const POINTS: Record<PointEvent, number> = { 'look-ready': 10, shared: 15, 'shared-social': 20 };

export const LEVELS = [
  { name: 'Fresh face', at: 0 },
  { name: 'Trendsetter', at: 50 },
  { name: 'Style icon', at: 150 },
  { name: 'Muse', at: 300 },
];

const key = (userId: string) => `forya.points.${userId}`;

export function getPoints(userId?: string): { total: number; log: { e: PointEvent; ref: string; at: string }[] } {
  if (!userId) return { total: 0, log: [] };
  try {
    return JSON.parse(localStorage.getItem(key(userId)) ?? '') as { total: number; log: { e: PointEvent; ref: string; at: string }[] };
  } catch {
    return { total: 0, log: [] };
  }
}

/** Award points once per event and reference (e.g. sharing the same look twice only counts once). Returns points added. */
export function award(userId: string | undefined, e: PointEvent, ref: string) {
  if (!userId) return 0;
  const p = getPoints(userId);
  if (p.log.some((l) => l.e === e && l.ref === ref)) return 0;
  p.total += POINTS[e];
  p.log.push({ e, ref, at: new Date().toISOString() });
  try {
    localStorage.setItem(key(userId), JSON.stringify(p));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('forya:points'));
  return POINTS[e];
}

export function levelFor(total: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && total >= LEVELS[i + 1].at) i++;
  const next = LEVELS[i + 1];
  const progress = next ? (total - LEVELS[i].at) / (next.at - LEVELS[i].at) : 1;
  return { level: LEVELS[i], next, progress, toNext: next ? next.at - total : 0 };
}
