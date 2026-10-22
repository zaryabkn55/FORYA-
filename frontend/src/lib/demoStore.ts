/**
 * Demo backend: a localStorage-backed stand-in for the API, used automatically when the server is
 * unreachable (for example `npm run dev` without Postgres). Every feature works end to end in demo
 * mode; data lives in this browser only. Reset it with `localStorage.removeItem('forya.demo.v3')`.
 */
import { CATALOGUE, priceCheckFor, productById } from './catalogue';
import { img } from './imagery';
import { buildLook } from './layout';
import { uid } from './format';
import { getToken } from './session';
import type { JournalEntry, Look, Moment, NewMoment, PriceCheck, Product, ShopsFor, User, WardrobeEntry, WardrobeKind } from './types';

const KEY = 'forya.demo.v5';

interface UserData {
  moments: Moment[];
  wardrobe: WardrobeEntry[];
  journal: JournalEntry[];
  synced: boolean;
}

interface DemoState {
  users: (User & { password: string })[];
  /** Each account's own moments, wardrobe and journal. */
  data: Record<string, UserData>;
}

const DEMO_USER = { id: 'u-demo', name: 'Celine', email: 'demo@forya.com', password: 'forya-demo-2026', shopsFor: 'women' as const };
const DEMO_MAN = { id: 'u-demo-men', name: 'James', email: 'james@forya.com', password: 'forya-demo-2026', shopsFor: 'men' as const };
const empty = (): UserData => ({ moments: [], wardrobe: [], journal: [], synced: false });

const daysFromNow = (n: number, hour = 18) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const pick = (...ids: string[]) => ids.map((id) => productById(id)!).filter(Boolean);
const look = (status: Look['status'], ...ids: string[]): Look => ({ status, pieces: buildLook(pick(...ids)), updatedAt: new Date().toISOString() });

function seed(): DemoState {
  return { users: [DEMO_USER, DEMO_MAN], data: { [DEMO_USER.id]: demoData(), [DEMO_MAN.id]: demoMenData() } };
}

/** The menswear demo account: same kind of week, dressed from the menswear catalogue. */
function demoMenData(): UserData {
  const now = new Date().toISOString();
  return {
    synced: false,
    moments: [
      { id: 'mm-wedding', title: 'Wedding', occasion: 'Formal', date: daysFromNow(3, 14), venue: 'Babington House, Somerset', source: 'calendar', weather: { temperature: 19, condition: 'Partly cloudy' }, look: look('in-progress', 'pm-reiss-mgreysuit', 'pm-mango-oxfordshirt', 'pm-reiss-msuittrousers', 'pm-next-derbyshoes') },
      { id: 'mm-interview', title: 'Interview', occasion: 'Work', date: daysFromNow(5, 10), venue: "King's Cross, London", source: 'calendar', weather: { temperature: 14, condition: 'Overcast' }, look: look('draft') },
      { id: 'mm-dinner', title: 'Dinner in Mayfair', occasion: 'Dinner', date: daysFromNow(9, 20), venue: 'Mount Street, London', source: 'user', weather: { temperature: 11, condition: 'Light rain' }, look: look('in-progress', 'pm-theory-navyblazer', 'pm-uniqlo-merinocrew', 'pm-7-for-all-mankind-darkjeans') },
      { id: 'mm-lisbon', title: 'Lisbon trip', occasion: 'Holiday', date: daysFromNow(18, 9), venue: 'Lisbon, Portugal', source: 'user', weather: { temperature: 26, condition: 'Clear sky' }, look: look('ready', 'pm-zara-mcampshirt', 'pm-zara-mlinendrawstring', 'pm-massimo-dutti-drivingshoes', 'pm-gucci-msunglasses') },
      { id: 'mm-edinburgh', title: 'Work trip to Edinburgh', occasion: 'Work', date: daysFromNow(14, 8), venue: 'Edinburgh, Scotland', source: 'calendar', weather: { temperature: 8, condition: 'Light rain' }, look: look('in-progress', 'pm-next-movercoat', 'pm-uniqlo-merinocrew', 'pm-reiss-msuittrousers', 'pm-zadig-and-voltaire-chelseaboots') },
      { id: 'mm-gallery', title: 'Gallery private view', occasion: 'Party', date: daysFromNow(24, 19), venue: 'Bankside, London', source: 'calendar', weather: { temperature: 6, condition: 'Clear sky' }, look: look('draft') },
    ],
    wardrobe: [
      { productId: 'p-leather-belt', kind: 'owned', addedAt: now, timesWorn: 22 },
      { productId: 'p-trainers', kind: 'owned', addedAt: now, timesWorn: 40 },
      { productId: 'pm-next-derbyshoes', kind: 'owned', addedAt: now, timesWorn: 9 },
      { productId: 'pm-uniqlo-merinocrew', kind: 'owned', addedAt: now, timesWorn: 12 },
      { productId: 'pm-massimo-dutti-msuedebomber', kind: 'saved', addedAt: now },
      { productId: 'pm-boss-movercoat', kind: 'saved', addedAt: now },
      { productId: 'pm-loro-piana-suedeloafers', kind: 'saved', addedAt: now },
      { productId: 'pm-club-monaco-mlinenblazer', kind: 'saved', addedAt: now },
    ],
    journal: [
      { id: 'jm-1', title: 'Linen Sunday', date: daysFromNow(-6, 12), note: 'Camp collar, drawstring linen, drivers. Done in two minutes.', image: img('cafeWeekend'), productIds: ['pm-zara-mcampshirt', 'pm-zara-mlinendrawstring'] },
      { id: 'jm-2', title: 'Weekend basics', date: daysFromNow(-12, 12), note: 'White trainers on repeat. Forty wears and counting.', image: img('staples'), productIds: ['p-trainers'] },
    ],
  };
}

