/**
 * FORYA stylist engine.
 *
 * Runs on the device, instantly, for every visitor. It reads what each piece is made of and how it is
 * cut, and scores it against the forecast for a moment (warmth, breathability, rain, sun), against the
 * occasion (how dressed-up it is), and against the rest of a look. The AI layer (lib/ai.ts) sits on top:
 * when Claude is available it reasons over the engine's shortlist and writes the advice; when it isn't,
 * the engine's own answers stand on their own.
 */
import type { Category, Moment, Occasion, Product, ShopsFor, Weather, WeatherBand } from './types';
import { bandFor, isWet } from './weather';

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

/* ------------------------------------------------------------------------------------------------ */
/* Climate                                                                                          */
/* ------------------------------------------------------------------------------------------------ */

export interface Climate {
  t: number;
  feels: number;
  band: WeatherBand;
  /** 0 = dress for heat, 1 = dress for freezing. */
  need: number;
  wet: boolean;
  snow: boolean;
  sunny: boolean;
  windy: boolean;
  /** "26° and clear", for copy. */
  label: string;
}

export function climateOf(w: Weather): Climate {
  const windy = (w.windKph ?? 0) >= 30;
  const feels = w.feelsLike ?? w.temperature - (windy ? 3 : 0);
  const wet = isWet(w.condition) || (w.rainChance ?? 0) >= 60;
  return {
    t: w.temperature,
    feels,
    band: bandFor(w.temperature),
    need: clamp((26 - feels) / 28),
    wet,
    snow: /snow|sleet/i.test(w.condition),
    sunny: /clear|sun/i.test(w.condition) && !wet,
    windy,
    label: `${w.temperature}° and ${w.condition.toLowerCase()}`,
  };
}

/** One line of advice for the forecast. */
export function weatherAdvice(w: Weather, shopsFor: ShopsFor = 'women') {
  const c = climateOf(w);
  const men = shopsFor === 'men';
  const base =
    c.t >= 27
      ? `Proper heat. Linen, cotton and silk breathe; keep colours light and leave the wool at home.`
      : c.t >= 20
        ? `Warm. Breathable fabrics and one light layer for the evening.`
        : c.t >= 15
          ? `In-between. A light knit or ${men ? 'an overshirt' : 'a jacket'} you can take off does the work.`
          : c.t >= 9
            ? `Cool. Wool, merino or cashmere close to the skin and a real coat on top.`
            : `Cold. Down, wool and closed shoes. Layer up and cover your neck.`;
  const extra = c.wet ? ' Rain is likely, so pick water-repellent outerwear and skip suede.' : c.sunny && c.t >= 20 ? ` Bring ${men ? 'sunglasses' : 'sunglasses or a hat'}.` : c.windy ? ' It will be windy: nothing too floaty.' : '';
  return base + extra;
}

/* ------------------------------------------------------------------------------------------------ */
/* What a piece is                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

interface Fabric {
  name: string;
  warmth: number;
  breath: number;
  water: number;
}

// Order matters: the first match is the main fabric.
const FABRICS: [RegExp, Fabric][] = [
  [/down|puffer|parka/, { name: 'Down', warmth: 0.95, breath: 0.3, water: 0.55 }],
  [/shearling|sherpa/, { name: 'Shearling', warmth: 0.95, breath: 0.3, water: 0.2 }],
  [/cashmere/, { name: 'Cashmere', warmth: 0.85, breath: 0.6, water: 0.1 }],
  [/tweed|bouclé|boucle/, { name: 'Tweed', warmth: 0.75, breath: 0.4, water: 0.2 }],
  [/borg|fleece/, { name: 'Fleece', warmth: 0.78, breath: 0.45, water: 0.15 }],
  [/merino/, { name: 'Merino', warmth: 0.65, breath: 0.7, water: 0.2 }],
  [/linen/, { name: 'Linen', warmth: 0.1, breath: 1, water: 0 }],
  [/seersucker/, { name: 'Seersucker', warmth: 0.1, breath: 0.95, water: 0 }],
  [/straw|raffia/, { name: 'Straw', warmth: 0.05, breath: 1, water: 0 }],
  [/gabardine|stormwear|water-repellent|shower-resistant|technical/, { name: 'Water-repellent cotton', warmth: 0.5, breath: 0.5, water: 0.85 }],
  [/wool/, { name: 'Wool', warmth: 0.75, breath: 0.55, water: 0.3 }],
  [/velvet/, { name: 'Velvet', warmth: 0.6, breath: 0.3, water: 0.05 }],
  [/suede/, { name: 'Suede', warmth: 0.55, breath: 0.45, water: 0.05 }],
  [/faux leather/, { name: 'Faux leather', warmth: 0.55, breath: 0.15, water: 0.5 }],
  [/leather|lambskin|calf/, { name: 'Leather', warmth: 0.55, breath: 0.3, water: 0.5 }],
  [/silk/, { name: 'Silk', warmth: 0.2, breath: 0.85, water: 0 }],
  [/satin/, { name: 'Satin', warmth: 0.2, breath: 0.55, water: 0 }],
  [/viscose|crepe/, { name: 'Viscose', warmth: 0.25, breath: 0.75, water: 0 }],
  [/denim|jean/, { name: 'Denim', warmth: 0.45, breath: 0.5, water: 0.1 }],
  [/canvas|jute|espadrille/, { name: 'Canvas', warmth: 0.25, breath: 0.75, water: 0 }],
  [/knit|jumper|sweater|cardigan|sweatshirt|hoodie|jersey/, { name: 'Knit', warmth: 0.55, breath: 0.6, water: 0.1 }],
  [/polyester|nylon/, { name: 'Nylon', warmth: 0.3, breath: 0.4, water: 0.6 }],
  [/cotton|poplin|oxford|piqué|pique|twill|chino|tee|t-shirt/, { name: 'Cotton', warmth: 0.3, breath: 0.8, water: 0.05 }],
];

export interface Traits {
  fabric: Fabric;
  warmth: number;
  /** Bare legs or feet, or sleeveless. */
  exposed: boolean;
  /** 0 = loungewear, 1 = black tie. */
  formality: number;
  sun: boolean;
  swim: boolean;
  slot: Slot;
}

