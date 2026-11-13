"use client";

import { useEffect, useRef, useState } from "react";
import type {
  TurnstileChallengeProperties,
  TurnstileFailure,
  VerificationStatus,
} from "~/features/organization-registration/types/turnstile";
import {
  TURNSTILE_AUTOMATIC_RETRY,
  TURNSTILE_RENDER_CONFIGURATION,
} from "~/features/organization-registration/config/turnstile";
import {
  canRetryTurnstileFailure,
  classifyTurnstileFailure,
} from "~/features/organization-registration/utilities/turnstile-failure";

export function useTurnstileChallenge({
  onResponseTokenChange,
  siteKey,
}: TurnstileChallengeProperties) {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("loading");
  const [failure, setFailure] = useState<TurnstileFailure | null>(null);
  const containerReference = useRef<HTMLDivElement>(null);
  const widgetIdentifierReference = useRef<string | null>(null);
  const automaticRetryCountReference = useRef(0);

  useEffect(() => {
    const containerElement = containerReference.current;

    if (!siteKey || !isScriptReady || !containerElement) {
      return;
    }

    const turnstileClient = window.turnstile;
    if (!turnstileClient) {
      setFailure({ kind: "blocked" });
      setVerificationStatus("error");
      onResponseTokenChange(null);
      return;
    }

    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    // Turnstile's own retry repeats the challenge every few seconds without
    // end, even when a retry cannot help, such as a site key that does not
    // allow this hostname. That floods the browser's network log, so failed
    // challenges run again here a limited number of times instead.
    const widgetIdentifier = turnstileClient.render(containerElement, {
      sitekey: siteKey,
      ...TURNSTILE_RENDER_CONFIGURATION,
      callback: (responseToken) => {
        automaticRetryCountReference.current = 0;
        setFailure(null);
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
      "error-callback": (errorCode) => {
        onResponseTokenChange(null);
        const currentFailure: TurnstileFailure = {
          kind: classifyTurnstileFailure(errorCode),
          errorCode,
        };
        if (
          canRetryTurnstileFailure(currentFailure) &&
          automaticRetryCountReference.current <
            TURNSTILE_AUTOMATIC_RETRY.attemptLimit
        ) {
          automaticRetryCountReference.current += 1;
          setVerificationStatus("retrying");
          retryTimeout = setTimeout(
            () => window.turnstile?.reset(widgetIdentifier),
            TURNSTILE_AUTOMATIC_RETRY.delayMilliseconds
          );
          return true;
        }
        setFailure(currentFailure);
        setVerificationStatus("error");
        return true;
      },
    });
    widgetIdentifierReference.current = widgetIdentifier;

    setVerificationStatus("ready");

    return () => {
      clearTimeout(retryTimeout);
      window.turnstile?.remove(widgetIdentifier);
      widgetIdentifierReference.current = null;
    };
  }, [isScriptReady, onResponseTokenChange, siteKey]);

  function restartChallenge() {
    const widgetIdentifier = widgetIdentifierReference.current;
    if (!widgetIdentifier || !window.turnstile) {
      return;
    }
    automaticRetryCountReference.current = 0;
    window.turnstile.reset(widgetIdentifier);
    setFailure(null);
    setVerificationStatus("ready");
  }

  // Checking again cannot help when the site key does not allow this address.
  const canRestartChallenge =
    verificationStatus === "expired" ||
    (verificationStatus === "error" &&
      failure?.kind !== "site-not-allowed" &&
      Boolean(widgetIdentifierReference.current));

  function handleScriptError() {
    setFailure({ kind: "blocked" });
    setVerificationStatus("error");
    onResponseTokenChange(null);
  }

  return {
    setIsScriptReady,
    verificationStatus,
    failure,
    containerReference,
    restartChallenge,
    canRestartChallenge,
    handleScriptError,
  };
}
