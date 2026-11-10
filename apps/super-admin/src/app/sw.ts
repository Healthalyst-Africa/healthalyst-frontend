import { startHealthAlystServiceWorker } from "@healthalyst/pwa/service-worker";
import { WEB_APP_CONFIGURATION } from "~/config/web-app";

startHealthAlystServiceWorker({
  offlinePagePath: WEB_APP_CONFIGURATION.offlinePagePath,
  keepPagesForOffline: WEB_APP_CONFIGURATION.keepPagesForOffline,
});
