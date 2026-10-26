"use client";

import { useTurnstileChallenge } from "~/features/organization-registration/hooks/use-turnstile-challenge";
import type { TurnstileChallengeProperties } from "~/features/organization-registration/types/turnstile";
import {
  TURNSTILE_SCRIPT_URL,
  TURNSTILE_STATUS_MESSAGES,
} from "~/features/organization-registration/config/turnstile";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import Script from "next/script";
import { LabelledControlGroup } from "@healthalyst/ui/components/labelled-control-group";

export default function TurnstileChallenge({
  onResponseTokenChange,
  siteKey,
}: TurnstileChallengeProperties) {
  const {
    setIsScriptReady,
    verificationStatus,
    containerReference,
    restartChallenge,
    canRestartChallenge,
    handleScriptError,
  } = useTurnstileChallenge({ onResponseTokenChange, siteKey });
  const statusMessage = TURNSTILE_STATUS_MESSAGES[verificationStatus];

  return (
    <LabelledControlGroup
      id="registration-captcha"
      title="Human verification"
      message={
        siteKey
          ? statusMessage
          : "The human check is unavailable. Please try again later."
      }
      messageTone={
        !siteKey || verificationStatus === "error" ? "error" : "status"
      }
    >
      {siteKey && (
        <>
          <Script
            id="cloudflare-turnstile-script"
            src={TURNSTILE_SCRIPT_URL}
            strategy="afterInteractive"
            onReady={() => setIsScriptReady(true)}
            onError={handleScriptError}
          />
          <div ref={containerReference} className="min-h-[65px]" />
          {canRestartChallenge && (
            <ActionButton
              className="w-fit"
              size="small"
              type="button"
              variant="outline"
              onClick={restartChallenge}
            >
              Check again
            </ActionButton>
          )}
        </>
      )}
    </LabelledControlGroup>
  );
}
