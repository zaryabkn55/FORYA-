/**
 * Moment art: the look of a moment card, drawn rather than photographed.
 *
 * Photography can only ever cover the moments someone thought to shoot. A customer's moments are
 * whatever they type in — a christening in Dundee, a shift handover, a flight home — so every cover here
 * is generated from what FORYA always knows about a moment: its forecast, its occasion and how far off it
 * is. Three layers, all deterministic from the moment itself:
 *
 *   band     the panel's tint, from the temperature (sand when it's hot, cool stone when it's freezing)
 *   texture  a quiet drawn pattern, from the occasion (pinstripe for Formal, confetti for Party…)
 *   sky      one large line figure, from the forecast condition (sun, cloud, rain, snow, wind)
 *
 * The id seeds the figure's position and the pattern's phase, so two work trips to the same city in the
 * same weather still don't look like copies, and a card never changes under the user.
 */
import type { Moment, Occasion, Weather } from './types';

export type ArtBand = 'hot' | 'warm' | 'mild' | 'cool' | 'cold' | 'plain';
export type ArtSky = 'sun' | 'cloud' | 'rain' | 'snow' | 'wind' | 'moon';
export type ArtTexture = 'pinstripe' | 'grid' | 'arcs' | 'confetti' | 'horizon' | 'diagonal';

export interface MomentArt {
  band: ArtBand;
  sky: ArtSky;
  texture: ArtTexture;
  /** 0–1, stable for the life of the moment. Shifts the figure and the pattern. */
  seed: number;
  /** The forecast in one short line, or '' when there is no forecast yet. */
  note: string;
}

/* Tints. All within FORYA's paper-and-oat range; the cold end just leans a few degrees cooler. */
export const BAND_TINT: Record<ArtBand, { tint: string; deep: string; line: string }> = {
  hot: { tint: '#f3e4cd', deep: '#b98b4e', line: 'rgba(151, 110, 60, 0.17)' },
  warm: { tint: '#efe7d7', deep: '#a98f63', line: 'rgba(136, 112, 73, 0.16)' },
  mild: { tint: '#eae7df', deep: '#8d8b80', line: 'rgba(110, 107, 101, 0.15)' },
  cool: { tint: '#e5e8e8', deep: '#79868a', line: 'rgba(96, 110, 114, 0.15)' },
  cold: { tint: '#dfe4e8', deep: '#6d7f8c', line: 'rgba(86, 104, 117, 0.16)' },
  plain: { tint: '#efebe3', deep: '#9b968d', line: 'rgba(110, 107, 101, 0.13)' },
};

const TEXTURE: Record<Occasion, ArtTexture> = {
  Formal: 'pinstripe',
  Work: 'grid',
  Dinner: 'arcs',
  Party: 'confetti',
  Holiday: 'horizon',
  Casual: 'diagonal',
};

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};

function band(w?: Weather): ArtBand {
  if (!w) return 'plain';
  const t = w.feelsLike ?? w.temperature;
  if (t >= 24) return 'hot';
  if (t >= 17) return 'warm';
  if (t >= 11) return 'mild';
  if (t >= 4) return 'cool';
  return 'cold';
}

function sky(w: Weather | undefined, date: string): ArtSky {
  if (!w) return 'moon';
  const c = w.condition.toLowerCase();
  if (/snow|sleet|blizzard|ice/.test(c)) return 'snow';
  if (/rain|shower|drizzle|storm|thunder/.test(c)) return 'rain';
  if ((w.windKph ?? 0) >= 32 || /wind|gale|breez/.test(c)) return 'wind';
  if (/clear|sun|fair|bright/.test(c)) {
    // An evening moment under a clear sky gets the moon instead.
    const hour = new Date(date).getHours();
    return hour >= 19 || hour < 6 ? 'moon' : 'sun';
  }
  if (/cloud|overcast|fog|mist|haze/.test(c)) return 'cloud';
  return (w.rainChance ?? 0) > 45 ? 'rain' : 'cloud';
}

export function momentArt(m: Pick<Moment, 'id' | 'occasion' | 'date'> & { weather?: Weather }): MomentArt {
  const w = m.weather;
  return {
    band: band(w),
    sky: sky(w, m.date),
    texture: TEXTURE[m.occasion] ?? 'diagonal',
    seed: hash(m.id || m.occasion),
    note: w ? `${Math.round(w.temperature)}° · ${w.condition}` : '',
  };
}

/** The CSS custom properties a panel needs, ready to spread onto `style`. */
export function artStyle(a: MomentArt): Record<string, string> {
  const c = BAND_TINT[a.band];
  return {
    '--art-tint': c.tint,
    '--art-deep': c.deep,
    '--art-line': c.line,
    '--art-shift': `${Math.round(a.seed * 18)}px`,
    '--art-turn': `${Math.round(-6 + a.seed * 12)}deg`,
  };
}
