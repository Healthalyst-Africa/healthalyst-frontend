"use client";

import { useEffect, useRef } from "react";
import {
  useAuthenticatorConfirmationMutation,
  useAuthenticatorSetupMutation,
} from "~/features/authentication/hooks/use-authenticator-enrolment";
import { isExpiredEnrolment } from "~/features/authentication/utilities/authenticator-enrolment";
export function useAuthenticatorEnrolmentWorkflow() {
  const hasStartedSetupReference = useRef(false);
  const setupMutation = useAuthenticatorSetupMutation();
  const confirmationMutation = useAuthenticatorConfirmationMutation();
  const setup = setupMutation.data;

  useEffect(() => {
    // Each setup call creates a new factor, so it must run once: React runs
    // effects twice in development.
    if (hasStartedSetupReference.current) return;
    hasStartedSetupReference.current = true;
    setupMutation.mutate();
  }, [setupMutation]);

  return {
    setup,
    setupMutation,
    confirmationMutation,
    isExpired:
      isExpiredEnrolment(setupMutation.error) ||
      isExpiredEnrolment(confirmationMutation.error),
  };
}