export type Slot = 'dress' | 'top' | 'bottom' | 'tailoring' | 'layer' | 'outer' | 'shoes' | 'bag' | 'accessory';

const text = (p: Product) => `${p.name} ${p.material ?? ''} ${p.description ?? ''}`.toLowerCase();

export function slotOf(p: Product): Slot {
  const t = p.name.toLowerCase();
  const map: Record<Category, Slot> = { Dresses: 'dress', Tops: 'top', Knitwear: 'layer', Bottoms: 'bottom', Outerwear: 'outer', Shoes: 'shoes', Bags: 'bag', Accessories: 'accessory', Tailoring: 'tailoring' };
  if (p.category === 'Tailoring' && /trouser|pant/.test(t)) return 'bottom';
  if (p.category === 'Knitwear' && /dress/.test(t)) return 'dress';
  return map[p.category];
}

const cache = new Map<string, Traits>();

export function traitsOf(p: Product): Traits {
  const hit = cache.get(p.id);
  if (hit) return hit;
  const t = text(p);
  const name = p.name.toLowerCase();
  const fabric = FABRICS.find(([re]) => re.test(`${(p.material ?? '').toLowerCase()} ${name}`))?.[1] ?? FABRICS.find(([re]) => re.test(t))?.[1] ?? { name: 'Mixed', warmth: 0.45, breath: 0.6, water: 0.1 };
  let warmth = fabric.warmth;
  if (p.category === 'Outerwear') warmth = clamp(warmth + 0.22);
  if (p.category === 'Knitwear') warmth = clamp(warmth + 0.08);
  if (p.category === 'Shoes') warmth = /boot/.test(name) ? clamp(warmth + 0.3) : 0.3;
  if (/scarf/.test(name)) warmth = 0.85;
  const exposed = /\bshorts\b|bermuda|sandal|\bslides?\b|espadrille|\bmules?\b|sundress|\bcami|sleeveless|swim|\bmini\b|strappy|one-shoulder|bikini/.test(t);
  if (exposed) warmth = Math.min(warmth, 0.15);
  const swim = /swim|bikini/.test(name);
  const sun = /sunglass|straw hat|wide-brim/.test(name);

  const formalWords: [RegExp, number][] = [
    [/tuxedo|dinner|black tie|satin-lapel/, 0.95],
    [/velvet|sequin|gown|couture/, 0.85],
    [/silk|satin|slip dress|heel|stiletto/, 0.75],
    [/suit|blazer|tailored|overcoat|wrap coat|derby|oxford shoe|loafer|midi dress|cashmere|trench|mac|car coat|raincoat/, 0.7],
    [/t-shirt|\btee\b|drawstring|jogger|sweatshirt|hoodie|boxy/, 0.22],
    [/shirt|knit|polo|chino|trouser|boot|tote|shoulder bag|messenger|cardigan|skirt|dress/, 0.5],
    [/jean|denim|tee|t-shirt|trainer|sneaker|hoodie|sweatshirt|fleece|short|espadrille|sandal|slide|swim|backpack|puffer|gilet|parka/, 0.22],
  ];
  const formality = formalWords.find(([re]) => re.test(name))?.[1] ?? 0.45;
  const traits = { fabric, warmth, exposed, formality, sun, swim, slot: slotOf(p) };
  cache.set(p.id, traits);
  return traits;
}

