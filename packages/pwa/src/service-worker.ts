/// <reference lib="esnext" />
/// <reference lib="webworker" />
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
  type RuntimeCaching,
} from "serwist";
import {
  decideCaching,
  type CachingDecision,
  type CachingPolicy,
} from "./caching-rules";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const SECONDS_PER_DAY = 24 * 60 * 60;

/** How long a page waits for the network before using its stored copy. */
const PAGE_NETWORK_TIMEOUT_SECONDS = 4;

const CACHE_NAMES = {
  immutableAssets: "healthalyst-build-assets",
  staticAssets: "healthalyst-static-assets",
  pages: "healthalyst-pages",
} as const;

function createHandler(decision: CachingDecision) {
  switch (decision) {
    case "immutable-asset":
      return new CacheFirst({
        cacheName: CACHE_NAMES.immutableAssets,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 400,
            maxAgeSeconds: 30 * SECONDS_PER_DAY,
            maxAgeFrom: "last-used",
          }),
        ],
      });
    case "static-asset":
      return new StaleWhileRevalidate({
        cacheName: CACHE_NAMES.staticAssets,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: 30 * SECONDS_PER_DAY,
            maxAgeFrom: "last-used",
          }),
        ],
      });
    case "page":
      return new NetworkFirst({
        cacheName: CACHE_NAMES.pages,
        networkTimeoutSeconds: PAGE_NETWORK_TIMEOUT_SECONDS,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 14 * SECONDS_PER_DAY,
          }),
        ],
      });
    case "network-only":
      return new NetworkOnly();
  }
}

function createRuntimeCaching(policy: CachingPolicy): RuntimeCaching[] {
  const decisions: CachingDecision[] = [
    "network-only",
    "immutable-asset",
    "static-asset",
    "page",
  ];
  return decisions.map((decision) => ({
    matcher: ({ url, request }) =>
      decideCaching(
        {
          url,
          appOrigin: self.location.origin,
          method: request.method,
          mode: request.mode,
          destination: request.destination,
          isServerComponentPayload: request.headers.get("RSC") === "1",
          acceptsHtml:
            request.headers.get("Accept")?.includes("text/html") ?? false,
        },
        policy
      ) === decision,
    handler: createHandler(decision),
  }));
}

export type HealthAlystServiceWorkerOptions = CachingPolicy & {
  /** Shown for a page that cannot load offline, such as `/offline`. */
  offlinePagePath: string;
};

/**
 * Starts a HealthAlyst app's service worker. A new version waits until the
 * person chooses to update, so it never reloads a page in the middle of a
 * form; the app shows the prompt.
 */
export function startHealthAlystServiceWorker({
  offlinePagePath,
  keepPagesForOffline,
}: HealthAlystServiceWorkerOptions): void {
  const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    precacheOptions: { cleanupOutdatedCaches: true },
    skipWaiting: false,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: createRuntimeCaching({ keepPagesForOffline }),
    fallbacks: {
      entries: [
        {
          url: offlinePagePath,
          matcher: ({ request }) => request.destination === "document",
        },
      ],
    },
  });
  serwist.addEventListeners();
}
