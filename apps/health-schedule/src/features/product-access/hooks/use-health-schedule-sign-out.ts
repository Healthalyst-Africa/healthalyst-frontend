"use client";

import { useMutation } from "@tanstack/react-query";
import { signOut } from "@healthalyst/platform-api/authentication-service";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";

/** Ends the HealthAlyst session; the entry page then shows the sign-in options. */
export function useHealthScheduleSignOut() {
  const { clearPlatformSession } = usePlatformSession();
  return useMutation({
    mutationFn: signOut,
    onSuccess: clearPlatformSession,
  });
}
