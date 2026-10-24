/*
 * The heading, words and photographs of the HealthAlyst marketing website's
 * hero (`HOMEPAGE_HERO_CONTENT` in marketing-module), so onboarding opens
 * with the same introduction.
 */
export const HERO_HEADING_LEAD = "Digital infrastructure for";
export const HERO_STILL_WORD = "African healthcare";
export const HERO_SPOKEN_ENDING =
  "hospitals, laboratories, pharmacies, dental practices, imaging centres and medical suppliers";

export const HERO_SLIDES = [
  { word: "hospitals", source: "/images/module-hospital.webp" },
  { word: "laboratories", source: "/images/module-laboratory.webp" },
  { word: "pharmacies", source: "/images/module-pharmacy.webp" },
  { word: "dental practices", source: "/images/module-dental.webp" },
  { word: "imaging centres", source: "/images/module-imaging.webp" },
  { word: "medical suppliers", source: "/images/module-supply.webp" },
] as const;
