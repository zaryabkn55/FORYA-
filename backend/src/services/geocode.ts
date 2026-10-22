/**
 * Turning what someone types into coordinates.
 *
 * People write a place three different ways, and no single free geocoder handles all of them:
 *
 *   "SW1A 1AA"                 a postcode        → postcodes.io  (UK, authoritative, fast)
 *   "Bath"                     a town or city    → Open-Meteo    (clean structured results)
 *   "Babington House, Somerset" a venue          → Nominatim     (knows named places)
 *
 * So we try them in that order and stop at the first hit. Open-Meteo's geocoder — which is all
 * the app used before — returns nothing at all for a postcode, which is why a moment at
 * "SW1A 1AA" never got a forecast.
 *
 * All of this runs server-side. The browser calls our own origin, which keeps the
 * content-security-policy tight (`connect-src 'self'`) and keeps third-party usage behind one
 * cache we control rather than one request per keystroke per visitor.
 */

const UA = 'FORYA/1.0 (+https://forya.onrender.com)';
const TIMEOUT_MS = 6_000;

export type Place = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  kind: 'postcode' | 'city' | 'place';
};

/* ── cache ────────────────────────────────────────────────────────────────────
   Geocoding answers don't move. A day of caching turns a busy autocomplete into
   a handful of upstream calls, and keeps us well inside Nominatim's usage policy. */
const DAY_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: Place[] }>();
const MAX_CACHE = 2_000;

function cached(key: string): Place[] | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > DAY_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function remember(key: string, value: Place[]): void {
  if (cache.size >= MAX_CACHE) {
    // Cheap eviction: drop the oldest insertion. Map preserves insertion order.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), value });
}

/* ── polite outbound ──────────────────────────────────────────────────────── */

async function getJson(url: string): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: controller.signal, headers: { 'user-agent': UA, accept: 'application/json' } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null; // a geocoder being slow or down is not an error worth surfacing
  } finally {
    clearTimeout(timer);
  }
}

/** Nominatim asks for no more than one request a second. Serialise and space them out. */
let nominatimChain: Promise<unknown> = Promise.resolve();
function nominatim(url: string): Promise<unknown | null> {
  const run = nominatimChain.then(async () => {
    const out = await getJson(url);
    await new Promise((r) => setTimeout(r, 1_100));
    return out;
  });
  nominatimChain = run.catch(() => undefined);
  return run as Promise<unknown | null>;
}

/* ── UK postcodes ─────────────────────────────────────────────────────────── */

/** Full UK postcode, with or without the inner space. Deliberately strict: a loose pattern
 *  sends ordinary words like "Bath" down the postcode path, where they find nothing. */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
/** The outward half on its own ("SW1A", "M1") — enough to place someone on a map. */
const UK_OUTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

export const looksLikeUkPostcode = (q: string) => UK_POSTCODE.test(q.trim());

type PostcodeResult = { postcode?: string; latitude?: number; longitude?: number; admin_district?: string; country?: string };
type OutcodeResult = { outcode?: string; latitude?: number; longitude?: number; admin_district?: string[] };

async function fromPostcodesIo(q: string): Promise<Place[]> {
  const clean = q.trim().toUpperCase().replace(/\s+/g, '');

  if (UK_POSTCODE.test(q.trim())) {
    const data = (await getJson(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`)) as
      | { status?: number; result?: PostcodeResult }
      | null;
    const r = data?.result;
    if (r?.latitude != null && r?.longitude != null) {
      return [
        {
          name: r.postcode ?? q.trim().toUpperCase(),
          latitude: r.latitude,
          longitude: r.longitude,
          admin1: r.admin_district,
          country: r.country ?? 'United Kingdom',
          kind: 'postcode',
        },
      ];
    }
    return [];
  }

  if (UK_OUTCODE.test(q.trim())) {
    const data = (await getJson(`https://api.postcodes.io/outcodes/${encodeURIComponent(clean)}`)) as
      | { status?: number; result?: OutcodeResult }
      | null;
    const r = data?.result;
    if (r?.latitude != null && r?.longitude != null) {
      return [
        {
          name: r.outcode ?? clean,
          latitude: r.latitude,
          longitude: r.longitude,
          admin1: r.admin_district?.[0],
          country: 'United Kingdom',
          kind: 'postcode',
        },
      ];
    }
  }
  return [];
}

/* ── cities ───────────────────────────────────────────────────────────────── */

type MeteoCity = { name: string; latitude: number; longitude: number; country?: string; admin1?: string };

async function fromOpenMeteo(q: string, count: number): Promise<Place[]> {
  const data = (await getJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=${count}&language=en&format=json`,
  )) as { results?: MeteoCity[] } | null;
  return (data?.results ?? [])
    .filter((c) => typeof c.latitude === 'number' && typeof c.longitude === 'number')
    .map((c) => ({ name: c.name, latitude: c.latitude, longitude: c.longitude, country: c.country, admin1: c.admin1, kind: 'city' as const }));
}

/* ── anything else: venues, landmarks, non-UK postcodes ───────────────────── */

type NominatimResult = { display_name?: string; name?: string; lat?: string; lon?: string; address?: Record<string, string> };

async function fromNominatim(q: string, count: number): Promise<Place[]> {
  const data = (await nominatim(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=${count}&addressdetails=1`,
  )) as NominatimResult[] | null;
  if (!Array.isArray(data)) return [];
  return data
    .map((r): Place | null => {
      const lat = Number(r.lat);
      const lon = Number(r.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      const a = r.address ?? {};
      const label = r.name?.trim() || r.display_name?.split(',')[0]?.trim() || q;
      return {
        name: label,
        latitude: lat,
        longitude: lon,
        admin1: a.county || a.state || a.city,
        country: a.country,
        kind: 'place',
      };
    })
    .filter((p): p is Place => p !== null);
}

/* ── the cascade ──────────────────────────────────────────────────────────── */

/**
 * Suggestions for the venue field, best match first.
 * Returns [] rather than throwing: no forecast is a degraded moment, not a broken one.
 */
export async function searchPlaces(query: string, count = 5): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const key = `s:${count}:${q.toLowerCase()}`;
  const hit = cached(key);
  if (hit) return hit;

  let places = await fromPostcodesIo(q);
  if (!places.length) places = await fromOpenMeteo(q, count);
  // A venue like "Babington House" is not a city, so fall through to the place index.
  if (!places.length) places = await fromNominatim(q, count);

  remember(key, places);
  return places;
}

/** The single best match for a typed place, or null. */
export async function resolvePlace(query: string): Promise<Place | null> {
  const places = await searchPlaces(query, 1);
  return places[0] ?? null;
}
