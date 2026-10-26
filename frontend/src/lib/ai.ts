/**
 * FORYA AI.
 *
 * Three ways to reach a model, tried in order:
 *  1. Claude in the viewer, when FORYA runs as a claude.ai artifact (the `sample` capability).
 *  2. FORYA's own API (`/api/ai/*`), which calls Claude with the server's ANTHROPIC_API_KEY.
 *  3. Nobody: the on-device stylist engine (lib/stylist.ts) answers instead.
 *
 * Every AI feature is written so that (3) still gives a useful answer; the model makes it better.
 */
import { apiMode } from './api';
import { getToken } from './session';
import { apiUrl } from './apiBase';

export type AiSource = 'claude' | 'server' | 'local';
export type Turn = { role: 'user' | 'assistant'; content: string };

interface Sampler {
  (input: string | Turn[], opts?: Record<string, unknown>): Promise<{ text: string; truncated: boolean }>;
  json: <T = unknown>(input: string | Turn[], opts?: Record<string, unknown>) => Promise<T>;
}

let samplerPromise: Promise<Sampler | null> | null = null;
let declined = false;

function sampler(): Promise<Sampler | null> {
  if (!samplerPromise) {
    const claude = (window as unknown as { claude?: { use?: (n: string) => Promise<unknown> } }).claude;
    samplerPromise = claude?.use ? claude.use('sample').then((s) => (s as Sampler) ?? null, () => null) : Promise.resolve(null);
  }
  return samplerPromise;
}

let serverPromise: Promise<boolean> | null = null;
function serverAi(): Promise<boolean> {
  if (!serverPromise) {
    serverPromise = (async () => {
      if ((await apiMode()) !== 'live') return false;
      try {
        const r = await fetch(apiUrl('/api/ai/status'));
        return r.ok && !!(await r.json()).enabled;
      } catch {
        return false;
      }
    })();
  }
  return serverPromise;
}

let sourcePromise: Promise<AiSource> | null = null;
/** Where answers will come from in this view. */
export function aiSource(): Promise<AiSource> {
  if (declined) return Promise.resolve('local');
  return (sourcePromise ??= (async () => ((await sampler()) ? 'claude' : (await serverAi()) ? 'server' : 'local'))());
}

export const AI_LABEL: Record<AiSource, string> = { claude: 'Claude', server: 'Claude', local: 'On-device stylist' };

/** Pull the first JSON object out of a model reply. */
function parseJson<T>(text: string): T {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON in reply');
  return JSON.parse(text.slice(start, end + 1)) as T;
}

/**
 * Ask a model for JSON. Throws when no model is reachable or the viewer said no, so callers fall
 * back to the engine.
 */
export async function askJson<T>(input: string | Turn[], opts: { signal?: AbortSignal; quick?: boolean } = {}): Promise<T> {
  const source = await aiSource();
  if (source === 'claude') {
    const s = (await sampler())!;
    try {
      const { text } = await s(input, { signal: opts.signal, modelTier: opts.quick ? 'quick' : 'default', cache: false });
      return parseJson<T>(text);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'not_granted') {
        declined = true;
        sourcePromise = Promise.resolve('local');
      }
      throw e;
    }
  }
  if (source === 'server') {
    const token = getToken();
    const res = await fetch(apiUrl('/api/ai/complete'), {
      method: 'POST',
      signal: opts.signal,
      headers: { 'Content-Type': 'application/json', ...(token && !token.startsWith('demo.') ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ messages: typeof input === 'string' ? [{ role: 'user', content: input }] : input, quick: !!opts.quick }),
    });
    if (!res.ok) throw new Error(`AI unavailable (${res.status})`);
    const { text } = await res.json();
    return parseJson<T>(text);
  }
  throw new Error('No model available');
}