/* ------------------------------------------------------------------------------------------------ */
/* Weather fit                                                                                      */
/* ------------------------------------------------------------------------------------------------ */

export type FitVerdict = 'great' | 'good' | 'ok' | 'poor';

export interface WeatherFit {
  score: number; // 0-100
  verdict: FitVerdict;
  reason: string;
}

/** The score a piece needs to show when "match the weather" is on. */
export const RELEVANT = 55;

export function weatherFit(p: Product, w?: Weather): WeatherFit {
  if (!w) return { score: 70, verdict: 'good', reason: '' };
  const c = climateOf(w);
  const tr = traitsOf(p);
  const neutral = p.category === 'Bags' || (p.category === 'Accessories' && !tr.sun && !/scarf|hat|glove/.test(p.name.toLowerCase()));
  let fit = neutral ? 0.72 : 1 - Math.abs(tr.warmth - c.need) * 1.15;
  let reason = '';

  if (!neutral) {
    if (c.need < 0.3) {
      fit += (tr.fabric.breath - 0.5) * 0.45;
      if (tr.exposed) fit += 0.12;
      if (p.category === 'Outerwear' && tr.warmth > 0.6) fit -= 0.35;
    }
    if (c.need > 0.6) {
      if (tr.exposed) fit -= 0.45;
      if (p.category === 'Outerwear' && tr.warmth >= 0.75) fit += 0.15;
    }
    if (c.need >= 0.3 && c.need <= 0.6 && p.category === 'Outerwear' && tr.warmth > 0.9) fit -= 0.15;
    // Base layers go under knitwear and coats, so a shirt or proper trousers still work in the cold.
    const base = (tr.slot === 'top' || tr.slot === 'bottom') && !tr.exposed && !/linen|silk|satin|seersucker/i.test(tr.fabric.name);
    if (c.need > 0.5 && base) fit = Math.max(fit, tr.slot === 'top' ? 0.6 : 0.62);
  }
  if (c.wet) {
    if (p.rainReady || tr.fabric.water >= 0.55) fit += 0.15;
    else if (/suede|satin|canvas/.test(tr.fabric.name.toLowerCase()) && (p.category === 'Shoes' || p.category === 'Outerwear' || p.category === 'Bags')) fit -= 0.3;
  }
  if (tr.sun) fit = c.sunny && c.t >= 18 ? 0.95 : c.t >= 18 ? 0.62 : 0.2;
  if (tr.swim) fit = c.t >= 22 ? 0.85 : 0.1;
  // The label's own season tags count as a second opinion.
  if (p.weather) fit += p.weather.includes(c.band) ? 0.08 : -0.22;

  const score = Math.round(clamp(fit) * 100);
  const verdict: FitVerdict = score >= 80 ? 'great' : score >= 62 ? 'good' : score >= RELEVANT ? 'ok' : 'poor';
  const f = tr.fabric.name;

  if (tr.sun) reason = c.sunny && c.t >= 18 ? 'Made for the sun' : 'Not much sun forecast';
  else if (tr.swim) reason = c.t >= 22 ? 'Warm enough for a swim' : 'Too cold for swimming';
  else if (neutral) reason = 'Works in any weather';
  else if (c.wet && (p.rainReady || tr.fabric.water >= 0.55) && score >= RELEVANT) reason = 'Shrugs off the rain';
  else if (c.wet && score < RELEVANT && /suede|satin|canvas/i.test(f)) reason = `${f} and rain don't mix`;
  else if (score >= RELEVANT) {
    if (c.need < 0.3) reason = tr.fabric.breath >= 0.75 ? `${f} breathes at ${c.t}°` : `Light enough for ${c.t}°`;
    else if (c.need > 0.5) reason = tr.warmth >= 0.7 ? `${f} keeps you warm at ${c.t}°` : `Layers well at ${c.t}°`;
    else reason = `Right weight for ${c.t}°`;
  } else {
    if (tr.exposed && c.need > 0.5) reason = `Too bare for ${c.t}°`;
    else if (tr.warmth > c.need) reason = `Too warm for ${c.t}°`;
    else reason = `Not warm enough for ${c.t}°`;
  }
  return { score, verdict, reason };
}

export const suitsWeather = (p: Product, w?: Weather) => !w || weatherFit(p, w).score >= RELEVANT;

/* ------------------------------------------------------------------------------------------------ */
/* Occasion fit                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

const OCCASION_TARGET: Record<Occasion, number> = { Formal: 0.85, Work: 0.65, Dinner: 0.65, Party: 0.6, Holiday: 0.3, Casual: 0.25 };

export function occasionFit(p: Product, o?: Occasion) {
  if (!o) return 0.7;
  const tr = traitsOf(p);
  if (tr.slot === 'bag' || tr.slot === 'accessory') return 0.75;
  if (tr.swim) return o === 'Holiday' ? 0.8 : 0;
  return clamp(1 - Math.abs(tr.formality - OCCASION_TARGET[o]) * 1.3);
}

/* ------------------------------------------------------------------------------------------------ */
/* Ranking for a moment                                                                             */
/* ------------------------------------------------------------------------------------------------ */

