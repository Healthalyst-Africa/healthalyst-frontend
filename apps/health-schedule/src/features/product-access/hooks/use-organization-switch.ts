"use client";

import { useMutation } from "@tanstack/react-query";
import { switchPlatformContext } from "@healthalyst/platform-api/authentication-service";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";

/**
 * Moves the HealthAlyst session to another of the person's organisations.
 * Restoring the session afterwards lets the entry page decide whether that
 * organisation has HealthSchedule.
 */
export function useOrganizationSwitch() {
  const { restoreSession } = usePlatformSession();
  return useMutation({
    mutationFn: (organizationId: string) =>
      switchPlatformContext({ organizationId }),
    onSuccess: restoreSession,
  });
}
