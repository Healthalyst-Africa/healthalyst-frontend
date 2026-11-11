"use client";

import { useConnectionStatus } from "@healthalyst/pwa/hooks/use-connection-status";
import { useServiceWorker } from "@healthalyst/pwa/hooks/use-service-worker";
import { AppStatusRegion } from "@healthalyst/ui/components/app-status-region";

/**
 * Registers the service worker and shows the offline and update notices. This
 * app is browser-only, so it never offers to install.
 */
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
              description:
                "Reconnect to keep working. Changes cannot be saved without a connection.",
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
