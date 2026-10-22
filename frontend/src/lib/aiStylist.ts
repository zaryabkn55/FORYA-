/**
 * The AI-native features: the stylist chat, "Style it for me" and the look check note.
 * Each one asks Claude when it can (lib/ai.ts) and falls back to the on-device engine.
 */
import { aiSource, askJson, type AiSource, type Turn } from './ai';
import { money, shortDate } from './format';
import { applyIntent, checkLook, climateOf, parseIntent, rankFor, slotOf, styleLook, topPicks, weatherAdvice, weatherFit, type LookCheck, type Outfit, type Slot } from './stylist';
import type { Moment, Product, ShopsFor } from './types';

export interface StylistContext {
  name?: string;
  shopsFor: ShopsFor;
  moments: Moment[];
  products: Product[];
  owned: Set<string>;
  saved: Set<string>;
  brands: string[];
}

export interface StylistAnswer {
  reply: string;
  products: Product[];
  moment?: Moment;
  source: AiSource;
}

const dept = (s: ShopsFor) => (s === 'men' ? 'menswear' : 'womenswear');
const line = (p: Product, m?: Pick<Moment, 'weather'>) => {
  const fit = m?.weather ? ` | weather fit ${weatherFit(p, m.weather).score}/100` : '';
  return `${p.id} | ${p.brand} | ${p.name} | ${p.category} | ${money(p.price)} | ${p.colorName} | ${p.material ?? ''}${fit}`;
};
const momentLine = (m: Moment) => `${m.id} | ${m.title} | ${m.occasion} | ${shortDate(m.date)}${m.venue ? ` | ${m.venue}` : ''}${m.weather ? ` | ${m.weather.temperature}° ${m.weather.condition}` : ''}`;

/** Which of the user's moments a message is about, if any. */
function momentFor(text: string, moments: Moment[]) {
  const t = text.toLowerCase();
  return moments.find((m) => t.includes(m.title.toLowerCase()) || (m.venue && t.includes(m.venue.split(',')[0].toLowerCase())) || t.includes(m.occasion.toLowerCase()) && /my|the/.test(t));
}

/* ------------------------------------------------------------------------------------------------ */
/* Stylist chat                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

export async function askStylist(history: Turn[], ctx: StylistContext, signal?: AbortSignal): Promise<StylistAnswer> {
  const last = history[history.length - 1]?.content ?? '';
  const moment = momentFor(last, ctx.moments);
  const intent = parseIntent(last, ctx.brands);
  if (moment && !intent.weather) intent.weather = moment.weather;
  if (moment && !intent.occasion) intent.occasion = moment.occasion;

  // The engine's shortlist: what the model reasons over, and the fallback answer.
  let ranked = applyIntent(ctx.products, intent);
  // Nothing matches every detail: relax the free-text words first, then the specifics, never the budget.
  if (!ranked.length) ranked = applyIntent(ctx.products, { ...intent, words: [] });
  if (!ranked.length) ranked = applyIntent(ctx.products, { ...intent, words: [], kinds: [], colours: [] });
  if (!ranked.length && !intent.categories.length) ranked = rankFor(ctx.products, { occasion: intent.occasion ?? 'Casual', weather: intent.weather }, { strict: !!intent.weather }).filter((r) => !intent.maxPrice || r.p.price <= intent.maxPrice);
  const shortlist = ranked.slice(0, 45).map((r) => r.p);

  const source = await aiSource();
  if (source !== 'local') {
    const upcoming = ctx.moments.slice(0, 8).map(momentLine).join('\n') || 'none';
    const rules = `You are FORYA's personal stylist: warm, direct, British spelling, never gushing. The user shops ${dept(ctx.shopsFor)} only, so never suggest pieces from the other department.
Answer their latest message. Recommend real pieces ONLY from the CATALOGUE below (by id). Respect any budget, weather and occasion they mention. If they mention a destination or one of their moments, dress for that weather: in heat favour linen, cotton, silk and open shoes; in cold favour wool, cashmere, down and closed shoes; in rain favour water-repellent pieces and avoid suede.
Reply in at most 90 words, plain text, no markdown or lists. Then return JSON only, in exactly this shape:
{"reply": string, "productIds": string[] (3 to 8 ids from the catalogue, best first), "momentId": string | null (one of their moments if the message is about it)}

THEIR MOMENTS (id | title | occasion | date | place | forecast):
${upcoming}

CATALOGUE (id | brand | name | category | price | colour | material | weather fit):
${shortlist.map((p) => line(p, intent.weather ? { weather: intent.weather } : moment)).join('\n')}`;
    try {
      const turns: Turn[] = [{ role: 'user', content: rules }, { role: 'assistant', content: 'Understood. Send the message.' }, ...history.slice(-8)];
      const out = await askJson<{ reply: string; productIds?: string[]; momentId?: string | null }>(turns, { signal });
      const byId = new Map(ctx.products.map((p) => [p.id, p]));
      const products = (out.productIds ?? []).map((id) => byId.get(id)).filter(Boolean) as Product[];
      if (out.reply) return { reply: out.reply, products: products.slice(0, 8), moment: ctx.moments.find((m) => m.id === out.momentId) ?? moment, source };
    } catch (e) {
      if ((e as { code?: string }).code === 'cancelled') throw e;
      /* fall through to the engine */
    }
  }
  return { ...localAnswer(last, intent, ranked.map((r) => r.p), moment, ctx), source: 'local' };
}

