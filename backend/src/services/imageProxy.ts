/**
 * Guard for the retailer image proxy.
 *
 * The proxy exists because retailer CDNs block hotlinking, so the browser can't load their
 * images directly. But "fetch any URL the caller names" is an open proxy: without the checks
 * below it can be pointed at cloud metadata endpoints (169.254.169.254), at services on the
 * private network, or used to pull gigabytes through the server's bandwidth.
 *
 * So a URL has to clear four gates before we fetch it:
 *   1. http(s) only — no file:, gopher:, data:
 *   2. the hostname must resolve to a public address, never loopback/private/link-local
 *   3. if IMAGE_PROXY_ALLOWED_HOSTS is configured, the host must match it
 *   4. the response must actually be an image, and under the size cap
 */
import dns from 'node:dns/promises';
import net from 'node:net';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB — generous for a product shot

const allowedHosts = (process.env.IMAGE_PROXY_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase().replace(/^\./, ''))
  .filter(Boolean);

export type ProxyCheck = { ok: true; url: URL } | { ok: false; reason: string };

/** True for addresses that must never be reachable through the proxy. */
export function isPrivateAddress(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;                        // 10.0.0.0/8
    if (a === 127) return true;                       // loopback
    if (a === 0) return true;                         // "this network"
    if (a === 169 && b === 254) return true;          // link-local, incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;          // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true;// carrier-grade NAT
    if (a >= 224) return true;                        // multicast / reserved
    return false;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::' || lower === '::1') return true;
    if (lower.startsWith('fe80')) return true;        // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique-local
    // IPv4-mapped (::ffff:10.0.0.1) — check the embedded address too
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return false;
  }
  return true; // not an IP we understand: refuse
}

export async function checkImageUrl(raw: string): Promise<ProxyCheck> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'not a URL' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, reason: 'scheme' };
  if (url.username || url.password) return { ok: false, reason: 'credentials in URL' };

  const host = url.hostname.toLowerCase();

  if (allowedHosts.length) {
    const permitted = allowedHosts.some((h) => host === h || host.endsWith('.' + h));
    if (!permitted) return { ok: false, reason: 'host not allowed' };
  }

  // A literal private IP is refused outright; a hostname is resolved and every answer checked,
  // so a DNS record pointing inward can't slip through.
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) return { ok: false, reason: 'private address' };
    return { ok: true, url };
  }

  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch {
    return { ok: false, reason: 'dns' };
  }
  if (!addresses.length) return { ok: false, reason: 'dns' };
  if (addresses.some((a) => isPrivateAddress(a.address))) return { ok: false, reason: 'private address' };

  return { ok: true, url };
}

/** Narrow an upstream content-type down to something safe to echo back to a browser. */
export function safeImageContentType(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return null;
  const type = value.split(';')[0].trim().toLowerCase();
  if (!type.startsWith('image/')) return null;
  // SVG can carry script; it is never needed for product photography.
  if (type === 'image/svg+xml') return null;
  return type;
}
