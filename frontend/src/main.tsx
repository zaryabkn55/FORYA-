import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LinkInterceptor } from './components/LinkInterceptor';
import { ProductDrawerProvider } from './components/ProductDrawer';
import { SessionProvider } from './lib/session';
import { StoreProvider } from './lib/store';
import './styles.css';

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
