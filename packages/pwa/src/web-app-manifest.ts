import type { MetadataRoute } from "next";

/** Icon files every HealthAlyst app ships in `public/icons`. */
const APP_ICONS: MetadataRoute.Manifest["icons"] = [
  {
    src: "/icons/icon-192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/icon-maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];

/**
 * The web app manifest for one HealthAlyst app. Each app supplies its own
 * name and colours; the shape and icons stay the same across products.
 */
export function createWebAppManifest({
  identifier,
  name,
  shortName,
  description,
  themeColour,
  backgroundColour,
}: {
  /** Stable across releases, so an installed app keeps its identity. */
  identifier: string;
  name: string;
  shortName: string;
  description: string;
  themeColour: string;
  backgroundColour: string;
}): MetadataRoute.Manifest {
  return {
    id: identifier,
    name,
    short_name: shortName,
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Clinic screens are used on desks, tablets and phones in either direction.
    orientation: "any",
    theme_color: themeColour,
    background_color: backgroundColour,
    icons: APP_ICONS,
  };
}
