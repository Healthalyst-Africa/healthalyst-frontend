"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { decideInstallOffer, type InstallOffer } from "../install-offer";

/** Remembers "Not now" on this device only; it holds no personal data. */
const DISMISSAL_STORAGE_KEY = "healthalyst-install-offer-dismissed-at";

/** How long "Not now" lasts before the offer may show again. */
const DISMISSAL_DAYS = 14;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Chrome's install event; not yet in TypeScript's DOM types. */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function readWasDismissedRecently(): boolean {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSAL_STORAGE_KEY));
    return (
      Number.isFinite(dismissedAt) &&
      Date.now() - dismissedAt < DISMISSAL_DAYS * MILLISECONDS_PER_DAY
    );
  } catch {
    // Storage can be blocked, for example in private browsing.
    return false;
  }
}

function rememberDismissal(): void {
  try {
    localStorage.setItem(DISMISSAL_STORAGE_KEY, String(Date.now()));
  } catch {
    // Without storage the offer simply returns on the next visit.
  }
}

function readIsInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari on iOS reports a home-screen app here instead.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type InstallOfferState = {
  offer: InstallOffer;
  isInstalling: boolean;
  /** Opens the browser's install dialog; only for `install-button`. */
  install: () => void;
  /** Hides the offer on this device for a while. */
  dismiss: () => void;
};

/**
 * Offers installing the app in the way this browser allows, until it is
 * installed or the person chooses "Not now".
 */
export function useInstallOffer({
  enabled,
}: {
  enabled: boolean;
}): InstallOfferState {
  const installPromptReference = useRef<InstallPromptEvent | null>(null);
  const [offer, setOffer] = useState<InstallOffer>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  const updateOffer = useCallback(() => {
    setOffer(
      decideInstallOffer({
        isInstalled: readIsInstalled(),
        hasInstallPrompt: installPromptReference.current !== null,
        userAgent: navigator.userAgent,
        maximumTouchPoints: navigator.maxTouchPoints,
        wasDismissedRecently: readWasDismissedRecently(),
      })
    );
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const keepInstallPrompt = (installEvent: Event) => {
      // Stop the browser's own mini prompt; the app shows its own button.
      installEvent.preventDefault();
      installPromptReference.current = installEvent as InstallPromptEvent;
      updateOffer();
    };
    const forgetInstallPrompt = () => {
      installPromptReference.current = null;
      updateOffer();
    };
    window.addEventListener("beforeinstallprompt", keepInstallPrompt);
    window.addEventListener("appinstalled", forgetInstallPrompt);
    updateOffer();
    return () => {
      window.removeEventListener("beforeinstallprompt", keepInstallPrompt);
      window.removeEventListener("appinstalled", forgetInstallPrompt);
    };
  }, [enabled, updateOffer]);

  const install = useCallback(() => {
    const installPrompt = installPromptReference.current;
    if (!installPrompt) return;
    setIsInstalling(true);
    void installPrompt
      .prompt()
      .then(() => installPrompt.userChoice)
      .then(({ outcome }) => {
        // The browser allows each prompt event to be used only once.
        installPromptReference.current = null;
        if (outcome === "dismissed") rememberDismissal();
      })
      .finally(() => {
        setIsInstalling(false);
        updateOffer();
      });
  }, [updateOffer]);

  const dismiss = useCallback(() => {
    rememberDismissal();
    updateOffer();
  }, [updateOffer]);

  return { offer: enabled ? offer : null, isInstalling, install, dismiss };
}
