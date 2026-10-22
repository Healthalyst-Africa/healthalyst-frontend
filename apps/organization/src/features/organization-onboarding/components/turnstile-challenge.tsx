"use client";

import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import Script from "next/script";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldTitle,
} from "@healthalyst/ui/components/field";

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (responseToken: string) => void;
  "error-callback": () => boolean;
  "expired-callback": () => void;
  "timeout-callback": () => void;
  retry: "auto" | "never";
  "refresh-expired": "auto" | "manual" | "never";
  "refresh-timeout": "auto" | "manual" | "never";
};

type TurnstileApi = {
  render: (
    containerElement: HTMLElement,
    renderOptions: TurnstileRenderOptions
  ) => string;
  reset: (widgetIdentifier: string) => void;
  remove: (widgetIdentifier: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileChallengeProperties = {
  onResponseTokenChange: (responseToken: string | null) => void;
  siteKey: string | undefined;
};

type VerificationStatus =
  "loading" | "ready" | "complete" | "expired" | "error";

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export default function TurnstileChallenge({
  onResponseTokenChange,
  siteKey,
}: TurnstileChallengeProperties) {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("loading");
  const containerReference = useRef<HTMLDivElement>(null);
  const widgetIdentifierReference = useRef<string | null>(null);

  useEffect(() => {
    const containerElement = containerReference.current;

    if (!siteKey || !isScriptReady || !containerElement) {
      return;
    }

    const turnstileApi = window.turnstile;
    if (!turnstileApi) {
      setVerificationStatus("error");
      onResponseTokenChange(null);
      return;
    }

    // Retries and refreshes wait for the person to ask. Turnstile's automatic
    // retry repeats the whole challenge every few seconds after a failure,
    // such as a site key that does not allow this hostname, which floods the
    // browser's network log and hides the registration requests.
    const widgetIdentifier = turnstileApi.render(containerElement, {
      sitekey: siteKey,
      retry: "never",
      "refresh-expired": "manual",
      "refresh-timeout": "manual",
      callback: (responseToken) => {
        setVerificationStatus("complete");
        onResponseTokenChange(responseToken);
      },
      "expired-callback": () => {
        setVerificationStatus("expired");
        onResponseTokenChange(null);
      },
      "timeout-callback": () => {
        setVerificationStatus("expired");
        onResponseTokenChange(null);
      },
      "error-callback": () => {
        setVerificationStatus("error");
        onResponseTokenChange(null);
        return true;
      },
    });
    widgetIdentifierReference.current = widgetIdentifier;

    setVerificationStatus("ready");

    return () => {
      window.turnstile?.remove(widgetIdentifier);
      widgetIdentifierReference.current = null;
    };
  }, [isScriptReady, onResponseTokenChange, siteKey]);

  function restartChallenge() {
    const widgetIdentifier = widgetIdentifierReference.current;
    if (!widgetIdentifier || !window.turnstile) {
      return;
    }
    window.turnstile.reset(widgetIdentifier);
    setVerificationStatus("ready");
  }

  const canRestartChallenge =
    verificationStatus === "expired" ||
    (verificationStatus === "error" && widgetIdentifierReference.current);

  const statusMessage = (() => {
    switch (verificationStatus) {
      case "loading":
        return "Loading the human check…";
      case "ready":
        return "Complete the human check to continue.";
      case "complete":
        return "Human check complete.";
      case "expired":
        return "The human check expired. Check again to continue.";
      case "error":
        return "The human check could not be completed. Check again, or refresh the page if it keeps failing.";
    }
  })();

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
            onError={() => {
              setVerificationStatus("error");
              onResponseTokenChange(null);
            }}
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