function localAnswer(text: string, intent: ReturnType<typeof parseIntent>, ranked: Product[], moment: Moment | undefined, ctx: StylistContext) {
  const w = intent.weather;
  const wantsPacking = /pack|suitcase|capsule/i.test(text);
  let products: Product[];
  let reply: string;
  if ((wantsPacking || /dress me|style me|what (should|do) i wear|outfit|look for/i.test(text)) && (moment || intent.occasion)) {
    const target = moment ?? { title: intent.place ? `${intent.place}` : 'Your plan', occasion: intent.occasion!, weather: w };
    const outfit = styleLook(ctx.products, target, { shopsFor: ctx.shopsFor, owned: ctx.owned, saved: ctx.saved, maxPrice: intent.maxPrice });
    products = outfit.pieces;
    if (wantsPacking) {
      const extra = topPicks(ctx.products, target, 6, new Set(products.map((p) => p.id)));
      products = [...products, ...extra.map((r) => r.p)].slice(0, 8);
    }
    reply = `${w ? weatherAdvice(w, ctx.shopsFor) + ' ' : ''}${wantsPacking ? `A capsule for ${target.title} that mixes and matches:` : `Here's a full look for ${target.title}:`} ${products.slice(0, 3).map((p) => p.name.toLowerCase()).join(', ')} and more below.${products.some((p) => ctx.owned.has(p.id)) ? ' I worked in pieces you already own.' : ''}`;
  } else {
    products = ranked.slice(0, 8);
    const understood = intent.chips.length ? `Looking for ${intent.chips.join(', ').toLowerCase()}. ` : '';
    reply = products.length
      ? `${understood}${w ? weatherAdvice(w, ctx.shopsFor) + ' ' : ''}These are the strongest matches in ${dept(ctx.shopsFor)}${intent.maxPrice ? `, all under ${money(intent.maxPrice)}` : ''}.`
      : `${understood}Nothing in ${dept(ctx.shopsFor)} matches all of that. Try a higher budget or fewer details.`;
  }
  return { reply, products, moment };
}

/** Starter questions, written from the user's own week. */
export function suggestedPrompts(moments: Moment[], shopsFor: ShopsFor) {
  const out: string[] = [];
  const trip = moments.find((m) => m.occasion === 'Holiday' || /trip/i.test(m.title));
  const formal = moments.find((m) => m.occasion === 'Formal');
  const cold = moments.find((m) => (m.weather?.temperature ?? 99) <= 10);
  if (trip) out.push(`What should I pack for ${trip.title}?`);
  if (formal) out.push(`Dress me for the ${formal.title.toLowerCase()}`);
  if (cold) out.push(`Something warm for ${cold.venue?.split(',')[0] ?? cold.title} under £200`);
  out.push(shopsFor === 'men' ? 'Linen for a beach holiday under £150' : 'A summer wedding guest look under £300');
  return out.slice(0, 4);
}

