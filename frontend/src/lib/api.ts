/**
 * Single entry point for data. Talks to the Express API when it is reachable ("live" mode) and
 * falls back to the in-browser demo store when it is not, so the app is always usable.
 */
import { demo } from './demoStore';
import { getToken } from './session';
import { decodeLook, encodeLook, localReact, localReactions, rememberMine, type Reaction, type Reactions, type SharedLook } from './share';
import type { JournalEntry, Look, Moment, NewMoment, PriceCheck, Product, ShopsFor, User, WardrobeEntry, WardrobeKind } from './types';

export type ApiMode = 'live' | 'demo';

let modePromise: Promise<ApiMode> | null = null;

export function apiMode(): Promise<ApiMode> {
  if (!modePromise) {
    modePromise = (async () => {
      if (import.meta.env.VITE_DEMO === 'true') return 'demo';
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch('/api/health', { signal: ctrl.signal });
        clearTimeout(t);
        const body = await res.json().catch(() => ({}));
        return res.ok && body.database !== 'unavailable' ? 'live' : 'demo';
      } catch {
        return 'demo';
      }
    })();
  }
  return modePromise;
}

async function http<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token && !token.startsWith('demo.') ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Something went wrong (${res.status}).`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (body: unknown) => JSON.stringify(body);

/** Run against the live API, or the demo store when the API is offline. */
const route = async <T,>(live: () => Promise<T>, offline: () => Promise<T>) => ((await apiMode()) === 'live' ? live() : offline());

type AuthResult = { token: string; user: User };

export const api = {
  login: (email: string, password: string) =>
    route<AuthResult>(() => http('/api/auth/login', { method: 'POST', body: json({ email, password }) }), () => demo.login(email, password)),

  register: (input: { name: string; email: string; password: string; country?: string; shopsFor?: ShopsFor }) =>
    route<AuthResult>(
      () => http('/api/auth/register', { method: 'POST', body: json({ fullName: input.name, email: input.email, password: input.password, country: input.country, shopsFor: input.shopsFor }) }),
      () => demo.register(input),
    ),

  /** Change profile settings such as the department (womenswear or menswear). */
  updateProfile: (patch: Partial<Pick<User, 'name' | 'country' | 'shopsFor'>>) =>
    route<User>(() => http('/api/auth/me', { method: 'PATCH', body: json(patch) }), () => demo.updateProfile(patch)),

  oauth: (provider: 'google' | 'apple') =>
    route<AuthResult>(() => http('/api/auth/oauth', { method: 'POST', body: json({ provider }) }), () => demo.oauth(provider)),

  products: () => route<Product[]>(() => http('/api/products'), () => demo.products()),

  priceCheck: (productId: string) =>
    route<PriceCheck>(() => http(`/api/products/${encodeURIComponent(productId)}/prices`), () => demo.priceCheck(productId)),

  moments: () => route<Moment[]>(() => http('/api/moments'), () => demo.moments()),

  moment: (id: string) => route<Moment>(() => http(`/api/moments/${encodeURIComponent(id)}`), () => demo.moment(id)),

  addMoment: (input: NewMoment) => route<Moment>(() => http('/api/moments', { method: 'POST', body: json(input) }), () => demo.addMoment(input)),

  deleteMoment: (id: string) =>
    route<void>(() => http(`/api/moments/${encodeURIComponent(id)}`, { method: 'DELETE' }), () => demo.deleteMoment(id)),

  saveLook: (id: string, look: Look) =>
    route<Moment>(
      () => http(`/api/moments/${encodeURIComponent(id)}/look`, { method: 'PUT', body: json({ status: look.status, pieces: look.pieces }) }),
      () => demo.saveLook(id, look),
    ),

  syncCalendar: () => route<{ added: Moment[] }>(() => http('/api/sync', { method: 'POST' }), () => demo.syncCalendar()),

  wardrobe: () => route<WardrobeEntry[]>(() => http('/api/wardrobe'), () => demo.wardrobe()),

  setWardrobe: (productId: string, kind: WardrobeKind | null) =>
    route<WardrobeEntry[]>(
      () => http(`/api/wardrobe/${encodeURIComponent(productId)}`, { method: 'PUT', body: json({ kind }) }),
      () => demo.setWardrobe(productId, kind),
    ),

  /** Share a look. Live: stored with a short link that collects reactions. Offline: the look travels in the link. */
  shareLook: (momentId: string, look: SharedLook) =>
    route<{ path: string; key: string }>(
      async () => {
        const r = await http<{ id: string }>('/api/shared', { method: 'POST', body: json({ momentId }) });
        return { path: `/look/s/${r.id}`, key: r.id };
      },
      async () => {
        const payload = encodeLook(look);
        return { path: `/look/${payload}`, key: payload };
      },
    ),

  /** Open a shared look by short id (live) or by packed payload (offline links). */
  sharedLook: async (ref: { id?: string; payload?: string }): Promise<{ look: SharedLook; reactions: Reactions; mine?: Reaction }> => {
    if (ref.payload) {
      const look = decodeLook(ref.payload);
      if (!look) throw new Error('This link looks broken. Ask your friend to share it again.');
      const r = localReactions(ref.payload);
      return { look, reactions: r.counts, mine: r.mine };
    }
    const r = await http<{ look: SharedLook; reactions: Reactions }>(`/api/shared/${encodeURIComponent(ref.id!)}`);
    return { ...r, mine: localReactions(`s:${ref.id}`).mine };
  },

  react: async (ref: { id?: string; payload?: string }, reaction: Reaction): Promise<{ reactions: Reactions; mine?: Reaction }> => {
    if (ref.payload) {
      const r = localReact(ref.payload, reaction);
      return { reactions: r.counts, mine: r.mine };
    }
    const key = `s:${ref.id}`;
    const previous = localReactions(key).mine;
    const r = await http<{ reactions: Reactions; mine?: Reaction }>(`/api/shared/${encodeURIComponent(ref.id!)}/react`, {
      method: 'POST',
      body: json({ reaction, previous }),
    });
    rememberMine(key, r.mine);
    return r;
  },

  // The outfit journal is stored on this device for now (no journal table in the API yet).
  journal: (): Promise<JournalEntry[]> => demo.journal(),
  addJournal: (entry: Omit<JournalEntry, 'id'>) => demo.addJournal(entry),
};
