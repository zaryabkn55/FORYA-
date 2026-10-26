/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Absolute API origin for native builds; unset on the web so calls stay relative. */
  readonly VITE_API_BASE?: string;
  readonly VITE_DEMO?: string;
  readonly VITE_ROUTER?: string;
  readonly VITE_HASH_ROUTER?: string;
  readonly VITE_API_TARGET?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
