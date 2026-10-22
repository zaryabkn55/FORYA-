/**
 * GET /api/weather/search?q=…      → place suggestions for the venue field
 * GET /api/weather?place=…&date=…  → that place's coordinates and the forecast for that day
 *
 * The browser used to call Open-Meteo directly. That broke twice over: the content-security
 * policy added during hardening blocks cross-origin requests (`connect-src 'self'`), and
 * Open-Meteo's geocoder returns nothing for a postcode, so "SW1A 1AA" never resolved. Doing it
 * here fixes both, and means one shared cache instead of one upstream call per keystroke per
 * visitor.
 *
 * Three horizons, because "what will it be like?" means different things at different distances:
 *   within 16 days  the actual forecast for that day
 *   further out     the typical weather for that week of the year, from the archive
 *   in the past     what it is there now, which is the best answer to a question about today
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { resolvePlace, searchPlaces, type Place } from '../services/geocode';

const router = Router();

const TIMEOUT_MS = 8_000;

export type Weather = {
  temperature: number;
  condition: string;
  feelsLike?: number;
  rainChance?: number;
  windKph?: number;
};

/** WMO weather codes → plain English. Mirrors frontend/src/lib/weather.ts. */
export function describeCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Light rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Thunderstorms';
}

async function getJson(url: string): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const shiftDate = (day: string, years: number, days = 0) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export type Horizon = 'day' | 'season' | 'now';

export function horizonFor(day: string): { mode: Horizon; daysAhead: number } {
  const target = new Date(`${day}T12:00:00Z`).getTime();
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00Z`).getTime();
  const daysAhead = Math.round((target - today) / 86_400_000);
  const mode: Horizon = daysAhead >= 0 && daysAhead <= 15 ? 'day' : daysAhead > 15 ? 'season' : 'now';
  return { mode, daysAhead };
}

export async function forecastFor(lat: number, lon: number, day: string): Promise<{ weather: Weather; mode: Horizon } | null> {
  const { mode, daysAhead } = horizonFor(day);
  const at = `latitude=${lat}&longitude=${lon}&timezone=auto`;

  if (mode === 'season') {
    // The same week, previous years — so a July trip booked in October is dressed for July.
    const yearsBack = Math.max(1, Math.ceil(daysAhead / 365));
    const data = await getJson(
      `https://archive-api.open-meteo.com/v1/archive?${at}&daily=temperature_2m_max,weather_code,precipitation_sum` +
        `&start_date=${shiftDate(day, yearsBack, -3)}&end_date=${shiftDate(day, yearsBack, 3)}`,
    );
    const temps: number[] = (data?.daily?.temperature_2m_max ?? []).filter((n: unknown) => typeof n === 'number');
    if (!temps.length) return null;
    const rain: number[] = data?.daily?.precipitation_sum ?? [];
    const codes: number[] = data?.daily?.weather_code ?? [];
    const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    const wetDays = rain.filter((r) => typeof r === 'number' && r >= 1).length;
    const typical = codes.slice().sort((a, b) => codes.filter((c) => c === b).length - codes.filter((c) => c === a).length)[0] ?? 0;
    return {
      mode,
      weather: {
        temperature: Math.round(avg),
        condition: wetDays >= 4 ? 'Showers' : describeCode(typical),
        rainChance: Math.round((wetDays / Math.max(1, rain.length)) * 100),
      },
    };
  }

  if (mode === 'day') {
    const data = await getJson(
      `https://api.open-meteo.com/v1/forecast?${at}&daily=temperature_2m_max,apparent_temperature_max,weather_code,` +
        `precipitation_probability_max,wind_speed_10m_max&start_date=${day}&end_date=${day}`,
    );
    const d = data?.daily;
    const t = d?.temperature_2m_max?.[0];
    if (typeof t !== 'number') return null;
    return {
      mode,
      weather: {
        temperature: Math.round(t),
        condition: describeCode(d?.weather_code?.[0] ?? 0),
        ...(typeof d?.apparent_temperature_max?.[0] === 'number' ? { feelsLike: Math.round(d.apparent_temperature_max[0]) } : {}),
        ...(typeof d?.precipitation_probability_max?.[0] === 'number' ? { rainChance: d.precipitation_probability_max[0] } : {}),
        ...(typeof d?.wind_speed_10m_max?.[0] === 'number' ? { windKph: Math.round(d.wind_speed_10m_max[0]) } : {}),
      },
    };
  }

  const data = await getJson(`https://api.open-meteo.com/v1/forecast?${at}&current=temperature_2m,weather_code`);
  const t = data?.current?.temperature_2m;
  if (typeof t !== 'number') return null;
  return { mode, weather: { temperature: Math.round(t), condition: describeCode(data?.current?.weather_code ?? 0) } };
}

const label = (p: Place) => [p.name, p.admin1, p.country].filter(Boolean).join(', ');

/* ── routes ───────────────────────────────────────────────────────────────── */

const SearchQuery = z.object({ q: z.string().min(2).max(120) });

router.get('/search', async (req: Request, res: Response) => {
  const parsed = SearchQuery.safeParse(req.query);
  if (!parsed.success) return res.json({ results: [] });
  const places = await searchPlaces(parsed.data.q, 5);
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ results: places.map((p) => ({ ...p, label: label(p) })) });
});

const WeatherQuery = z.object({
  place: z.string().min(1).max(200).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const parsed = WeatherQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Tell us a place or a pair of coordinates.' });
  const { place, lat, lon } = parsed.data;
  const day = parsed.data.date ?? new Date().toISOString().slice(0, 10);

  let resolved: Place | null = null;
  if (typeof lat === 'number' && typeof lon === 'number') {
    resolved = { name: place ?? 'There', latitude: lat, longitude: lon, kind: 'place' };
  } else if (place) {
    resolved = await resolvePlace(place);
  }

  if (!resolved) {
    // 200, not 404: the moment is still perfectly valid without a forecast, and the client
    // falls back to asking the user what to expect.
    return res.json({ found: false, weather: null });
  }

  const forecast = await forecastFor(resolved.latitude, resolved.longitude, day);
  if (!forecast) return res.json({ found: true, place: { ...resolved, label: label(resolved) }, weather: null });

  res.set('Cache-Control', 'public, max-age=900');
  res.json({
    found: true,
    place: { ...resolved, label: label(resolved) },
    mode: forecast.mode,
    weather: forecast.weather,
  });
});

export default router;
