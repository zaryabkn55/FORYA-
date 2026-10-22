/**
 * Shareable looks. A shared look is a small snapshot of the canvas (title, date, pieces and their
 * positions). On the live API it is stored and gets a short link (/look/s/:id) that collects friends'
 * reactions. Offline it is packed into the link itself (/look/:payload), so sharing always works.
 */
import type { Moment, Occasion, Piece, Weather } from './types';

export interface SharedLook {
  title: string;
  occasion: Occasion;
  date: string;
  by: string; // first name of the person who styled it
  weather?: Weather;
  pieces: Piece[];
}

export type Reaction = 'wear' | 'obsessed' | 'swap';
export type Reactions = Record<Reaction, number>;
export const NO_REACTIONS: Reactions = { wear: 0, obsessed: 0, swap: 0 };

export const REACTIONS: { id: Reaction; label: string; icon: 'heart' | 'sparkle' | 'sync' }[] = [
  { id: 'wear', label: 'Wear it', icon: 'heart' },
  { id: 'obsessed', label: 'Obsessed', icon: 'sparkle' },
  { id: 'swap', label: 'Swap a piece', icon: 'sync' },
];

export function snapshot(m: Moment, by: string): SharedLook {
  return { title: m.title, occasion: m.occasion, date: m.date, by: by.split(' ')[0], weather: m.weather, pieces: m.look.pieces };
}

const b64url = {
  encode: (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  decode: (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))),
};

/** Compact, URL-safe form: pieces become [productId, x, y, w, z] with one decimal. */
export function encodeLook(l: SharedLook) {
  const r = (n: number) => Math.round(n * 10) / 10;
  const compact = { v: 1, t: l.title, o: l.occasion, d: l.date.slice(0, 10), b: l.by, w: l.weather, p: l.pieces.map((p) => [p.productId, r(p.x), r(p.y), r(p.w), p.z]) };
  return b64url.encode(JSON.stringify(compact));
}

export function decodeLook(payload: string): SharedLook | null {
  try {
    const c = JSON.parse(b64url.decode(payload));
    if (c.v !== 1 || !Array.isArray(c.p)) return null;
    return {
      title: String(c.t),
      occasion: c.o,
      date: c.d,
      by: String(c.b ?? 'A friend'),
      weather: c.w,
      pieces: c.p.map(([productId, x, y, w, z]: [string, number, number, number, number], i: number) => ({ id: `s${i}`, productId, x, y, w, z })),
    };
  } catch {
    return null;
  }
}

/** Public link for a shared look. Uses the site's address, so it works once FORYA is deployed. */
export function lookUrl(path: string) {
  return `${window.location.origin}${path}`;
}

/* Reactions for offline links are kept on this device. */
const RKEY = 'forya.reactions.v1';
const readAll = (): Record<string, { counts: Reactions; mine?: Reaction }> => {
  try {
    return JSON.parse(localStorage.getItem(RKEY) ?? '{}');
  } catch {
    return {};
  }
};
export function localReactions(key: string) {
  return readAll()[key] ?? { counts: { ...NO_REACTIONS } };
}
export function localReact(key: string, r: Reaction) {
  const all = readAll();
  const cur = all[key] ?? { counts: { ...NO_REACTIONS } };
  if (cur.mine) cur.counts[cur.mine] = Math.max(0, cur.counts[cur.mine] - 1);
  if (cur.mine === r) delete cur.mine;
  else {
    cur.counts[r] += 1;
    cur.mine = r;
  }
  all[key] = cur;
  try {
    localStorage.setItem(RKEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  return cur;
}

/** For server-counted links we only remember which reaction this browser picked. */
export function rememberMine(key: string, r?: Reaction) {
  const all = readAll();
  const cur = all[key] ?? { counts: { ...NO_REACTIONS } };
  if (r) cur.mine = r;
  else delete cur.mine;
  all[key] = cur;
  try {
    localStorage.setItem(RKEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
