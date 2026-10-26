"use client";

import { useMutation } from "@tanstack/react-query";
import {
  resendEmailVerification,
  verifyPlatformEmailAddress,
} from "@healthalyst/platform-api/authentication-service";
export function useEmailVerificationResendMutation() {
  return useMutation({ mutationFn: resendEmailVerification });
}
export function useEmailVerificationMutation() {
  return useMutation({ mutationFn: verifyPlatformEmailAddress });
}
