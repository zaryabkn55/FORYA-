/**
 * Illustrative price model, identical to the frontend's demo version so both modes agree.
 * Swap `priceCheck` for a real comparison feed (retailer + resale APIs) when one is connected.
 */
type Tier = 'Affordable' | 'Attainable' | 'Aspirational';

export interface Offer {
  retailer: string;
  kind: 'retail' | 'resale';
  condition: string;
  price: number;
  delivery: string;
  url?: string;
}

const RETAILERS: Record<Tier, { retail: string[]; resale: string[] }> = {
  Affordable: { retail: ['ASOS', 'John Lewis', 'Next'], resale: ['Vinted', 'Depop'] },
  Attainable: { retail: ['Selfridges', 'John Lewis', 'Harvey Nichols'], resale: ['Vestiaire Collective', 'Vinted'] },
  Aspirational: { retail: ['Mytheresa', 'Harrods', 'Selfridges'], resale: ['Vestiaire Collective', 'The RealReal'] },
};

function seeded(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const round = (n: number) => (n >= 200 ? Math.round(n) : Math.round(n * 100) / 100);

export function priceCheck(p: { id: string; brand: string; tier: Tier; price: number; sourceUrl?: string }) {
  const rnd = seeded(p.id);
  const r = RETAILERS[p.tier] ?? RETAILERS.Affordable;
  const offers: Offer[] = [
    { retailer: p.brand, kind: 'retail', condition: 'New', price: p.price, delivery: p.tier === 'Affordable' ? 'Free over £50' : 'Free delivery', url: p.sourceUrl },
    ...r.retail.filter((x) => x !== p.brand).slice(0, 2).map((retailer) => ({ retailer, kind: 'retail' as const, condition: 'New', price: round(p.price * (0.86 + rnd() * 0.22)), delivery: rnd() > 0.5 ? 'Free delivery' : '£4.95 delivery' })),
    ...r.resale.map((retailer, i) => ({ retailer, kind: 'resale' as const, condition: i === 0 ? 'Pre-owned · Very good' : 'Pre-owned · Good', price: round(p.price * (0.38 + rnd() * 0.24)), delivery: 'Ships in 2–4 days' })),
  ];
  offers.sort((a, b) => a.price - b.price);
  const typical = p.price * (0.84 + rnd() * 0.36);
  const typicalLow = round(typical * 0.94);
  const typicalHigh = round(typical * 1.06);
  const verdict = p.price < typicalLow ? 'good' : p.price > typicalHigh ? 'high' : 'typical';
  return { productId: p.id, verdict, typicalLow, typicalHigh, best: offers[0], offers, illustrative: true };
}
