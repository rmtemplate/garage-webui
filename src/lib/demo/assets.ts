/**
 * Locally generated demo assets.
 *
 * Every preview image is an SVG built here and handed to the browser as a
 * data: URI — Demo Mode never reaches the network for a thumbnail.
 */

const PALETTE = [
  ["#0b6e99", "#45c8ff"],
  ["#b45309", "#fbbf24"],
  ["#15803d", "#6ee7b7"],
  ["#6d28d9", "#c4b5fd"],
  ["#be123c", "#fda4af"],
  ["#0f766e", "#5eead4"],
];

/** Stable hash so the same key always gets the same colours. */
const hash = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const svgToDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const escapeXml = (text: string) =>
  text.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c]!
  );

/**
 * A placeholder image for an object key. Deterministic: same key, same image.
 */
export const demoImage = (key: string, size = 480) => {
  const seed = hash(key);
  const [from, to] = PALETTE[seed % PALETTE.length];
  const label = escapeXml(key.split("/").pop() || key);
  const angle = seed % 360;
  const cx = 25 + (seed % 50);
  const cy = 25 + ((seed >> 3) % 50);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 480 480">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="h" cx="${cx}%" cy="${cy}%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="480" height="480" fill="url(#g)"/>
  <rect width="480" height="480" fill="url(#h)"/>
  <g fill="#ffffff" fill-opacity="0.16">
    <circle cx="${(seed % 360) + 60}" cy="${((seed >> 5) % 360) + 60}" r="${40 + (seed % 70)}"/>
    <circle cx="${((seed >> 7) % 400) + 40}" cy="${((seed >> 9) % 400) + 40}" r="${24 + (seed % 40)}"/>
  </g>
  <rect x="0" y="392" width="480" height="88" fill="#0f172a" fill-opacity="0.42"/>
  <text x="24" y="432" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="600" fill="#ffffff">${label}</text>
  <text x="24" y="458" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" fill="#ffffff" fill-opacity="0.75">Demo asset — generated locally</text>
</svg>`;

  return svgToDataUri(svg);
};

/** Small square thumbnail variant, cheaper to inline in a long list. */
export const demoThumbnail = (key: string) => demoImage(key, 96);

/** Plain-text stand-in for a non-image object opened in a new tab. */
export const demoTextPreview = (key: string) =>
  `data:text/plain;charset=utf-8,${encodeURIComponent(
    [
      `Garage Web UI — Local Demo Mode`,
      ``,
      `Object : ${key}`,
      ``,
      `This file does not exist. Demo Mode serves generated placeholder`,
      `content so the browser can be exercised without a Garage cluster,`,
      `the S3 API, or the Go backend.`,
    ].join("\n")
  )}`;
