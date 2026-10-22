import type { LookStatus, Moment, Verdict } from './types';

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const gbpWhole = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });

/** £35.99, £895 — pence only when they matter. */
export const money = (n: number) => (Number.isInteger(n) || n >= 1000 ? gbpWhole.format(n) : gbp.format(n));

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export const dayName = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'long' });

export function daysUntil(iso: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - start.getTime()) / 86_400_000);
}

export function relativeDay(iso: string) {
  const n = daysUntil(iso);
  if (n < 0) return n === -1 ? 'Yesterday' : `${-n} days ago`;
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 7) return `This ${dayName(iso)}`;
  return `In ${n} days`;
}

/** Local YYYY-MM-DD for a date or ISO string, used to group and mark moments by day. */
export function dayKey(d: string | Date): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  const m = `${x.getMonth() + 1}`.padStart(2, '0');
  const day = `${x.getDate()}`.padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

/** A countdown split for display: one big number or word, and its unit underneath. */
export function countdown(iso: string): { value: string; unit: string } {
  const n = daysUntil(iso);
  if (n < 0) return { value: `${-n}`, unit: -n === 1 ? 'day ago' : 'days ago' };
  if (n === 0) return { value: 'Today', unit: '' };
  if (n === 1) return { value: 'Tomorrow', unit: '' };
  return { value: `${n}`, unit: 'days away' };
}

export const STATUS_LABEL: Record<LookStatus, string> = {
  draft: 'No look yet',
  'in-progress': 'Look in progress',
  ready: 'Look ready',
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  good: 'Good price',
  typical: 'Typical price',
  high: 'Priced high',
};

/** "Wedding, Saturday." — the house style for naming a moment. */
export const momentHeadline = (m: Moment) => {
  const n = daysUntil(m.date);
  if (n >= 0 && n < 7) return `${m.title}, ${dayName(m.date)}.`;
  return `${m.title}.`;
};

export function greeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
  return name ? `${part}, ${name.split(' ')[0]}.` : `${part}.`;
}

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
