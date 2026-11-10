import { createOfflineDocument } from "@healthalyst/pwa/offline-document";
import { WEB_APP_CONFIGURATION } from "~/config/web-app";

/** Built once, stored by the service worker and shown when a page cannot load offline. */
export const dynamic = "force-static";

export function GET() {
  return new Response(
    createOfflineDocument({
      applicationName: WEB_APP_CONFIGURATION.name,
      ...WEB_APP_CONFIGURATION.offlinePage,
      iconPath: "/icons/icon-192.png",
    }),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
