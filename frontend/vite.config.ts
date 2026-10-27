import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The app updates itself on the next load rather than waiting for every tab to close.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'FORYA',
        short_name: 'FORYA',
        description: "You've got plans, we've got the look. Style every moment and check you're paying the right price.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFFFFF',
        theme_color: '#FFFFFF',
        categories: ['shopping', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'New moment', short_name: 'New moment', url: '/moments?new=1' },
          { name: 'Discover', short_name: 'Discover', url: '/discover' },
          { name: 'Wardrobe', short_name: 'Wardrobe', url: '/wardrobe' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        // The SPA serves every route from index.html, but /api must always hit the network.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // The catalogue is public and identical for everyone, so it is safe to reuse.
            // NetworkFirst, not CacheFirst: a stale price is worse than a slow one.
            urlPattern: ({ url }) => /\/api\/(products|brands)(\/|$|\?)/.test(url.pathname + url.search),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'forya-catalogue',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 6 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Forecasts go stale quickly; a short window just smooths repeat lookups.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/weather'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'forya-weather',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'forya-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Retailer and catalogue imagery, which is large and rarely changes.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'forya-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Everything else under /api — auth, moments, wardrobe, shared looks, the stylist — is
        // per-user or spends money, so it is deliberately never cached. A shared device must not
        // be able to read the last person's wardrobe out of the cache.
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // In Docker the API is at http://backend:4000; locally it's on :4000.
      '/api': { target: process.env.VITE_API_TARGET || 'http://localhost:4000', changeOrigin: true },
    },
  },
});
