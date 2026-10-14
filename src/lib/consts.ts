// consts.ts

export const BASE_PATH =
  (import.meta.env.PROD ? window.__BASE_PATH : null) ||
  import.meta.env.VITE_BASE_PATH ||
  "";

/**
 * Local Demo Mode — serves every page from an in-memory mock adapter so the UI
 * can be previewed without Garage, the S3 API, or the Go backend.
 *
 * Gated on `import.meta.env.DEV` on purpose: this is a compile-time constant,
 * so a production build evaluates the whole expression to `false`, and Rollup
 * drops both the demo branches and the `src/lib/demo/*` modules from the
 * bundle. There is no way to switch it on in a production build.
 */
export const IS_DEMO =
  import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === "true";
