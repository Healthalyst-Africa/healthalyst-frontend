"use client";

import type { ReactNode } from "react";
import { InstallAppIcon, OfflineIcon } from "@healthalyst/icons";
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
  /** Suggests installing the app, with a button or with instructions. */
  installNotice?: {
    title: string;
    /** May include inline icons that show what to tap. */
    description: ReactNode;
    /** Present when the browser can open its own install dialog. */
    installAction?: {
      label: string;
      pendingLabel: string;
      isPending: boolean;
      onSelect: () => void;
    };
    dismissLabel: string;
    onDismiss: () => void;
  } | null;
};

/**
 * App-wide notices that float above the page: no connection, a new version
 * waiting, and a suggestion to install the app. Each is announced politely and never takes focus, so
 * nobody loses their place in a form.
 */
export function AppStatusRegion({
  offlineNotice,
  updateNotice,
  installNotice,
}: AppStatusRegionProperties) {
  if (!offlineNotice && !updateNotice && !installNotice) return null;
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
      {installNotice && (
        <div className="pointer-events-auto rounded-lg bg-card shadow-lg">
          <NoticeBanner
            tone="information"
            icon={<InstallAppIcon aria-hidden="true" />}
            title={installNotice.title}
          >
            {/* One block, so inline icons stay within the sentence. */}
            <span>{installNotice.description}</span>
            {/* Below the text: two buttons beside it would squeeze it into a narrow column. */}
            <span className="flex flex-wrap gap-2">
              {installNotice.installAction && (
                <ActionButton
                  type="button"
                  size="small"
                  isLoading={installNotice.installAction.isPending}
                  loadingText={installNotice.installAction.pendingLabel}
                  onClick={installNotice.installAction.onSelect}
                >
                  {installNotice.installAction.label}
                </ActionButton>
              )}
              <ActionButton
                type="button"
                size="small"
                variant="outline"
                onClick={installNotice.onDismiss}
              >
                {installNotice.dismissLabel}
              </ActionButton>
            </span>
          </NoticeBanner>
        </div>
      )}
    </div>
  );
}

export type { AppStatusRegionProperties };
