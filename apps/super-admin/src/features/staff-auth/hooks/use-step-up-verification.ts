"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { verifyStepUpCode } from "@healthalyst/platform-api/authentication-service";
import {
  staffAuthenticatorCodeSchema,
  staffRecoveryCodeSchema,
} from "~/features/staff-auth/schemas/staff-sign-in-schema";

/** The Platform API's error code when an action needs a recent authenticator check. */
export const STEP_UP_REQUIRED_ERROR_CODE = "AUTH_STEP_UP_REQUIRED";

export type StepUpMethod = "totp" | "recovery_code";

export function isStepUpRequiredError(error: unknown): boolean {
  return (
    error instanceof PlatformApiError &&
    error.code === STEP_UP_REQUIRED_ERROR_CODE
  );
}

/**
 * Confirms the signed-in staff member again with an authenticator or
 * recovery code. A successful check replaces the access token, so the
 * protected request can be sent again.
 */
export function useStepUpVerification() {
  const [method, setMethod] = useState<StepUpMethod>("totp");
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState("");
  const verificationMutation = useMutation({ mutationFn: verifyStepUpCode });

  function updateCode(nextCode: string) {
    setCode(nextCode);
    setFieldError("");
    verificationMutation.reset();
  }

  function toggleMethod() {
    setMethod((currentMethod) =>
      currentMethod === "totp" ? "recovery_code" : "totp"
    );
    updateCode("");
  }

  function reset() {
    setMethod("totp");
    updateCode("");
  }

  /** Resolves to true once the code is accepted. */
  async function verify(): Promise<boolean> {
    const schema =
      method === "totp"
        ? staffAuthenticatorCodeSchema
        : staffRecoveryCodeSchema;
    const result = schema.safeParse({ code });
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? "Enter your code.");
      return false;
    }
    try {
      await verificationMutation.mutateAsync({
        code: result.data.code,
        method,
      });
      return true;
    } catch {
      return false;
    }
  }

  return {
    method,
    code,
    error: fieldError || verificationMutation.error?.message || "",
    isVerifying: verificationMutation.isPending,
    updateCode,
    toggleMethod,
    reset,
    verify,
  };
}