export interface Ranked {
  p: Product;
  score: number;
  fit: WeatherFit;
}

/** How well a piece suits a moment: mostly weather, then occasion. */
export function momentScore(p: Product, m?: Pick<Moment, 'occasion' | 'weather'>) {
  const fit = weatherFit(p, m?.weather);
  const occ = occasionFit(p, m?.occasion);
  // For work and formal moments, getting the dress code right matters as much as the weather.
  const w = m?.occasion === 'Work' || m?.occasion === 'Formal' ? 0.5 : 0.62;
  return { score: Math.round(fit.score * w + occ * 100 * (1 - w)), fit };
}

export function rankFor(products: Product[], m?: Pick<Moment, 'occasion' | 'weather'>, opts: { strict?: boolean } = {}): Ranked[] {
  return products
    .map((p) => ({ p, ...momentScore(p, m) }))
    .filter((r) => !opts.strict || r.fit.score >= RELEVANT)
    .sort((a, b) => b.score - a.score);
}

/** A varied shortlist: the best pieces without five of the same thing. */
export function topPicks(products: Product[], m: Pick<Moment, 'occasion' | 'weather'> | undefined, n = 8, exclude: Set<string> = new Set()) {
  const out: Ranked[] = [];
  const perSlot = new Map<Slot, number>();
  const seenImg = new Set<string>();
  for (const r of rankFor(products, m, { strict: true })) {
    if (exclude.has(r.p.id)) continue;
    const s = traitsOf(r.p).slot;
    if ((perSlot.get(s) ?? 0) >= 2 || seenImg.has(r.p.imageUrl)) continue;
    perSlot.set(s, (perSlot.get(s) ?? 0) + 1);
    seenImg.add(r.p.imageUrl);
    out.push(r);
    if (out.length >= n) break;
  }
  return out;
}

/* ------------------------------------------------------------------------------------------------ */
/* Outfit builder                                                                                   */
/* ------------------------------------------------------------------------------------------------ */

const NEUTRALS = /white|ivory|ecru|cream|black|navy|grey|gray|charcoal|stone|sand|beige|camel|tan|taupe|brown|chocolate|off-white|oat|natural|rinse|wash|denim/i;

export interface StyleOptions {
  shopsFor: ShopsFor;
  owned?: Set<string>;
  saved?: Set<string>;
  /** Pick a different outfit each time. */
  seed?: number;
  /** Keep these pieces in the look. */
  keep?: Product[];
  /** Pieces to steer away from, so a restyle gives something new. */
  avoid?: Set<string>;
  maxPrice?: number;
}

export interface Outfit {
  pieces: Product[];
  why: Record<string, string>;
  headline: string;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), ((s >>>= 0) % 1000) / 1000);
}

