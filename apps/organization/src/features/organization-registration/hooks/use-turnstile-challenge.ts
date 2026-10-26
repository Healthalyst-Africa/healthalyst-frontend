"use client";

import { useEffect, useRef, useState } from "react";
import type {
  TurnstileChallengeProperties,
  VerificationStatus,
} from "~/features/organization-registration/types/turnstile";
import { TURNSTILE_RENDER_CONFIGURATION } from "~/features/organization-registration/config/turnstile";
export function useTurnstileChallenge({
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

    const turnstileClient = window.turnstile;
    if (!turnstileClient) {
      setVerificationStatus("error");
      onResponseTokenChange(null);
      return;
    }

    // Retries and refreshes wait for the person to ask. Turnstile's automatic
    // retry repeats the whole challenge every few seconds after a failure,
    // such as a site key that does not allow this hostname, which floods the
    // browser's network log and hides the registration requests.
    const widgetIdentifier = turnstileClient.render(containerElement, {
      sitekey: siteKey,
      ...TURNSTILE_RENDER_CONFIGURATION,
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

  function handleScriptError() {
    setVerificationStatus("error");
    onResponseTokenChange(null);
  }
  return {
    setIsScriptReady,
    verificationStatus,
    containerReference,
    restartChallenge,
    canRestartChallenge,
    handleScriptError,
  };
}
