"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  restorePlatformSession,
  type PlatformSession,
} from "@healthalyst/platform-api/authentication-service";
import { PLATFORM_SESSION_SIGNALS } from "@healthalyst/platform-api/config";
import { clearPlatformSession as clearPlatformAccessCredential } from "@healthalyst/platform-api/http-client";

type PlatformSessionContextValue = {
  platformSession: PlatformSession | null;
  isRestoring: boolean;
  restoreError: Error | null;
  restoreSession: () => Promise<void>;
  clearPlatformSession: () => void;
};

const platformSessionContext =
  createContext<PlatformSessionContextValue | null>(null);

/**
 * Restores the HealthAlyst sign-in made in the organisation app. The access
 * token stays in the shared transport's memory; only the identity reaches
 * React state.
 */
export function PlatformSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const restorationRevisionReference = useRef(0);
  const [platformSession, updatePlatformSession] =
    useState<PlatformSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState<Error | null>(null);

  const restoreSession = useCallback(async () => {
    const restorationRevision = ++restorationRevisionReference.current;
    updatePlatformSession(null);
    setIsRestoring(true);
    setRestoreError(null);
    queryClient.clear();
    try {
      const restoredSession = await restorePlatformSession();
      if (restorationRevision !== restorationRevisionReference.current) return;
      updatePlatformSession(restoredSession);
    } catch (error) {
      if (restorationRevision !== restorationRevisionReference.current) return;
      // A 401 only means nobody is signed in.
      if (!(error instanceof PlatformApiError && error.status === 401)) {
        setRestoreError(
          error instanceof Error
            ? error
            : new Error("We could not restore your sign-in.")
        );
      }
    } finally {
      if (restorationRevision === restorationRevisionReference.current)
        setIsRestoring(false);
    }
  }, [queryClient]);

  const clearPlatformSession = useCallback(() => {
    clearPlatformAccessCredential();
    restorationRevisionReference.current += 1;
    setIsRestoring(false);
    setRestoreError(null);
    updatePlatformSession(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    function handleExpiredPlatformSession() {
      restorationRevisionReference.current += 1;
      updatePlatformSession(null);
      setRestoreError(null);
      setIsRestoring(false);
      queryClient.clear();
    }

    window.addEventListener(
      PLATFORM_SESSION_SIGNALS.expiredEvent,
      handleExpiredPlatformSession
    );
    window.addEventListener(
      PLATFORM_SESSION_SIGNALS.contextChangedEvent,
      restoreSession
    );
    return () => {
      window.removeEventListener(
        PLATFORM_SESSION_SIGNALS.contextChangedEvent,
        restoreSession
      );
      window.removeEventListener(
        PLATFORM_SESSION_SIGNALS.expiredEvent,
        handleExpiredPlatformSession
      );
    };
  }, [queryClient, restoreSession]);

  const contextValue = useMemo(
    () => ({
      platformSession,
      isRestoring,
      restoreError,
      restoreSession,
      clearPlatformSession,
    }),
    [
      platformSession,
      isRestoring,
      restoreError,
      restoreSession,
      clearPlatformSession,
    ]
  );

  return (
    <platformSessionContext.Provider value={contextValue}>
      {children}
    </platformSessionContext.Provider>
  );
}

export function usePlatformSession() {
  const contextValue = useContext(platformSessionContext);
  if (!contextValue) {
    throw new Error(
      "usePlatformSession must be used within a PlatformSessionProvider."
    );
  }
  return contextValue;
}
