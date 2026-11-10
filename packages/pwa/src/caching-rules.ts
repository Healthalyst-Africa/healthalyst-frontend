/**
 * What the service worker may keep, decided per request. Patient and
 * organisation data never goes into the browser's Cache Storage: it is
 * readable by anyone with the device and outlives sign-out. Offline data
 * belongs in the encrypted, per-person store planned for
 * `@healthalyst/offline`, not here.
 */

/** Paths that reach a HealthAlyst API, directly or through an app's proxy. */
const API_PATH_PATTERN = /(^|\/)v1(\/|$)/;

/** The service worker's own files, served by the app's route handler. */
const SERVICE_WORKER_PATH_PREFIX = "/serwist/";

export type CachingDecision =
  /** Always from the network; never stored. */
  | "network-only"
  /** Build output with a content hash in its name: stored until it expires. */
  | "immutable-asset"
  /** Images and fonts: served from storage, refreshed in the background. */
  | "static-asset"
  /** A page or its React Server Component payload: network first, stored copy when offline. */
  | "page";

export type CachingRequest = {
  url: URL;
  /** The page's own origin; requests to any other origin are never stored. */
  appOrigin: string;
  method: string;
  /** `navigate` for documents opened in the browser. */
  mode: RequestMode;
  destination: RequestDestination;
  /** True for the payloads Next.js fetches during client navigation. */
  isServerComponentPayload: boolean;
  /**
   * True when the request asks for an HTML page. The app sends these to store
   * each screen it opens, so a reload works offline.
   */
  acceptsHtml: boolean;
};

export type CachingPolicy = {
  /**
   * Keep pages and their payloads so the app opens and moves between
   * screens offline. Only products built to work offline turn this on.
   */
  keepPagesForOffline: boolean;
};

export function isApiRequest(url: URL): boolean {
  return API_PATH_PATTERN.test(url.pathname);
}

export function decideCaching(
  request: CachingRequest,
  policy: CachingPolicy
): CachingDecision {
  const { url } = request;
  if (request.method !== "GET") return "network-only";
  if (url.origin !== request.appOrigin) return "network-only";
  if (isApiRequest(url)) return "network-only";
  if (url.pathname.startsWith(SERVICE_WORKER_PATH_PREFIX)) {
    return "network-only";
  }
  if (url.pathname.startsWith("/_next/static/")) return "immutable-asset";
  if (
    url.pathname.startsWith("/_next/image") ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    return "static-asset";
  }
  if (
    request.mode === "navigate" ||
    request.isServerComponentPayload ||
    request.acceptsHtml
  ) {
    return policy.keepPagesForOffline ? "page" : "network-only";
  }
  return "network-only";
}