/** The demo account's pre-planned moments, wardrobe and journal. */
function demoData(): UserData {
  const now = new Date().toISOString();
  return {
    synced: false,
    moments: [
      { id: 'm-wedding', title: 'Wedding', occasion: 'Formal', date: daysFromNow(3, 14), venue: 'Babington House, Somerset', source: 'calendar', weather: { temperature: 19, condition: 'Partly cloudy' }, look: look('in-progress', 'p-linen-shirt', 'p-linen-blazer', 'p-linen-trousers', 'p-leather-belt', 'p-suede-loafers') },
      { id: 'm-interview', title: 'Interview', occasion: 'Work', date: daysFromNow(5, 10), venue: "King's Cross, London", source: 'calendar', weather: { temperature: 14, condition: 'Overcast' }, look: look('draft') },
      { id: 'm-dinner', title: 'Dinner in Mayfair', occasion: 'Dinner', date: daysFromNow(9, 20), venue: 'Mount Street, London', source: 'user', weather: { temperature: 11, condition: 'Light rain' }, look: look('in-progress', 'p-silk-shirt', 'p-navy-blazer', 'p-wool-trousers') },
      { id: 'm-lisbon', title: 'Lisbon trip', occasion: 'Holiday', date: daysFromNow(18, 9), venue: 'Lisbon, Portugal', source: 'user', weather: { temperature: 26, condition: 'Clear sky' }, look: look('ready', 'p-linen-shirt', 'p-linen-trousers', 'p-leather-tote', 'p-trainers') },
      { id: 'm-edinburgh', title: 'Work trip to Edinburgh', occasion: 'Work', date: daysFromNow(14, 8), venue: 'Edinburgh, Scotland', source: 'calendar', weather: { temperature: 8, condition: 'Light rain' }, look: look('in-progress', 'p-uniqlo-merino', 'p-wool-trousers', 'p-allsaints-chelsea', 'p-hm-coat') },
      { id: 'm-gallery', title: 'Gallery private view', occasion: 'Party', date: daysFromNow(24, 19), venue: 'Bankside, London', source: 'calendar', weather: { temperature: 6, condition: 'Clear sky' }, look: look('draft') },
    ],
    wardrobe: [
      { productId: 'p-leather-belt', kind: 'owned', addedAt: now, timesWorn: 14 },
      { productId: 'p-trainers', kind: 'owned', addedAt: now, timesWorn: 31 },
      { productId: 'p-wool-trousers', kind: 'owned', addedAt: now, timesWorn: 6 },
      { productId: 'p-suede-loafers', kind: 'saved', addedAt: now },
      { productId: 'p-asos-trench', kind: 'saved', addedAt: now },
      { productId: 'p-md-cashmere', kind: 'saved', addedAt: now },
      { productId: 'p-maje-dress', kind: 'saved', addedAt: now },
      { productId: 'p-fendi-bag', kind: 'saved', addedAt: now },
    ],
    journal: [
      { id: 'j-1', title: 'Cold start', date: daysFromNow(-6, 12), note: 'Oversized navy over a plain tee. The boots did the rest.', image: img('edJournalThree'), productIds: ['p-navy-blazer', 'p-uniqlo-tee', 'p-fendi-boots'] },
      { id: 'j-2', title: 'Frieze, Saturday', date: daysFromNow(-11, 12), note: 'White denim, black everything else. Carried the whole fair in that bag.', image: img('edHero'), productIds: ['p-7fam-white', 'px-bottega-veneta-women-blacktote'] },
      { id: 'j-3', title: 'Sunday errands', date: daysFromNow(-38, 12), note: 'Cardigan, pleated check, brown loafers. Took two minutes.', image: img('edJournalOne'), productIds: ['p-suede-loafers'] },
    ],
  };
}

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    /* fall through to a fresh seed */
  }
  const s = seed();
  save(s);
  return s;
}

