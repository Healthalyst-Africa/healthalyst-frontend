"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PlatformSession } from "~/features/organization-onboarding/api/platform-authentication-service";

type PlatformSessionContextValue = {
  platformSession: PlatformSession | null;
  setPlatformSession: (platformSession: PlatformSession) => void;
  clearPlatformSession: () => void;
};

const platformSessionContext =
  createContext<PlatformSessionContextValue | null>(null);

export function PlatformSessionProvider({ children }: { children: ReactNode }) {
  const [platformSession, updatePlatformSession] =
    useState<PlatformSession | null>(null);
  const contextValue = useMemo(
    () => ({
      platformSession,
      setPlatformSession: updatePlatformSession,
      clearPlatformSession: () => updatePlatformSession(null),
    }),
    [platformSession]
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
