/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "true" to skip the API and run entirely on the in-browser demo store. */
  readonly VITE_DEMO?: string;
  /** "true" for static hosting without URL rewrites (uses #/ routes). */
  readonly VITE_HASH_ROUTER?: string;
  /** 'memory' | 'hash' | 'browser' (default). */
  readonly VITE_ROUTER?: 'memory' | 'hash' | 'browser';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
