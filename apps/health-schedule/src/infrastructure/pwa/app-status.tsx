"use client";

import { useConnectionStatus } from "@healthalyst/pwa/hooks/use-connection-status";
import { useServiceWorker } from "@healthalyst/pwa/hooks/use-service-worker";
import { AppStatusRegion } from "@healthalyst/ui/components/app-status-region";
import { WEB_APP_CONFIGURATION } from "~/config/web-app";

/** Registers the service worker and shows the offline and update notices. */
export function AppStatus() {
  const { isOnline } = useConnectionStatus();
  const serviceWorker = useServiceWorker();

  return (
    <AppStatusRegion
      offlineNotice={
        isOnline
          ? null
          : {
              title: "You are offline",
              description: WEB_APP_CONFIGURATION.keepPagesForOffline
                ? "You can keep moving between screens. Anything that needs the server waits until you are back online."
                : "Reconnect to keep working. Changes cannot be saved without a connection.",
            }
      }
      updateNotice={
        serviceWorker.isUpdateReady
          ? {
              title: "A new version is ready",
              description: "Update when you have finished what you are doing.",
              actionLabel: "Update now",
              applyingLabel: "Updating",
              isApplying: serviceWorker.isApplyingUpdate,
              onApply: serviceWorker.applyUpdate,
            }
          : null
      }
    />
  );
}
