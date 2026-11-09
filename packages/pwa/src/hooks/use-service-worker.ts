"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Serwist } from "@serwist/window";

/** Where every HealthAlyst app serves its built service worker. */
const SERVICE_WORKER_ADDRESS = "/serwist/sw.js";

export type ServiceWorkerState = {
  /** A new version is installed and waiting for the person to apply it. */
  isUpdateReady: boolean;
  isApplyingUpdate: boolean;
  /** Switches to the waiting version, then reloads once it is in control. */
  applyUpdate: () => void;
};

/**
 * Registers the app's service worker in production builds and reports when
 * a new version is waiting. Development builds stay without one, so cached
 * files never hide code changes.
 */
export function useServiceWorker({
  enabled = process.env.NODE_ENV === "production",
}: { enabled?: boolean } = {}): ServiceWorkerState {
  const serviceWorkerReference = useRef<Serwist | null>(null);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  useEffect(() => {
    if (!enabled || !("serviceWorker" in navigator)) return;
    const serviceWorker = new Serwist(SERVICE_WORKER_ADDRESS, {
      scope: "/",
      type: "classic",
    });
    serviceWorkerReference.current = serviceWorker;
    const showUpdate = () => setIsUpdateReady(true);
    serviceWorker.addEventListener("waiting", showUpdate);
    void serviceWorker.register();
    return () => {
      serviceWorker.removeEventListener("waiting", showUpdate);
      serviceWorkerReference.current = null;
    };
  }, [enabled]);

  const applyUpdate = useCallback(() => {
    const serviceWorker = serviceWorkerReference.current;
    if (!serviceWorker) return;
    setIsApplyingUpdate(true);
    serviceWorker.addEventListener("controlling", () =>
      window.location.reload()
    );
    serviceWorker.messageSkipWaiting();
  }, []);

  return { isUpdateReady, isApplyingUpdate, applyUpdate };
}