/* ------------------------------------------------------------------------------------------------ */
/* Style it for me                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

export interface StyledLook extends Outfit {
  note: string;
  source: AiSource;
}

export async function styleForMe(moment: Moment, ctx: StylistContext, opts: { seed: number; keep?: Product[]; avoid?: Set<string>; signal?: AbortSignal }): Promise<StyledLook> {
  const local = styleLook(ctx.products, moment, { shopsFor: ctx.shopsFor, owned: ctx.owned, saved: ctx.saved, seed: opts.seed, keep: opts.keep, avoid: opts.avoid });
  const source = await aiSource();
  const fallback = { ...local, note: local.headline, source: 'local' as const };
  if (source === 'local') return fallback;

  // Give the model the best few per slot and let it compose.
  const slots: Slot[] = ['dress', 'top', 'bottom', 'tailoring', 'layer', 'outer', 'shoes', 'bag', 'accessory'];
  const ranked = rankFor(ctx.products, moment, { strict: true });
  const pool = slots.flatMap((s) => ranked.filter((r) => slotOf(r.p) === s).slice(0, s === 'dress' && ctx.shopsFor === 'men' ? 0 : 6).map((r) => r.p));
  const c = moment.weather ? climateOf(moment.weather) : undefined;
  const prompt = `You are FORYA's stylist. Build ONE complete ${dept(ctx.shopsFor)} outfit for this moment.
Moment: ${moment.title} (${moment.occasion})${moment.venue ? ` in ${moment.venue}` : ''}, ${shortDate(moment.date)}.${c ? ` Forecast: ${c.label}.` : ''}
Rules: either a dress, or a top and a bottom; always shoes; add an outer layer if it is below 15° or raining; add a bag and at most one accessory if they help. Dress for the weather (breathable fabrics in heat, warm ones in cold, nothing suede in rain) and pitch it for the occasion. Prefer pieces marked OWNED or SAVED when they work. Keep the palette calm unless the occasion is a party.${opts.keep?.length ? ` Keep these already on the canvas: ${opts.keep.map((p) => p.id).join(', ')}.` : ''}
Variation seed ${opts.seed}: if earlier seeds would give the obvious look, choose a different but equally good one.
PIECES (id | brand | name | category | price | colour | material | weather fit):
${pool.map((p) => line(p, moment) + (ctx.owned.has(p.id) ? ' | OWNED' : ctx.saved.has(p.id) ? ' | SAVED' : '')).join('\n')}
Return JSON only: {"ids": string[] (4 to 7 ids from the list), "note": string (two sentences, under 45 words, plain text, why this works for the day)}`;
  try {
    const out = await askJson<{ ids: string[]; note: string }>(prompt, { signal: opts.signal });
    const byId = new Map(ctx.products.map((p) => [p.id, p]));
    const pieces = [...(opts.keep ?? []), ...out.ids.map((id) => byId.get(id)).filter((p): p is Product => !!p)].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i);
    if (pieces.length >= 3 && pieces.some((p) => p.category === 'Shoes')) {
      const why: Record<string, string> = {};
      for (const p of pieces) why[p.id] = ctx.owned.has(p.id) ? `Already yours. ${weatherFit(p, moment.weather).reason}` : weatherFit(p, moment.weather).reason;
      return { pieces, why, headline: local.headline, note: out.note || local.headline, source };
    }
  } catch (e) {
    if ((e as { code?: string }).code === 'cancelled') throw e;
  }
  return fallback;
}

/* ------------------------------------------------------------------------------------------------ */
/* Look check                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

export function lookCheck(pieces: Product[], moment: Moment, ctx: StylistContext): LookCheck {
  return checkLook(pieces, moment, ctx.products, ctx.shopsFor);
}

/** A two-sentence stylist's note on a look, from Claude when available. */
export async function lookNote(pieces: Product[], moment: Moment, check: LookCheck, ctx: StylistContext, signal?: AbortSignal): Promise<{ note: string; source: AiSource }> {
  const local = () => {
    const bad = check.checks.filter((c) => !c.ok);
    return bad.length ? `${check.grade}. ${bad[0].detail}${check.swaps[0] ? ` Try the ${check.swaps[0].in.brand} ${check.swaps[0].in.name.toLowerCase()}.` : ''}` : `${check.grade}. ${moment.weather ? weatherAdvice(moment.weather, ctx.shopsFor).split('.')[0] + ', and this look has it covered.' : 'Nothing to change.'}`;
  };
  const source = await aiSource();
  if (source === 'local' || !pieces.length) return { note: local(), source: 'local' };
  const prompt = `You are FORYA's stylist giving quick, honest feedback on a ${dept(ctx.shopsFor)} look.
Moment: ${moment.title} (${moment.occasion})${moment.weather ? `, ${moment.weather.temperature}° and ${moment.weather.condition.toLowerCase()}` : ''}.
Look: ${pieces.map((p) => `${p.brand} ${p.name} (${p.colorName}, ${p.material ?? 'n/a'})`).join('; ')}.
Automatic checks: ${check.checks.map((c) => `${c.label}: ${c.ok ? 'ok' : c.detail}`).join(' | ')}.
Return JSON only: {"note": string} with two short sentences (under 40 words, plain text): what works, and the one change that would most improve it (or say it is ready).`;
  try {
    const out = await askJson<{ note: string }>(prompt, { signal, quick: true });
    if (out.note) return { note: out.note, source };
  } catch (e) {
    if ((e as { code?: string }).code === 'cancelled') throw e;
  }
  return { note: local(), source: 'local' };
}
