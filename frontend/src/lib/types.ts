export type Tier = 'Affordable' | 'Attainable' | 'Aspirational';

export type Category =
  | 'Tops'
  | 'Knitwear'
  | 'Tailoring'
  | 'Bottoms'
  | 'Dresses'
  | 'Outerwear'
  | 'Shoes'
  | 'Bags'
  | 'Accessories';

export const CATEGORIES: Category[] = ['Tops', 'Knitwear', 'Tailoring', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Bags', 'Accessories'];

/** Temperature bands a piece is suited to. warm ≥ 20°, mild 11–19°, cold ≤ 10°. */
export type WeatherBand = 'warm' | 'mild' | 'cold';

/** Who a piece is cut for. Missing means womenswear (the original catalogue). */
export type Gender = 'women' | 'men' | 'unisex';

/** Which department an account shops. */
export type ShopsFor = 'women' | 'men';

export const SHOPS_FOR_LABEL: Record<ShopsFor, string> = { women: 'Womenswear', men: 'Menswear' };

export interface Product {
  id: string;
  sku: string;
  brand: string;
  name: string;
  category: Category;
  tier: Tier;
  price: number; // GBP
  colorName: string;
  material?: string;
  description?: string;
  imageUrl: string;
  sourceUrl?: string;
  isNew?: boolean;
  /** Bands this piece suits. Missing means any weather. */
  weather?: WeatherBand[];
  /** Holds up in rain. */
  rainReady?: boolean;
  /** Sold by a multi-brand store rather than the label itself. */
  store?: boolean;
  /** Womenswear, menswear or both. Missing means womenswear. */
  gender?: Gender;
}

export type OfferKind = 'retail' | 'resale';

export interface Offer {
  retailer: string;
  kind: OfferKind;
  condition: string; // "New", "Pre-owned · Very good"
  price: number;
  delivery: string;
  url?: string;
}

export type Verdict = 'good' | 'typical' | 'high';

export interface PriceCheck {
  productId: string;
  verdict: Verdict;
  typicalLow: number;
  typicalHigh: number;
  best: Offer;
  offers: Offer[];
  /** True while prices come from the demo model rather than live retailer feeds. */
  illustrative: boolean;
}

/** A piece placed on a look canvas. Positions are percentages of the canvas so looks scale to any screen. */
export interface Piece {
  id: string;
  productId: string;
  x: number; // centre, % of canvas width
  y: number; // centre, % of canvas height
  w: number; // width, % of canvas width
  z: number;
}

export type LookStatus = 'draft' | 'in-progress' | 'ready';

export interface Look {
  status: LookStatus;
  pieces: Piece[];
  updatedAt?: string;
}

export type Occasion = 'Formal' | 'Work' | 'Dinner' | 'Party' | 'Holiday' | 'Casual';

export const OCCASIONS: Occasion[] = ['Formal', 'Work', 'Dinner', 'Party', 'Holiday', 'Casual'];

export interface Weather {
  temperature: number;
  condition: string;
  /** Optional extras from the forecast, used by the stylist engine when present. */
  feelsLike?: number;
  windKph?: number;
  rainChance?: number;
}

export interface Moment {
  id: string;
  title: string;
  occasion: Occasion;
  date: string; // ISO
  venue?: string;
  notes?: string;
  source: 'calendar' | 'user';
  weather?: Weather;
  look: Look;
}

export type WardrobeKind = 'saved' | 'owned';

export interface WardrobeEntry {
  productId: string;
  kind: WardrobeKind;
  addedAt: string;
  timesWorn?: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  note: string;
  image: string;
  momentId?: string;
  productIds: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  country?: string;
  /** The department this account sees: only womenswear or only menswear (plus unisex pieces). */
  shopsFor?: ShopsFor;
}

export interface NewMoment {
  title: string;
  occasion: Occasion;
  date: string;
  venue?: string;
  notes?: string;
  weather?: Weather;
}
