"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { clearPlatformSession as clearPlatformAccessCredential } from "@healthalyst/platform-api/http-client";
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
      setRestoreError(null);
      updatePlatformSession(restoredSession);
    } catch (error) {
      if (restorationRevision !== restorationRevisionReference.current) return;
      updatePlatformSession(null);
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

  const setPlatformSession = useCallback(
    (nextPlatformSession: PlatformSession) => {
      restorationRevisionReference.current += 1;
      setIsRestoring(false);
      const currentContext = platformSession?.activeContext;
      const nextContext = nextPlatformSession.activeContext;
      const sessionScopeChanged =
        platformSession?.user.id !== nextPlatformSession.user.id ||
        currentContext?.realm !== nextContext.realm ||
        currentContext?.organizationId !== nextContext.organizationId ||
        currentContext?.branchId !== nextContext.branchId;
      if (sessionScopeChanged) queryClient.clear();
      setRestoreError(null);
      updatePlatformSession(nextPlatformSession);
    },
    [platformSession, queryClient]
  );

  const clearPlatformSession = useCallback(() => {
    clearPlatformAccessCredential();
    restorationRevisionReference.current += 1;
    setIsRestoring(false);
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
