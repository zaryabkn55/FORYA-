/** Shapes the API returns. They match frontend/src/lib/types.ts exactly. */
import { proxiedImage } from '../services/imageUrl';

const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export const TIER_OUT = (t: string) => title(t) as 'Affordable' | 'Attainable' | 'Aspirational';

export const OCCASIONS = ['FORMAL', 'WORK', 'DINNER', 'PARTY', 'HOLIDAY', 'CASUAL'] as const;
export type DbOccasion = (typeof OCCASIONS)[number];
export const occasionIn = (o?: string): DbOccasion => {
  const up = String(o ?? '').toUpperCase();
  return (OCCASIONS as readonly string[]).includes(up) ? (up as DbOccasion) : 'CASUAL';
};

const STATUS_OUT: Record<string, string> = { DRAFT: 'draft', IN_PROGRESS: 'in-progress', READY: 'ready' };
export const statusIn = (s?: string) => (s === 'ready' ? 'READY' : s === 'in-progress' ? 'IN_PROGRESS' : 'DRAFT') as 'READY' | 'IN_PROGRESS' | 'DRAFT';

export function toProduct(p: any) {
  return {
    id: p.id,
    sku: p.sku,
    brand: p.brand,
    name: p.name,
    category: p.category,
    tier: TIER_OUT(p.tier),
    price: p.numericPrice,
    colorName: p.colorName ?? p.color,
    material: p.material ?? undefined,
    description: p.description ?? undefined,
    imageUrl: proxiedImage(p.imageUrl),
    sourceUrl: p.sourceUrl ?? undefined,
    isNew: p.isNew,
    weather: p.weather?.length ? p.weather : undefined,
    rainReady: p.rainReady || undefined,
    store: p.isStore || undefined,
    gender: p.gender ?? 'women',
  };
}

export function toMoment(m: any) {
  return {
    id: m.id,
    title: m.title,
    occasion: title(m.occasion),
    date: m.date.toISOString(),
    venue: m.venue ?? undefined,
    notes: m.notes ?? m.subtitle ?? undefined,
    source: m.source === 'CALENDAR' ? 'calendar' : 'user',
    weather: m.weatherTemp != null ? { temperature: m.weatherTemp, condition: m.weatherDesc ?? '' } : undefined,
    look: {
      status: STATUS_OUT[m.look?.status ?? 'DRAFT'],
      updatedAt: m.look?.updatedAt?.toISOString(),
      pieces: (m.look?.pieces ?? []).map((pc: any) => ({ id: pc.id, productId: pc.productId, x: pc.x, y: pc.y, w: pc.w, z: pc.z })),
    },
  };
}

export const momentInclude = { look: { include: { pieces: true } } } as const;

/** The user object the web app expects. */
export function toUser(u: any) {
  return { id: u.id, name: u.fullName, email: u.email, country: u.country, countryCode: u.countryCode, phone: u.phone ?? undefined, shopsFor: u.shopsFor ?? undefined };
}
