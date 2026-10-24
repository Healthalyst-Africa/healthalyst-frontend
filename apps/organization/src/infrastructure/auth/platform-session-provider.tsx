"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PLATFORM_SESSION_SIGNALS } from "@healthalyst/platform-api/config";
import { useQueryClient } from "@tanstack/react-query";
import {
  restorePlatformSession,
  type PlatformSession,
} from "@healthalyst/platform-api/authentication-service";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";

type PlatformSessionContextValue = {
  platformSession: PlatformSession | null;
  isRestoring: boolean;
  restoreError: Error | null;
  restoreSession: () => Promise<void>;
  setPlatformSession: (nextPlatformSession: PlatformSession) => void;
  clearPlatformSession: () => void;
};

const platformSessionContext =
  createContext<PlatformSessionContextValue | null>(null);

export function PlatformSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [platformSession, updatePlatformSession] =
    useState<PlatformSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState<Error | null>(null);

  const restoreSession = useCallback(async () => {
    setIsRestoring(true);
    setRestoreError(null);
    queryClient.clear();
    try {
      const restoredSession = await restorePlatformSession();
      setRestoreError(null);
      updatePlatformSession(restoredSession);
    } catch (error) {
      updatePlatformSession(null);
      if (!(error instanceof PlatformApiError && error.status === 401)) {
        setRestoreError(
          error instanceof Error
            ? error
            : new Error("We could not restore your sign-in.")
        );
      }
    } finally {
      setIsRestoring(false);
    }
  }, [queryClient]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    function handleExpiredPlatformSession() {
      updatePlatformSession(null);
      setRestoreError(null);
      setIsRestoring(false);
      queryClient.clear();
    }

    window.addEventListener(
      PLATFORM_SESSION_SIGNALS.expiredEvent,
      handleExpiredPlatformSession
    );
    return () => {
      window.removeEventListener(
        PLATFORM_SESSION_SIGNALS.expiredEvent,
        handleExpiredPlatformSession
      );
    };
  }, [queryClient]);

  const setPlatformSession = useCallback(
    (nextPlatformSession: PlatformSession) => {
      const currentContext = platformSession?.activeContext;
      const nextContext = nextPlatformSession.activeContext;
      const sessionScopeChanged =
        platformSession !== null &&
        (platformSession.user.id !== nextPlatformSession.user.id ||
          currentContext?.realm !== nextContext.realm ||
          currentContext?.organizationId !== nextContext.organizationId ||
          currentContext?.branchId !== nextContext.branchId);
      if (sessionScopeChanged) queryClient.clear();
      setRestoreError(null);
      updatePlatformSession(nextPlatformSession);
    },
    [platformSession, queryClient]
  );

  const clearPlatformSession = useCallback(() => {
    setRestoreError(null);
    updatePlatformSession(null);
    queryClient.clear();
  }, [queryClient]);

  const contextValue = useMemo(
    () => ({
      platformSession,
      isRestoring,
      restoreError,
      restoreSession,
      setPlatformSession,
      clearPlatformSession,
    }),
    [
      platformSession,
      isRestoring,
      restoreError,
      restoreSession,
      setPlatformSession,
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
