"use client";

import { useMutation } from "@tanstack/react-query";
import {
  confirmEmailAddress,
  resendEmailVerification,
} from "../api/accounts-service";

export function useConfirmEmailAddressMutation() {
  return useMutation({ mutationFn: confirmEmailAddress });
}

export function useResendEmailVerificationMutation() {
  return useMutation({ mutationFn: resendEmailVerification });
}
