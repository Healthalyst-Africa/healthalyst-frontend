"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { LOCAL_GOVERNMENT_AREA_FIELD_TEXT } from "~/shared/organization/config/local-government-areas";
import type { LocalGovernmentAreaChoice } from "~/shared/organization/hooks/use-local-government-area-choice";

/** Inline feedback when a state's local government areas could not load. */
export function LocalGovernmentAreaLoadNotice({
  choice,
}: {
  choice: LocalGovernmentAreaChoice;
}) {
  if (!choice.loadError) return null;
  return (
    <NoticeBanner
      tone="error"
      title={LOCAL_GOVERNMENT_AREA_FIELD_TEXT.loadFailedTitle}
      action={
        <ActionButton
          type="button"
          variant="outline"
          isLoading={choice.isRetrying}
          loadingText="Trying again"
          onClick={choice.retry}
        >
          {LOCAL_GOVERNMENT_AREA_FIELD_TEXT.retry}
        </ActionButton>
      }
    >
      {choice.loadError}
    </NoticeBanner>
  );
}
