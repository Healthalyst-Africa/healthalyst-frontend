"use client";

import { useState } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import type { StepUpMethod } from "@healthalyst/ui/components/step-up-dialog";
import { STEP_UP_REQUIRED_ERROR_CODE } from "~/features/account-security/config/account-security";
import { useStepUpVerificationMutation } from "~/features/authentication/hooks/use-platform-authentication";
import {
  authenticatorCodeSchema,
  recoveryCodeSchema,
} from "~/features/authentication/schemas/sign-in-schema";

export function isStepUpRequiredError(error: unknown): boolean {
  return (
    error instanceof PlatformApiError &&
    error.code === STEP_UP_REQUIRED_ERROR_CODE
  );
}

type ProtectedAction = {
  /** What the code confirms, such as "change your password". */
  description: string;
  run: () => Promise<unknown>;
};

/**
 * Runs actions the API protects with a recent authenticator check. When the
 * API asks for one, the person enters a code and the action is sent again.
 * Other failures stay with the action's own mutation.
 */
export function useStepUpProtection() {
  const [pendingAction, setPendingAction] = useState<ProtectedAction | null>(
    null
  );
  const [isCompletingAction, setIsCompletingAction] = useState(false);
  const [method, setMethod] = useState<StepUpMethod>("totp");
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState("");
  const verificationMutation = useStepUpVerificationMutation();

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

  function close() {
    setPendingAction(null);
    setMethod("totp");
    updateCode("");
  }

  /** Resolves to true when the action finished without needing a code. */
  async function runProtected(action: ProtectedAction): Promise<boolean> {
    try {
      await action.run();
      return true;
    } catch (error) {
      if (isStepUpRequiredError(error)) setPendingAction(action);
      return false;
    }
  }

  /** Checks the code, then sends the waiting action again. */
  async function confirm(): Promise<boolean> {
    if (!pendingAction) return false;
    const schema =
      method === "totp" ? authenticatorCodeSchema : recoveryCodeSchema;
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
    } catch {
      return false;
    }
    setIsCompletingAction(true);
    try {
      await pendingAction.run();
      return true;
    } catch {
      // The action's own mutation shows the failure.
      return false;
    } finally {
      setIsCompletingAction(false);
      close();
    }
  }

  function cancel() {
    if (verificationMutation.isPending || isCompletingAction) return;
    close();
  }

  return {
    runProtected,
    dialog: {
      open: pendingAction !== null,
      actionDescription: pendingAction?.description ?? "",
      method,
      code,
      error: fieldError || verificationMutation.error?.message || "",
      isVerifying: verificationMutation.isPending,
      isCompletingAction,
      onCodeChange: updateCode,
      onMethodToggle: toggleMethod,
      onCancel: cancel,
      onSubmit: () => void confirm(),
    },
  };
}
