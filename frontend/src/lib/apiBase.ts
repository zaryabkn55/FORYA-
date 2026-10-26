/**
 * Where the API lives.
 *
 * On the web the app is served by the same Express process that serves the API, so a relative
 * path is right and this is an empty string. Inside the native shell there is no such origin —
 * the page is loaded from the app bundle — so the build sets VITE_API_BASE to the deployed
 * server and every call becomes absolute.
 *
 *   web     VITE_API_BASE unset  ->  fetch('/api/products')
 *   native  VITE_API_BASE=https://forya.onrender.com  ->  fetch('https://forya.onrender.com/api/products')
 *
 * Note for the native build: an absolute base means the request is cross-origin, so the server's
 * ALLOWED_ORIGINS has to include the shell's origin (capacitor://localhost on iOS,
 * https://localhost on Android). See MOBILE.md.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '');

/** Absolute when running natively, relative on the web. Pass a path that starts with "/". */
export const apiUrl = (path: string): string => `${API_BASE}${path}`;

/** True when the app is running inside the Capacitor shell rather than a browser tab. */
export const isNative = (): boolean =>
  typeof window !== 'undefined' && Boolean((window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