/** Build a complete look for a moment from the catalogue, favouring pieces you own or saved. */
export function styleLook(products: Product[], m: Pick<Moment, 'occasion' | 'weather' | 'title'>, o: StyleOptions): Outfit {
  const r = rng(o.seed ?? 7);
  const c = m.weather ? climateOf(m.weather) : undefined;
  const need = c?.need ?? 0.45;
  const pool = products.filter((p) => !o.maxPrice || p.price <= o.maxPrice || o.owned?.has(p.id));
  const scored = pool.map((p) => {
    const { score, fit } = momentScore(p, m);
    const bonus =
      (o.owned?.has(p.id) ? 14 : 0) +
      (o.saved?.has(p.id) ? 7 : 0) +
      (o.avoid?.has(p.id) ? -30 : 0) +
      r() * (m.occasion === 'Work' || m.occasion === 'Formal' ? 9 : 16);
    return { p, s: score + bonus, fit };
  });
  const best = (slot: Slot | Slot[], filter: (p: Product) => boolean = () => true) => {
    const slots = Array.isArray(slot) ? slot : [slot];
    return scored
      .filter((x) => slots.includes(traitsOf(x.p).slot) && x.fit.score >= RELEVANT && filter(x.p))
      .sort((a, b) => b.s - a.s)[0]?.p;
  };

  const kept = o.keep ?? [];
  const has = (s: Slot) => kept.some((p) => traitsOf(p).slot === s);
  const picks: Product[] = [...kept];
  const add = (p?: Product) => p && !picks.some((x) => x.id === p.id) && picks.push(p);
  const noSwim = (p: Product) => !traitsOf(p).swim || m.occasion === 'Holiday';

  const dressy = ['Formal', 'Dinner', 'Party'].includes(m.occasion);
  const wantDress = o.shopsFor === 'women' && !has('top') && !has('bottom') && (has('dress') || (dressy ? r() < 0.75 : m.occasion === 'Holiday' ? r() < 0.5 : r() < 0.2));
  const suited = o.shopsFor === 'men' && (m.occasion === 'Formal' || (m.occasion === 'Work' && need > 0.25));

  if (wantDress) add(best('dress'));
  if (!picks.some((p) => traitsOf(p).slot === 'dress')) {
    add(best('top', noSwim) ?? (need > 0.5 ? best('layer') : undefined));
    add(best('bottom', (p) => noSwim(p) && (!suited || /trouser/i.test(p.name))));
  }
  if (suited || (m.occasion === 'Work' && need > 0.3 && need < 0.75)) add(best('tailoring', (p) => !/trouser/i.test(p.name)));
  if (need > 0.62 && !wantDress) add(best('layer', (p) => !(dressy || m.occasion === 'Work') || traitsOf(p).formality >= 0.4));
  const smart = dressy || m.occasion === 'Work';
  if (need > 0.42 || c?.wet) add(best('outer', (p) => (!c?.wet || !!p.rainReady || traitsOf(p).fabric.water >= 0.5 || need > 0.75) && (!smart || traitsOf(p).formality >= 0.45)));
  add(best('shoes', (p) => (dressy || m.occasion === 'Work' ? traitsOf(p).formality >= 0.4 : true)));
  if (o.shopsFor === 'women' || m.occasion === 'Work' || m.occasion === 'Holiday') add(best('bag', (p) => !smart || traitsOf(p).formality >= 0.4));
  if (c?.sunny && c.t >= 20) add(best('accessory', (p) => traitsOf(p).sun));
  else if (need > 0.7) add(best('accessory', (p) => /scarf/i.test(p.name)));
  else if (suited) add(best('accessory', (p) => /belt/i.test(p.name)));

  const why: Record<string, string> = {};
  for (const p of picks) {
    const f = weatherFit(p, m.weather);
    why[p.id] = o.owned?.has(p.id) ? `Already yours. ${f.reason}` : f.reason || 'Finishes the look';
  }
  const loud = picks.filter((p) => !NEUTRALS.test(p.colorName)).length;
  const headline = c
    ? `${m.title}: ${c.label}. ${c.need < 0.3 ? 'Light, breathable pieces' : c.need > 0.6 ? 'Warm layers' : 'Easy layers'}${loud <= 1 ? ' in a calm palette' : ''}, pitched for ${m.occasion.toLowerCase()}.`
    : `${m.title}: pitched for ${m.occasion.toLowerCase()}.`;
  return { pieces: picks, why, headline };
}

