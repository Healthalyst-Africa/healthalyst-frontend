import { createServiceWorkerRoute } from "@healthalyst/pwa/service-worker-route";
import { WEB_APP_CONFIGURATION } from "~/config/web-app";

/** Builds and serves this app's service worker at `/serwist/sw.js`. */
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createServiceWorkerRoute({
    serviceWorkerSource: "src/app/sw.ts",
    offlinePagePath: WEB_APP_CONFIGURATION.offlinePagePath,
    keepPagesForOffline: WEB_APP_CONFIGURATION.keepPagesForOffline,
  });
