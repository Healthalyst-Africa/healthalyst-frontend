"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clearPlatformSession } from "@healthalyst/platform-api/http-client";
import { PLATFORM_SESSION_SIGNALS } from "@healthalyst/platform-api/config";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { getCurrentStaffIdentity } from "~/features/staff-auth/services/staff-service";

import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

import type {
  StaffSessionContextValue,
  StaffSessionStatus,
} from "~/infrastructure/auth/staff-session-types";

const StaffSessionContext = createContext<StaffSessionContextValue | null>(
  null
);

export function StaffSessionProvider({ children }: { children: ReactNode }) {
  const [staffIdentity, updateStaffIdentity] = useState<StaffIdentity | null>(
    null
  );
  const [status, setStatus] = useState<StaffSessionStatus>("loading");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const restorationRevisionReference = useRef(0);

  const restoreSession = useCallback(async () => {
    const restorationRevision = ++restorationRevisionReference.current;
    updateStaffIdentity(null);
    queryClient.clear();
    setStatus("loading");
    setSessionError(null);
    try {
      const restoredStaffIdentity = await getCurrentStaffIdentity();
      if (restorationRevision !== restorationRevisionReference.current) return;
      updateStaffIdentity(restoredStaffIdentity);
      setStatus("authenticated");
    } catch (error) {
      if (restorationRevision !== restorationRevisionReference.current) return;
      updateStaffIdentity(null);
      if (
        error instanceof PlatformApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        if (error.status === 403) setSessionError(error.message);
        setStatus("unauthenticated");
        return;
      }
      setSessionError(
        error instanceof Error
          ? error.message
          : "We could not check your staff session. Try again."
      );
      setStatus("error");
    }
  }, [queryClient]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    function handleExpiredStaffSession() {
      restorationRevisionReference.current += 1;
      updateStaffIdentity(null);
      setSessionError(null);
      setStatus("unauthenticated");
      queryClient.clear();
    }

    window.addEventListener(
      PLATFORM_SESSION_SIGNALS.expiredEvent,
      handleExpiredStaffSession
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
        handleExpiredStaffSession
      );
    };
  }, [queryClient, restoreSession]);

  function setStaffIdentity(nextStaffIdentity: StaffIdentity) {
    restorationRevisionReference.current += 1;
    if (staffIdentity?.staffAccountId !== nextStaffIdentity.staffAccountId)
      queryClient.clear();
    updateStaffIdentity(nextStaffIdentity);
    setSessionError(null);
    setStatus("authenticated");
  }

  function clearSession() {
    clearPlatformSession();
    restorationRevisionReference.current += 1;
    updateStaffIdentity(null);
    setSessionError(null);
    setStatus("unauthenticated");
    queryClient.clear();
  }
  return (
    <StaffSessionContext.Provider
      value={{
        staffIdentity,
        status,
        sessionError,
        setStaffIdentity,
        clearSession,
        restoreSession,
      }}
    >
      {children}
    </StaffSessionContext.Provider>
  );
}

export function useStaffSession(): StaffSessionContextValue {
  const context = useContext(StaffSessionContext);
  if (!context) throw new Error("StaffSessionProvider is missing.");
  return context;
}
