"use client";

import { useMutation } from "@tanstack/react-query";
import {
  confirmAuthenticator,
  startAuthenticatorSetup,
  type AuthenticatorConfirmationRequest,
} from "@healthalyst/platform-api/authentication-service";

export function useAuthenticatorSetupMutation(enrolmentToken: string) {
  return useMutation({
    mutationFn: () => startAuthenticatorSetup(enrolmentToken),
  });
}

export function useAuthenticatorConfirmationMutation(enrolmentToken: string) {
  return useMutation({
    mutationFn: (confirmation: AuthenticatorConfirmationRequest) =>
      confirmAuthenticator({ ...confirmation, enrolmentToken }),
  });
}
