import type { Moment, Product, Weather, WeatherBand } from './types';

export const bandFor = (t: number): WeatherBand => (t >= 20 ? 'warm' : t >= 11 ? 'mild' : 'cold');

export const isWet = (condition: string) => /rain|shower|storm|drizzle/i.test(condition);

/** Does this piece make sense for that forecast? Pieces with no tags suit any weather. */
export function suits(p: Product, w?: Weather) {
  if (!w) return true;
  return !p.weather || p.weather.includes(bandFor(w.temperature));
}

export const BAND_LABEL: Record<WeatherBand, string> = { warm: 'Warm-weather pieces', mild: 'In-between pieces', cold: 'Cold-weather pieces' };

export function weatherLine(m: Moment) {
  if (!m.weather) return '';
  const place = m.venue?.split(',')[0];
  return `${m.weather.temperature}° · ${m.weather.condition}${place ? ` in ${place}` : ''}`;
}

/** WMO weather codes → plain English. */
export function describeCode(code: number) {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Light rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Thunderstorms';
}