/* ------------------------------------------------------------------------------------------------ */
/* Look check                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

export interface LookCheck {
  score: number;
  grade: string;
  checks: { label: string; ok: boolean; detail: string }[];
  swaps: { out?: Product; in: Product; reason: string }[];
}

export function checkLook(pieces: Product[], m: Pick<Moment, 'occasion' | 'weather' | 'title'>, products: Product[], shopsFor: ShopsFor): LookCheck {
  const c = m.weather ? climateOf(m.weather) : undefined;
  const slots = new Set(pieces.map((p) => traitsOf(p).slot));
  const checks: LookCheck['checks'] = [];
  const swaps: LookCheck['swaps'] = [];
  const onLook = new Set(pieces.map((p) => p.id));
  const alt = (slot: Slot, extra: (p: Product) => boolean = () => true) => rankFor(products, m, { strict: true }).find((r) => traitsOf(r.p).slot === slot && !onLook.has(r.p.id) && extra(r.p))?.p;

  // Complete?
  const top = slots.has('top') || slots.has('layer');
  const base = slots.has('dress') || (top && slots.has('bottom')) || (slots.has('tailoring') && slots.has('bottom'));
  const shoes = slots.has('shoes');
  const missing = [!base && (top ? 'something for your legs' : slots.has('bottom') ? 'a top' : shopsFor === 'women' ? 'a dress, or a top and bottoms' : 'a top and trousers'), !shoes && 'shoes'].filter(Boolean) as string[];
  checks.push({ label: 'Complete', ok: missing.length === 0, detail: missing.length ? `Still needs ${missing.join(' and ')}.` : 'Head to toe, sorted.' });
  if (!shoes) {
    const s = alt('shoes');
    if (s) swaps.push({ in: s, reason: 'Adds shoes that suit the day' });
  }
  if (!base) {
    const s = top ? alt('bottom') : slots.has('bottom') ? alt('top') : shopsFor === 'women' ? alt('dress') : alt('top');
    if (s) swaps.push({ in: s, reason: 'Completes the base of the look' });
  }

  // Weather
  let wScore = 1;
  if (c) {
    const fits = pieces.map((p) => ({ p, f: weatherFit(p, m.weather) }));
    const worst = fits.filter((x) => x.f.score < RELEVANT).sort((a, b) => a.f.score - b.f.score);
    const needsCoat = c.need > 0.5 || c.wet;
    const hasCoat = slots.has('outer') || (c.need <= 0.6 && slots.has('tailoring'));
    wScore = fits.length ? fits.reduce((s, x) => s + x.f.score, 0) / fits.length / 100 : 0;
    const issues = [...worst.map((x) => `${x.p.name}: ${x.f.reason.toLowerCase()}`), needsCoat && !hasCoat ? `no ${c.wet ? 'rain-proof ' : ''}outer layer for ${c.label}` : ''].filter(Boolean);
    checks.push({ label: `Ready for ${c.t}°`, ok: issues.length === 0, detail: issues.length ? issues.slice(0, 2).join('; ') + '.' : `Every piece suits ${c.label}.` });
    for (const x of worst.slice(0, 2)) {
      const s = alt(traitsOf(x.p).slot);
      if (s) swaps.push({ out: x.p, in: s, reason: weatherFit(s, m.weather).reason });
    }
    if (needsCoat && !hasCoat) {
      const s = alt('outer', (p) => !c.wet || !!p.rainReady);
      if (s) swaps.push({ in: s, reason: c.wet ? 'Keeps the rain off' : 'Adds the warmth you need' });
    }
    if (!needsCoat) wScore = Math.min(1, wScore + 0.05);
  }

  // Occasion
  const occ = pieces.map((p) => ({ p, f: occasionFit(p, m.occasion) }));
  const off = occ.filter((x) => x.f < 0.45);
  const oScore = occ.length ? occ.reduce((s, x) => s + x.f, 0) / occ.length : 0;
  checks.push({
    label: `Right for ${m.occasion.toLowerCase()}`,
    ok: off.length === 0,
    detail: off.length ? `${off.map((x) => x.p.name).slice(0, 2).join(' and ')} ${off.length === 1 ? 'reads' : 'read'} ${traitsOf(off[0].p).formality > 0.6 ? 'too dressed-up' : 'too casual'}.` : 'Pitched just right.',
  });
  for (const x of off.slice(0, 1)) {
    const s = alt(traitsOf(x.p).slot, (p) => occasionFit(p, m.occasion) >= 0.7);
    if (s && !swaps.some((w) => w.in.id === s.id)) swaps.push({ out: x.p, in: s, reason: `Better pitched for ${m.occasion.toLowerCase()}` });
  }

  // Palette
  const loud = pieces.filter((p) => !NEUTRALS.test(p.colorName));
  checks.push({ label: 'Palette', ok: loud.length <= 2, detail: loud.length === 0 ? 'All neutrals. Calm and easy.' : loud.length <= 2 ? `${loud.map((p) => p.colorName.toLowerCase()).join(' and ')} against neutrals. Nice.` : `${loud.length} statement colours. Pick one to lead.` });

  const done = (base ? 0.5 : 0) + (shoes ? 0.5 : 0);
  const score = pieces.length ? Math.round((done * 0.3 + wScore * 0.35 + oScore * 0.25 + (loud.length <= 2 ? 0.1 : 0.04)) * 100) : 0;
  const grade = score >= 85 ? 'Ready to go' : score >= 70 ? 'Nearly there' : score >= 50 ? 'Getting there' : 'Just started';
  return { score, grade, checks, swaps: swaps.slice(0, 3) };
}

/* ------------------------------------------------------------------------------------------------ */
/* Plain-English requests                                                                           */
/* ------------------------------------------------------------------------------------------------ */

export interface Intent {
  maxPrice?: number;
  minPrice?: number;
  categories: Category[];
  colours: string[];
  occasion?: Occasion;
  weather?: Weather;
  place?: string;
  tier?: Product['tier'];
  brand?: string;
  words: string[];
  /** Specific kinds of piece asked for ("boots", "blazer"), matched against names. */
  kinds: string[];
  /** "Something warm" or "something light". */
  warmth?: 'up' | 'down';
  /** Human-readable summary of what was understood. */
  chips: string[];
}

const CAT_WORDS: [RegExp, Category][] = [
  [/\bdress(es)?\b|\bgown\b/, 'Dresses'],
  [/\bshirts?\b|\btops?\b|\btees?\b|t-shirt|\bpolo|\bblouse|\bcami/, 'Tops'],
  [/knit|jumper|sweater|cardigan|hoodie|sweatshirt|roll-?neck/, 'Knitwear'],
  [/blazer|\bsuits?\b|tailoring|tux/, 'Tailoring'],
  [/trousers|\bjeans\b|shorts|skirt|chinos|pants|bottoms/, 'Bottoms'],
  [/\bcoats?\b|jacket|parka|puffer|trench|outerwear|\bmac\b|gilet/, 'Outerwear'],
  [/shoes|trainers|sneakers|boots|loafers|sandals|heels|espadrilles|mules|flats/, 'Shoes'],
  [/\bbags?\b|tote|holdall|backpack|clutch|messenger/, 'Bags'],
  [/belt|scarf|sunglasses|\bhat\b|accessor/, 'Accessories'],
];

