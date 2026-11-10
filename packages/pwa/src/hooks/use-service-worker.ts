"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Serwist } from "@serwist/window";

/** Where every HealthAlyst app serves its built service worker. */
const SERVICE_WORKER_ADDRESS = "/serwist/sw.js";

export type ServiceWorkerState = {
  /**
   * A new version is waiting, or has already taken over from another tab and
   * this page needs a reload to use it.
   */
  isUpdateReady: boolean;
  isApplyingUpdate: boolean;
  /** Switches to the new version if it is still waiting, then reloads. */
  applyUpdate: () => void;
};

/**
 * Registers the app's service worker in production builds and reports when
 * a new version is ready. Development builds stay without one, so cached
 * files never hide code changes.
 */
export function useServiceWorker({
  enabled = process.env.NODE_ENV === "production",
  storeVisitedPages = false,
}: {
  enabled?: boolean;
  /**
   * Store each screen's page as it opens, including the first one, so it
   * reloads offline. Only products built to work offline turn this on.
   */
  storeVisitedPages?: boolean;
} = {}): ServiceWorkerState {
  const pathname = usePathname();
  const [activeServiceWorker, setActiveServiceWorker] =
    useState<Serwist | null>(null);
  const serviceWorkerReference = useRef<Serwist | null>(null);
  const registrationReference = useRef<ServiceWorkerRegistration | null>(null);
  const isApplyingUpdateReference = useRef(false);
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
    const handleControlling = (controllingEvent: { isUpdate?: boolean }) => {
      // This tab asked for the update: reload into the new version.
      if (isApplyingUpdateReference.current) {
        window.location.reload();
        return;
      }
      // Another tab applied it. This page still runs the old version, whose
      // files the new version no longer keeps, so offer a reload.
      if (controllingEvent.isUpdate) setIsUpdateReady(true);
    };

    serviceWorker.addEventListener("waiting", showUpdate);
    serviceWorker.addEventListener("controlling", handleControlling);
    void serviceWorker.register().then((registration) => {
      registrationReference.current = registration ?? null;
    });
    // Pages can only be stored once a worker is active to receive the request.
    void serviceWorker.active.then(() => setActiveServiceWorker(serviceWorker));
    return () => {
      serviceWorker.removeEventListener("waiting", showUpdate);
      serviceWorker.removeEventListener("controlling", handleControlling);
      serviceWorkerReference.current = null;
      registrationReference.current = null;
      setActiveServiceWorker(null);
    };
  }, [enabled]);

  useEffect(() => {
    if (!storeVisitedPages || !activeServiceWorker || !navigator.onLine) return;
    // The worker keeps responses only for requests that ask for HTML pages.
    const pageAddress = `${window.location.pathname}${window.location.search}`;
    void activeServiceWorker.messageSW({
      type: "CACHE_URLS",
      payload: {
        urlsToCache: [[pageAddress, { headers: { Accept: "text/html" } }]],
      },
    });
  }, [activeServiceWorker, pathname, storeVisitedPages]);

  const applyUpdate = useCallback(() => {
    isApplyingUpdateReference.current = true;
    setIsApplyingUpdate(true);
    const waitingWorker = registrationReference.current?.waiting;
    if (waitingWorker && serviceWorkerReference.current) {
      // Reloads in the `controlling` listener once the new version takes over.
      serviceWorkerReference.current.messageSkipWaiting();
      return;
    }
    // The new version is already in control; only this page is out of date.
    window.location.reload();
  }, []);

  return { isUpdateReady, isApplyingUpdate, applyUpdate };
}
