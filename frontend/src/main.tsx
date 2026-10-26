import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LinkInterceptor } from './components/LinkInterceptor';
import { ProductDrawerProvider } from './components/ProductDrawer';
import { isNative } from './lib/apiBase';
import { SessionProvider } from './lib/session';
import { StoreProvider } from './lib/store';
import './styles.css';

// Service worker: web only. Inside the native shell the bundle is already local, and a second
// cache layer there would just serve yesterday's build.
if (!isNative()) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {}); // an unsupported browser is not a reason to fail the app
}

// Hash routing is only for the static preview build (no server to rewrite URLs).
// Previews and static hosting without URL rewrites: VITE_ROUTER=memory (no URL changes at all) or hash (#/ routes).
const mode = import.meta.env.VITE_ROUTER ?? (import.meta.env.VITE_HASH_ROUTER === 'true' ? 'hash' : 'browser');
const Router = mode === 'memory' ? MemoryRouter : mode === 'hash' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
    <Router>
      {mode === 'memory' && <LinkInterceptor />}
      <SessionProvider>
        <StoreProvider>
          <ProductDrawerProvider>
            <App />
          </ProductDrawerProvider>
        </StoreProvider>
      </SessionProvider>
    </Router>
    </ErrorBoundary>
  </React.StrictMode>,
);
