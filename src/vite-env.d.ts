/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base path the UI is served under, e.g. "/garage". */
  readonly VITE_BASE_PATH?: string;
  /** Backend origin the dev server proxies /api to. */
  readonly VITE_API_URL?: string;
  /** "true" enables Local Demo Mode. Development builds only — see consts.ts. */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
