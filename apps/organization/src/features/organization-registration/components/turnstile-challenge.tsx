"use client";

import { useTurnstileChallenge } from "~/features/organization-registration/hooks/use-turnstile-challenge";
import type { TurnstileChallengeProperties } from "~/features/organization-registration/types/turnstile";
import {
  TURNSTILE_SCRIPT_URL,
  TURNSTILE_STATUS_MESSAGES,
} from "~/features/organization-registration/config/turnstile";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import Script from "next/script";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldTitle,
} from "@healthalyst/ui/components/field";

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
    <Field
      aria-describedby="registration-captcha-description"
      aria-labelledby="registration-captcha-title"
      role="group"
    >
      <FieldTitle id="registration-captcha-title">
        Human verification
      </FieldTitle>
      {siteKey ? (
        <>
          <Script
            id="cloudflare-turnstile-script"
            src={TURNSTILE_SCRIPT_URL}
            strategy="afterInteractive"
            onReady={() => setIsScriptReady(true)}
            onError={handleScriptError}
          />
          <div ref={containerReference} className="min-h-[65px]" />
          <FieldDescription
            id="registration-captcha-description"
            role={verificationStatus === "error" ? "alert" : "status"}
            aria-live={verificationStatus === "error" ? "assertive" : "polite"}
          >
            {statusMessage}
          </FieldDescription>
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
      ) : (
        <FieldError id="registration-captcha-description" role="alert">
          The human check is unavailable. Please try again later.
        </FieldError>
      )}
    </Field>
  );
}
