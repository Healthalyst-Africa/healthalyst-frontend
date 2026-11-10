"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Whether the device reports a network connection. A device on Wi-Fi with
 * no internet still reports itself online, so requests must handle failure
 * as well; this drives the visible "you are offline" notice.
 */
export function useConnectionStatus(): { isOnline: boolean } {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    // Rendered on the server: assume online, so nothing flashes on load.
    () => true
  );
  return { isOnline };
}
