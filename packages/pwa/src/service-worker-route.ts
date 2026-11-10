import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

/**
 * What an offline product stores at install, relative to the app: all its
 * code, styles and fonts, and its brand images. Photos are kept when first
 * shown instead, so installing stays light on slow connections.
 */
const OFFLINE_PRODUCT_FILES = [
  ".next/static/**/*.{js,css,woff2,json}",
  "public/*.{png,jpg}",
  "public/icons/*",
];

/**
 * What an online-only app stores at install, relative to the app: only the
 * icons. Its offline page is self-contained HTML, stored separately.
 */
const OFFLINE_PAGE_FILES = ["public/icons/*"];

/**
 * Identifies this build, so a new deploy replaces the stored offline page.
 * Hosts that build without Git get a fresh value on every build.
 */
function readBuildRevision(): string {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  });
  const commit = result.status === 0 ? result.stdout.trim() : "";
  return commit || crypto.randomUUID();
}

/**
 * The route handler that builds and serves an app's service worker at
 * `/serwist/sw.js`. Place it at `src/app/serwist/[path]/route.ts`.
 */
export function createServiceWorkerRoute({
  serviceWorkerSource,
  offlinePagePath,
  keepPagesForOffline,
}: {
  /** The worker's entry file, relative to the app, such as `src/app/sw.ts`. */
  serviceWorkerSource: string;
  /** Stored at install so it can be shown with no connection. */
  offlinePagePath: string;
  /**
   * Products built to work offline store all their code at install, so every
   * screen opens without a connection. Online-only apps store just their
   * icons and the offline page.
   */
  keepPagesForOffline: boolean;
}) {
  return createSerwistRoute({
    swSrc: serviceWorkerSource,
    globPatterns: keepPagesForOffline
      ? OFFLINE_PRODUCT_FILES
      : OFFLINE_PAGE_FILES,
    additionalPrecacheEntries: [
      { url: offlinePagePath, revision: readBuildRevision() },
    ],
    useNativeEsbuild: true,
  });
}
