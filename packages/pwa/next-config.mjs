import { withSerwist } from "@serwist/turbopack";

/**
 * Adds the service worker build to an app's Next.js configuration. The
 * worker itself is served by the app's `/serwist/[path]` route handler.
 *
 * @param {import("next").NextConfig} nextConfiguration
 * @returns {import("next").NextConfig}
 */
export function withHealthAlystPwa(nextConfiguration) {
  return withSerwist(nextConfiguration);
}
