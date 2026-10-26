/**
 * Loading a wardrobe photo that only its owner may see.
 *
 * These images sit behind an authenticated route, and an <img src> can't carry an Authorization
 * header. The alternative — an unguessable public URL — is the usual shortcut, but these are
 * photographs of someone's home and belongings, so the route stays authenticated and the bytes are
 * fetched here and handed to the <img> as an object URL.
 *
 * Results are cached for the session, because the same piece appears in the wardrobe grid, on the
 * canvas and in a look, and each would otherwise be its own download.
 */
import { useEffect, useState } from 'react';
import { apiUrl } from './apiBase';
import { getToken } from './session';

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

/** Our own private image route, as written into a captured piece's imageUrl. */
export const isPrivateImage = (src: string | undefined): boolean => !!src && src.startsWith('/api/wardrobe/items/');

async function load(src: string): Promise<string> {
  const cached = cache.get(src);
  if (cached) return cached;

  const existing = inflight.get(src);
  if (existing) return existing;

  const p = (async () => {
    const token = getToken();
    const res = await fetch(apiUrl(src), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(`Image ${res.status}`);
    const url = URL.createObjectURL(await res.blob());
    cache.set(src, url);
    inflight.delete(src);
    return url;
  })();

  inflight.set(src, p);
  p.catch(() => inflight.delete(src));
  return p;
}

/**
 * Resolves an image URL for display. Public URLs pass straight through, so this is safe to call
 * for every product; only our own private route costs a fetch.
 */
export function useImageSrc(src: string | undefined): string {
  const needsAuth = isPrivateImage(src);
  const [resolved, setResolved] = useState<string>(() => (needsAuth ? cache.get(src!) ?? '' : src ?? ''));

  useEffect(() => {
    if (!needsAuth) {
      setResolved(src ?? '');
      return;
    }
    let live = true;
    load(src!)
      .then((url) => live && setResolved(url))
      .catch(() => live && setResolved(''));
    return () => {
      live = false;
    };
  }, [src, needsAuth]);

  return resolved;
}

/**
 * Swaps each piece's private image path for an object URL, reporting progress as they arrive.
 *
 * Resolving at the data layer rather than in every <img> means the twelve places that render a
 * product image need no knowledge of authenticated images at all. Pieces whose image fails to
 * load are still returned, so a piece never vanishes from the wardrobe because of a dropped
 * request — it just shows the empty-photo state.
 *
 * Images are fetched a few at a time: a full wardrobe is dozens of requests and firing them all
 * at once makes the rest of the app wait behind them.
 */
export async function resolvePieceImages<T extends { id: string; imageUrl?: string }>(
  pieces: T[],
  onProgress: (resolved: T[]) => void,
  concurrency = 4,
): Promise<T[]> {
  const out = pieces.map((p) => ({ ...p }));
  onProgress(out.map((p) => ({ ...p })));
  if (!pieces.length) return out;

  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, out.length) }, async () => {
    while (next < out.length) {
      const piece = out[next++];
      if (!isPrivateImage(piece.imageUrl)) continue;
      try {
        piece.imageUrl = await load(piece.imageUrl!);
      } catch {
        piece.imageUrl = ''; // the tile shows its placeholder rather than a broken image
      }
      onProgress(out.map((p) => ({ ...p })));
    }
  });

  await Promise.all(workers);
  return out;
}

/** Drop a cached object URL — call after deleting a piece so its blob is released. */
export function forgetImage(src: string | undefined): void {
  if (!src) return;
  const url = cache.get(src);
  if (url) {
    URL.revokeObjectURL(url);
    cache.delete(src);
  }
}
