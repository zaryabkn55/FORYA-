/**
 * Retailer CDNs usually block hotlinking (403 / referer checks), so the browser can't load their
 * images directly. We hand the frontend a same-origin proxy URL instead.
 * FORYA's own imagery (generation CDN or /images/…) is served as-is.
 */
const PASSTHROUGH = [/^https?:\/\/d8j0ntlcm91z4\.cloudfront\.net\//i, /^https?:\/\/images\.unsplash\.com\//i];

export function proxiedImage(url?: string | null): string {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) return url; // already local / relative
  if (PASSTHROUGH.some((r) => r.test(url))) return url;
  return `/api/products/proxy-image?url=${encodeURIComponent(url)}`;
}
