// Brand-driven palette (light mode only — static PNGs, and the chat UI itself
// is light-only right now, so a dark variant would be speculative). Plain hex
// tokens, not Chart.js-specific, so phase 5's Recharts dashboards can reuse
// this module unchanged.

export const BRAND = "#C9784E";

// Monochromatic ramp derived from BRAND (same hue/saturation, varying only
// lightness). Ordered for maximum adjacent contrast: base, then darkest,
// then lightest, so a 2-3 series chart (the common case) stays clearly
// distinguishable. All steps kept dark enough to stay visible against the
// surface — no near-white step that would wash out.
export const MONOCHROME = [
  BRAND, // base
  "#7D4326", // dark
  "#D99F82", // light
  "#A45832", // mid-dark
];

export const CHROME = {
  surface: "#fcfcfb",
  primaryInk: "#0b0b0b",
  secondaryInk: "#52514e",
  mutedInk: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
};

// Registered explicitly from a real file in generateChart.ts — node-canvas does
// not reliably resolve generic family names like "Helvetica Neue"/"Arial" without
// an explicit registerFont() call, which was the root cause of the font falling
// back to a generic default regardless of what was named here.
export const FONT_FAMILY = "Inter";
