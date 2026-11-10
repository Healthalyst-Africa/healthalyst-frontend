"use client";

import { OfflineIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";

type AppStatusRegionProperties = {
  /** Shown while the device has no connection. */
  offlineNotice?: { title: string; description: string } | null;
  /** Shown when a new version of the app is ready. */
  updateNotice?: {
    title: string;
    description: string;
    actionLabel: string;
    applyingLabel: string;
    isApplying: boolean;
    onApply: () => void;
  } | null;
};

/**
 * App-wide notices that float above the page: no connection, and a new
 * version waiting. Each is announced politely and never takes focus, so
 * nobody loses their place in a form.
 */
export function AppStatusRegion({
  offlineNotice,
  updateNotice,
}: AppStatusRegionProperties) {
  if (!offlineNotice && !updateNotice) return null;
  return (
    <div
      aria-label="App status"
      role="region"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-3 sm:inset-x-auto sm:left-4 sm:w-96"
    >
      {offlineNotice && (
        <div className="pointer-events-auto rounded-lg bg-card shadow-lg">
          <NoticeBanner
            tone="warning"
            icon={<OfflineIcon aria-hidden="true" />}
            title={offlineNotice.title}
          >
            {offlineNotice.description}
          </NoticeBanner>
        </div>
      )}
      {updateNotice && (
        <div className="pointer-events-auto rounded-lg bg-card shadow-lg">
          <NoticeBanner
            tone="information"
            title={updateNotice.title}
            action={
              <ActionButton
                type="button"
                size="small"
                isLoading={updateNotice.isApplying}
                loadingText={updateNotice.applyingLabel}
                onClick={updateNotice.onApply}
              >
                {updateNotice.actionLabel}
              </ActionButton>
            }
          >
            {updateNotice.description}
          </NoticeBanner>
        </div>
      )}
    </div>
  );
}

export type { AppStatusRegionProperties };