const KINDS = ['boot', 'loafer', 'trainer', 'sneaker', 'sandal', 'heel', 'mule', 'flat', 'espadrille', 'jean', 'short', 'skirt', 'chino', 'trouser', 'blazer', 'coat', 'jacket', 'parka', 'puffer', 'trench', 'tote', 'backpack', 'holdall', 'scarf', 'belt', 'sunglass', 'hat', 'shirt', 'tee', 'polo', 'cardigan', 'jumper', 'hoodie', 'dress', 'gilet'];

const COLOURS = ['white', 'black', 'navy', 'blue', 'grey', 'beige', 'camel', 'brown', 'green', 'olive', 'red', 'pink', 'cream', 'ecru', 'stone', 'tan', 'sage', 'yellow', 'orange', 'purple', 'silver', 'gold', 'floral', 'stripe'];

/** Typical weather for places people dress for, for requests that name a place but no forecast. */
const PLACES: Record<string, Weather> = {
  lisbon: { temperature: 26, condition: 'Clear sky' }, amalfi: { temperature: 28, condition: 'Clear sky' }, ibiza: { temperature: 29, condition: 'Clear sky' },
  mykonos: { temperature: 28, condition: 'Clear sky' }, santorini: { temperature: 28, condition: 'Clear sky' }, dubai: { temperature: 35, condition: 'Clear sky' },
  marrakech: { temperature: 31, condition: 'Clear sky' }, bali: { temperature: 30, condition: 'Partly cloudy' }, miami: { temperature: 31, condition: 'Partly cloudy' },
  barcelona: { temperature: 25, condition: 'Clear sky' }, nice: { temperature: 25, condition: 'Clear sky' }, 'st tropez': { temperature: 27, condition: 'Clear sky' },
  rome: { temperature: 24, condition: 'Clear sky' }, paris: { temperature: 15, condition: 'Partly cloudy' }, london: { temperature: 13, condition: 'Overcast' },
  'new york': { temperature: 14, condition: 'Partly cloudy' }, edinburgh: { temperature: 9, condition: 'Light rain' }, copenhagen: { temperature: 10, condition: 'Overcast' },
  reykjavik: { temperature: 3, condition: 'Light rain' }, oslo: { temperature: 4, condition: 'Overcast' }, zermatt: { temperature: -3, condition: 'Snow' },
  verbier: { temperature: -2, condition: 'Snow' }, courchevel: { temperature: -2, condition: 'Snow' }, tokyo: { temperature: 18, condition: 'Partly cloudy' },
  lahore: { temperature: 32, condition: 'Clear sky' }, 'cape town': { temperature: 22, condition: 'Clear sky' },
};

