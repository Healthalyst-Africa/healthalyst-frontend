"use client";

import { AddToHomeScreenIcon, ShareIcon } from "@healthalyst/icons";
import { useConnectionStatus } from "@healthalyst/pwa/hooks/use-connection-status";
import { useInstallOffer } from "@healthalyst/pwa/hooks/use-install-offer";
import { useServiceWorker } from "@healthalyst/pwa/hooks/use-service-worker";
import { AppStatusRegion } from "@healthalyst/ui/components/app-status-region";
import { WEB_APP_CONFIGURATION } from "~/config/web-app";

/** Registers the service worker and shows the offline and update notices. */
export function AppStatus() {
  const { isOnline } = useConnectionStatus();
  const serviceWorker = useServiceWorker({
    storeVisitedPages: WEB_APP_CONFIGURATION.keepPagesForOffline,
  });

  const installOffer = useInstallOffer({
    enabled: WEB_APP_CONFIGURATION.promptToInstall,
  });

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
      installNotice={
        installOffer.offer === "install-button"
          ? {
              title: `Install ${WEB_APP_CONFIGURATION.shortName}`,
              description:
                "It opens in its own window and keeps working when the connection drops.",
              installAction: {
                label: "Install",
                pendingLabel: "Installing",
                isPending: installOffer.isInstalling,
                onSelect: installOffer.install,
              },
              dismissLabel: "Not now",
              onDismiss: installOffer.dismiss,
            }
          : installOffer.offer === "home-screen-instructions"
            ? {
                title: `Add ${WEB_APP_CONFIGURATION.shortName} to your Home Screen`,
                description: (
                  <>
                    Tap Share{" "}
                    <ShareIcon
                      aria-hidden="true"
                      className="inline size-4 align-text-bottom"
                    />
                    , then Add to Home Screen{" "}
                    <AddToHomeScreenIcon
                      aria-hidden="true"
                      className="inline size-4 align-text-bottom"
                    />
                    . It then opens like an app and keeps your offline work on
                    this device.
                  </>
                ),
                dismissLabel: "Not now",
                onDismiss: installOffer.dismiss,
              }
            : null
      }
    />
  );
}
