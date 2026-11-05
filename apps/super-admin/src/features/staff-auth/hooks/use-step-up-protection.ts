"use client";

import { useState } from "react";
import {
  isStepUpRequiredError,
  useStepUpVerification,
} from "~/features/staff-auth/hooks/use-step-up-verification";

type ProtectedAction = {
  /** Completes "For security, enter a code from your authenticator app to …". */
  description: string;
  run: () => Promise<unknown>;
};

/**
 * Runs actions the API protects with a recent authenticator check. When the
 * API asks for one, the staff member enters a code and the action is sent
 * again. Other failures stay with the action's own mutation.
 */
export function useStepUpProtection() {
  const stepUpVerification = useStepUpVerification();
  const [pendingAction, setPendingAction] = useState<ProtectedAction | null>(
    null
  );
  const [isCompletingAction, setIsCompletingAction] = useState(false);

  function close() {
    setPendingAction(null);
    stepUpVerification.reset();
  }

  /** Resolves to true when the action finished without needing a code. */
  async function runProtected(action: ProtectedAction): Promise<boolean> {
    try {
      await action.run();
      return true;
    } catch (error) {
      if (isStepUpRequiredError(error)) {
        stepUpVerification.reset();
        setPendingAction(action);
      }
      return false;
    }
  }

  /** Checks the code, then sends the waiting action again. */
  async function confirm() {
    if (!pendingAction) return;
    if (!(await stepUpVerification.verify())) return;
    setIsCompletingAction(true);
    try {
      await pendingAction.run();
    } catch {
      // The action's own mutation shows the failure.
    } finally {
      setIsCompletingAction(false);
      close();
    }
  }

  function cancel() {
    if (stepUpVerification.isVerifying || isCompletingAction) return;
    close();
  }

  return {
    runProtected,
    /** True while the code dialog is open, so other dialogs can wait. */
    isAwaitingCode: pendingAction !== null,
    dialog: {
      open: pendingAction !== null,
      actionDescription: pendingAction?.description ?? "",
      method: stepUpVerification.method,
      code: stepUpVerification.code,
      error: stepUpVerification.error,
      isVerifying: stepUpVerification.isVerifying,
      isCompletingAction,
      onCodeChange: stepUpVerification.updateCode,
      onMethodToggle: stepUpVerification.toggleMethod,
      onCancel: cancel,
      onSubmit: () => void confirm(),
    },
  };
}
