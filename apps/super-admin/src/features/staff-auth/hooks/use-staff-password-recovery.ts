"use client";

import { useMutation } from "@tanstack/react-query";
import {
  requestPasswordReset,
  resetPassword,
} from "@healthalyst/platform-api/authentication-service";

export function useStaffPasswordResetRequestMutation() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useStaffPasswordResetMutation() {
  return useMutation({ mutationFn: resetPassword });
}
