"use client";

import { useMutation } from "@tanstack/react-query";
import {
  registerOrganizationOnPlatform,
  resendEmailVerification,
  verifyPlatformEmailAddress,
} from "../api/platform-onboarding-service";

export function useOrganizationRegistrationMutation() {
  return useMutation({ mutationFn: registerOrganizationOnPlatform });
}

export function useEmailVerificationResendMutation() {
  return useMutation({ mutationFn: resendEmailVerification });
}

export function useEmailVerificationMutation() {
  return useMutation({ mutationFn: verifyPlatformEmailAddress });
}
