"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  getCurrentStaffIdentity,
  type StaffIdentity,
} from "~/features/staff-auth/api/staff-service";

type StaffSessionStatus =
  "loading" | "authenticated" | "unauthenticated" | "error";

type StaffSessionContextValue = {
  staffIdentity: StaffIdentity | null;
  status: StaffSessionStatus;
  sessionError: string | null;
  setStaffIdentity: (staffIdentity: StaffIdentity) => void;
  clearSession: () => void;
  restoreSession: () => Promise<void>;
};

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

  const restoreSession = useCallback(async () => {
    setStatus("loading");
    setSessionError(null);
    try {
      const restoredStaffIdentity = await getCurrentStaffIdentity();
      updateStaffIdentity(restoredStaffIdentity);
      setStatus("authenticated");
    } catch (error) {
      updateStaffIdentity(null);
      if (
        (error instanceof PlatformApiError && error.status === 401) ||
        (isAxiosError(error) && error.response?.status === 401)
      ) {
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
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    function handleExpiredStaffSession() {
      updateStaffIdentity(null);
      setSessionError(null);
      setStatus("unauthenticated");
      queryClient.clear();
    }

    window.addEventListener(
      "healthalyst-platform-session-expired",
      handleExpiredStaffSession
    );
    return () => {
      window.removeEventListener(
        "healthalyst-platform-session-expired",
        handleExpiredStaffSession
      );
    };
  }, [queryClient]);

  function setStaffIdentity(nextStaffIdentity: StaffIdentity) {
    updateStaffIdentity(nextStaffIdentity);
    setSessionError(null);
    setStatus("authenticated");
  }

  function clearSession() {
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