function save(s: DemoState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

let state: DemoState | null = null;
const db = () => (state ??= load());

/** The signed-in account's data (from the demo token "demo.<userId>"). */
function me(): UserData {
  const id = getToken()?.replace(/^demo\./, '') ?? '';
  const d = db().data;
  return (d[id] ??= empty());
}
const commit = () => save(db());
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const byDate = (a: Moment, b: Moment) => +new Date(a.date) - +new Date(b.date);

export const demo = {
  async login(email: string, password: string) {
    const u = db().users.find((x) => x.email === email.toLowerCase());
    if (u && u.password !== password) throw new Error('That password doesn’t match this email.');
    // Demo mode: an unknown email simply gets a fresh, empty account.
    const user = u ?? { id: uid('u'), name: nameFromEmail(email), email: email.toLowerCase(), password };
    if (!u) {
      db().users.push(user);
      commit();
    }
    return wait({ token: `demo.${user.id}`, user: strip(user) });
  },
  async register(input: { name: string; email: string; password: string; country?: string; shopsFor?: ShopsFor }) {
    if (db().users.some((x) => x.email === input.email.toLowerCase())) throw new Error('An account with this email already exists.');
    const user = { id: uid('u'), name: input.name, email: input.email.toLowerCase(), password: input.password, country: input.country, shopsFor: input.shopsFor };
    db().users.push(user);
    commit();
    return wait({ token: `demo.${user.id}`, user: strip(user) });
  },
  async oauth(provider: 'google' | 'apple') {
    const email = `celine@${provider}.example`;
    const user = db().users.find((x) => x.email === email) ?? { id: uid('u'), name: 'Celine', email, password: '' };
    if (!db().users.includes(user)) {
      db().users.push(user);
      commit();
    }
    return wait({ token: `demo.${user.id}`, user: strip(user) });
  },

  async updateProfile(patch: Partial<Pick<User, 'name' | 'country' | 'shopsFor'>>): Promise<User> {
    const id = getToken()?.replace(/^demo\./, '') ?? '';
    const u = db().users.find((x) => x.id === id);
    if (!u) throw new Error('Please sign in again.');
    Object.assign(u, patch);
    commit();
    return wait(strip(u));
  },

  async products(): Promise<Product[]> {
    return wait(clone(CATALOGUE));
  },
  async priceCheck(id: string): Promise<PriceCheck> {
    const p = productById(id);
    if (!p) throw new Error('Product not found.');
    return wait(priceCheckFor(p));
  },

  async moments(): Promise<Moment[]> {
    return wait(clone(me().moments).sort(byDate));
  },
  async moment(id: string): Promise<Moment> {
    const m = me().moments.find((x) => x.id === id);
    if (!m) throw new Error('This moment no longer exists.');
    return wait(clone(m));
  },
  async addMoment(input: NewMoment): Promise<Moment> {
    const m: Moment = { id: uid('m'), source: 'user', ...input, look: { status: 'draft', pieces: [] } };
    me().moments.push(m);
    commit();
    return wait(clone(m));
  },
  async deleteMoment(id: string) {
    me().moments = me().moments.filter((m) => m.id !== id);
    commit();
    return wait(undefined);
  },
  async saveLook(id: string, next: Look): Promise<Moment> {
    const m = me().moments.find((x) => x.id === id);
    if (!m) throw new Error('This moment no longer exists.');
    m.look = { ...next, updatedAt: new Date().toISOString() };
    commit();
    return wait(clone(m));
  },
  async syncCalendar(): Promise<{ added: Moment[] }> {
    if (me().synced) return wait({ added: [] });
    const added: Moment[] = [
      { id: uid('m'), title: 'Leaving drinks', occasion: 'Party', date: daysFromNow(7, 18), venue: 'Shoreditch, London', source: 'calendar', weather: { temperature: 9, condition: 'Showers' }, look: { status: 'draft', pieces: [] } },
      { id: uid('m'), title: 'Client lunch', occasion: 'Work', date: daysFromNow(12, 13), venue: 'Fitzrovia, London', source: 'calendar', weather: { temperature: 16, condition: 'Partly cloudy' }, look: { status: 'draft', pieces: [] } },
    ];
    me().moments.push(...added);
    me().synced = true;
    commit();
    return wait({ added: clone(added) });
  },

  async wardrobe(): Promise<WardrobeEntry[]> {
    return wait(clone(me().wardrobe));
  },
  async setWardrobe(productId: string, kind: WardrobeKind | null): Promise<WardrobeEntry[]> {
    const w = me().wardrobe.filter((e) => e.productId !== productId);
    if (kind) w.unshift({ productId, kind, addedAt: new Date().toISOString(), timesWorn: kind === 'owned' ? 0 : undefined });
    me().wardrobe = w;
    commit();
    return wait(clone(w));
  },

  async journal(): Promise<JournalEntry[]> {
    return wait(clone(me().journal).sort((a, b) => +new Date(b.date) - +new Date(a.date)));
  },
  async addJournal(entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    const e = { ...entry, id: uid('j') };
    me().journal.unshift(e);
    commit();
    return wait(clone(e));
  },
};

function strip(u: User & { password?: string }): User {
  const { password: _pw, ...rest } = u;
  return rest;
}

function nameFromEmail(email: string) {
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim();
  return local ? local.replace(/\b\w/g, (c) => c.toUpperCase()) : 'There';
}
