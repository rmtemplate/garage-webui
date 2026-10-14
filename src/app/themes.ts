// Design tokens — the single source of truth for colour in the app.
//
// Consumed twice:
//  - tailwind.config.js (via `require`) to generate the daisyUI themes
//  - ThemeProvider, to set `data-theme` on <html>
//
// Keep this file free of imports: tailwind.config.js loads it outside the
// Vite pipeline.

export const themes = ["garage-light", "garage-dark"] as const;

export type Themes = (typeof themes)[number];

/** What the user picks. "system" follows the OS preference. */
export const themeModes = ["system", "light", "dark"] as const;

export type ThemeMode = (typeof themeModes)[number];

/**
 * Shared, non-colour tokens. Radii and control heights live here so every
 * daisyUI component inherits them instead of each call site picking its own.
 */
const shape = {
  "--rounded-box": "0.75rem", // cards, surfaces
  "--rounded-btn": "0.5rem", // buttons, inputs
  "--rounded-badge": "0.375rem", // badges, chips
  "--tab-radius": "0.5rem",
  "--animation-btn": "0.15s",
  "--animation-input": "0.15s",
  "--btn-focus-scale": "1",
  "--border-btn": "1px",
};

export const daisyThemes = [
  {
    "garage-light": {
      primary: "#0b6e99", // deepened from the Garage cyan, AA on white
      "primary-content": "#f0f9ff",
      secondary: "#475569",
      "secondary-content": "#f8fafc",
      accent: "#b45309", // the Garage amber, darkened for contrast
      "accent-content": "#fffbeb",
      neutral: "#1e293b",
      "neutral-content": "#f8fafc",

      "base-100": "#ffffff", // raised surfaces: cards, sidebar, header
      "base-200": "#f4f6f8", // app canvas
      "base-300": "#e3e7ec", // borders, dividers, track
      "base-content": "#0f172a",

      info: "#0369a1",
      "info-content": "#f0f9ff",
      success: "#15803d",
      "success-content": "#f0fdf4",
      warning: "#b45309",
      "warning-content": "#fffbeb",
      error: "#b91c1c",
      "error-content": "#fef2f2",

      ...shape,
    },
  },
  {
    "garage-dark": {
      primary: "#4cb3e8",
      "primary-content": "#04202e",
      secondary: "#94a3b8",
      "secondary-content": "#0b0d10",
      accent: "#f0a33c",
      "accent-content": "#1c1206",
      neutral: "#1b2129",
      "neutral-content": "#e6e8eb",

      "base-100": "#131820", // raised surfaces
      "base-200": "#0c1016", // app canvas
      "base-300": "#242c37", // borders, dividers
      "base-content": "#e4e8ee",

      info: "#60a5fa",
      "info-content": "#06182e",
      success: "#34d399",
      "success-content": "#032018",
      warning: "#fbbf24",
      "warning-content": "#1c1206",
      error: "#f87171",
      "error-content": "#2a0909",

      ...shape,
    },
  },
];
