"use client";

import { useMutation } from "@tanstack/react-query";
import {
  confirmAuthenticator,
  startAuthenticatorSetup,
} from "@healthalyst/platform-api/authentication-service";

export function useAuthenticatorSetupMutation() {
  return useMutation({ mutationFn: startAuthenticatorSetup });
}

export function useAuthenticatorConfirmationMutation() {
  return useMutation({ mutationFn: confirmAuthenticator });
}