export function parseIntent(q: string, brands: string[] = []): Intent {
  const s = ` ${q.toLowerCase()} `;
  const chips: string[] = [];
  const i: Intent = { categories: [], colours: [], words: [], kinds: [], chips };

  const range = s.match(/£?\s?(\d{2,5})\s?(?:-|to)\s?£?\s?(\d{2,5})/);
  const under = s.match(/(?:under|below|less than|max|up to|<)\s?£?\s?(\d{2,5})/);
  const over = s.match(/(?:over|above|more than|from|>)\s?£?\s?(\d{2,5})/);
  if (range) (i.minPrice = +range[1]), (i.maxPrice = +range[2]), chips.push(`£${range[1]}–£${range[2]}`);
  else {
    if (under) (i.maxPrice = +under[1]), chips.push(`Under £${under[1]}`);
    if (over) (i.minPrice = +over[1]), chips.push(`Over £${over[1]}`);
  }
  if (/\b(cheap|budget|affordable|high street)\b/.test(s)) (i.tier = 'Affordable'), chips.push('Affordable');
  else if (/\b(investment|mid-range|attainable)\b/.test(s)) (i.tier = 'Attainable'), chips.push('Attainable');
  else if (/\b(luxury|designer|splurge|aspirational)\b/.test(s)) (i.tier = 'Aspirational'), chips.push('Aspirational');

  for (const [re, cat] of CAT_WORDS) if (re.test(s) && !i.categories.includes(cat)) i.categories.push(cat), chips.push(cat);
  for (const k of KINDS) if (new RegExp(`\\b${k}(e?s)?\\b`).test(s)) i.kinds.push(k);
  for (const col of COLOURS) if (new RegExp(`\\b${col}`).test(s)) i.colours.push(col), chips.push(col[0].toUpperCase() + col.slice(1));

  const occ: [RegExp, Occasion][] = [
    [/wedding|black tie|gala|ceremony|christening|races|ascot/, 'Formal'],
    [/interview|office|work|meeting|conference|client|presentation/, 'Work'],
    [/dinner|date|restaurant|anniversary/, 'Dinner'],
    [/party|drinks|club|birthday|night out|gig/, 'Party'],
    [/holiday|vacation|beach|trip|getaway|pool|resort|travel/, 'Holiday'],
    [/weekend|brunch|casual|errands|coffee/, 'Casual'],
  ];
  i.occasion = occ.find(([re]) => re.test(s))?.[1];
  if (i.occasion) chips.push(i.occasion);

  const place = Object.keys(PLACES).find((k) => s.includes(` ${k}`));
  if (place) {
    i.place = place.replace(/\b\w/g, (x) => x.toUpperCase());
    i.weather = PLACES[place];
  }
  if (/heatwave|tropical|scorching|desert/.test(s)) i.weather = { temperature: 32, condition: 'Clear sky' };
  else if (/beach|summer|hot|sunny|pool|resort/.test(s) && !i.weather) i.weather = { temperature: 27, condition: 'Clear sky' };
  else if (/snow|ski|freezing|arctic/.test(s)) i.weather = { temperature: -2, condition: 'Snow' };
  if (/cosy|cozy|(something|anything|keep me|stay|really) warm|warmest/.test(s)) i.warmth = 'up';
  else if (/breathable|lightweight|(something|anything|keep me|stay) (light|cool)/.test(s)) i.warmth = 'down';
  if (i.warmth === 'up' && !i.weather) i.weather = { temperature: 5, condition: 'Overcast' };
  else if (/winter|cold|chilly/.test(s) && !i.weather) i.weather = { temperature: 5, condition: 'Overcast' };
  else if (/spring|autumn|fall|mild/.test(s) && !i.weather) i.weather = { temperature: 15, condition: 'Partly cloudy' };
  if (/rain|wet|drizzle|showers/.test(s)) i.weather = { temperature: i.weather?.temperature ?? 12, condition: 'Light rain' };
  if (i.weather) chips.push(`${i.place ? `${i.place} · ` : ''}${i.weather.temperature}° ${i.weather.condition.toLowerCase()}`);

  i.brand = brands.find((b) => s.includes(` ${b.toLowerCase()}`));
  if (i.brand) chips.push(i.brand);

  const STOP = /^(warm|cosy|cozy|light|breathable|a|an|the|for|to|in|on|at|my|me|i|im|i'm|and|or|with|something|anything|some|need|want|what|should|wear|outfit|look|looks|show|find|good|nice|under|over|below|above|less|than|more|from|ideas|please|can|you|get|going|it|is|of|that|this|day|night|next|week|weekend)$/;
  const known = new RegExp(['\\d', ...CAT_WORDS.map(([re]) => re.source), ...COLOURS, ...occ.map(([re]) => re.source)].join('|'));
  i.words = s
    .split(/[^a-z0-9&'-]+/)
    .filter((w) => w.length > 2 && !STOP.test(w) && !known.test(w) && !(i.place ?? '').toLowerCase().includes(w) && !(i.brand ?? '').toLowerCase().includes(w));
  return i;
}

/** Does an intent read like a plain search term rather than a request? */
export const isSmartQuery = (i: Intent) => i.chips.length > 0;

export function applyIntent(products: Product[], i: Intent) {
  const filtered = products.filter(
    (p) =>
      (!i.maxPrice || p.price <= i.maxPrice) &&
      (!i.minPrice || p.price >= i.minPrice) &&
      (!i.categories.length || i.categories.includes(p.category) || (i.categories.includes('Bottoms') && slotOf(p) === 'bottom')) &&
      (!i.kinds.length || i.kinds.some((k) => new RegExp(`\\b${k}`, 'i').test(p.name))) &&
      (!i.colours.length || i.colours.some((c) => `${p.colorName} ${p.name}`.toLowerCase().includes(c))) &&
      (!i.tier || p.tier === i.tier) &&
      (!i.brand || p.brand === i.brand) &&
      (!i.words.length || i.words.every((w) => `${p.brand} ${p.name} ${p.colorName} ${p.material ?? ''} ${p.description ?? ''}`.toLowerCase().includes(w))),
  );
  const m = { occasion: i.occasion ?? 'Casual', weather: i.weather };
  const ranked = rankFor(filtered, i.weather || i.occasion ? m : undefined, { strict: !!i.weather });
  if (!i.warmth) return ranked;
  const lean = (r: Ranked) => r.score + (i.warmth === 'up' ? traitsOf(r.p).warmth : 1 - traitsOf(r.p).warmth) * 50;
  return ranked.sort((a, b) => lean(b) - lean(a));
}
