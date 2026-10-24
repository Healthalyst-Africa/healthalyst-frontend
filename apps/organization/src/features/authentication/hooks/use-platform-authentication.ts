"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  changePassword,
  getPlatformSessions,
  regenerateRecoveryCodes,
  requestPasswordReset,
  resetPassword,
  revokePlatformSession,
  sendPhoneVerificationCode,
  signOutAllSessions,
  switchPlatformContext,
  verifyPhoneNumber,
  verifyStepUpCode,
  type SignInMethod,
} from "@healthalyst/platform-api/authentication-service";

export function usePlatformSessionsQuery({ userId }: { userId: string }) {
  return useQuery({
    queryKey: ["platform-sessions", userId],
    queryFn: getPlatformSessions,
    retry: false,
  });
}

export function useSignOutAllSessionsMutation() {
  return useMutation({
    mutationFn: signOutAllSessions,
  });
}

export function useRevokePlatformSessionMutation() {
  return useMutation({
    mutationFn: ({ sessionId }: { sessionId: string }) =>
      revokePlatformSession(sessionId),
  });
}

export function useRegenerateRecoveryCodesMutation() {
  return useMutation({
    mutationFn: regenerateRecoveryCodes,
  });
}

export function useStepUpVerificationMutation() {
  return useMutation({
    mutationFn: ({ code, method }: { code: string; method?: SignInMethod }) =>
      verifyStepUpCode({ code, method }),
  });
}

export function usePlatformContextSwitchMutation() {
  return useMutation({
    mutationFn: ({
      context,
    }: {
      context:
        { organizationId: string; branchId?: string } | { realm: "PLATFORM" };
    }) => switchPlatformContext(context),
  });
}

export function usePhoneVerificationCodeMutation() {
  return useMutation({
    mutationFn: ({ phoneNumber }: { phoneNumber: string }) =>
      sendPhoneVerificationCode(phoneNumber),
  });
}

export function usePhoneVerificationMutation() {
  return useMutation({
    mutationFn: ({ code }: { code: string }) => verifyPhoneNumber(code),
  });
}

export function usePasswordResetRequestMutation() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function usePasswordResetMutation() {
  return useMutation({ mutationFn: resetPassword });
}

export function usePasswordChangeMutation() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changePassword({ currentPassword, newPassword }),
  });
}
