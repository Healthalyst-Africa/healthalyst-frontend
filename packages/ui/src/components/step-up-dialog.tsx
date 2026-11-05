"use client";

import type { FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { OneTimeCodeField } from "@healthalyst/ui/components/one-time-code-field";
import { TextField } from "@healthalyst/ui/components/text-field";

type StepUpMethod = "totp" | "recovery_code";

type StepUpDialogProperties = {
  open: boolean;
  /** What the code confirms, such as "approve this organisation". */
  actionDescription: string;
  method: StepUpMethod;
  code: string;
  error?: string;
  isVerifying: boolean;
  /** True while the protected action is sent again after a successful check. */
  isCompletingAction?: boolean;
  /** Shown on the confirm button while the protected action is sent again. */
  completingLabel?: string;
  authenticatorCodeLength: number;
  recoveryCodeMaximumLength: number;
  onCodeChange: (code: string) => void;
  onMethodToggle: () => void;
  onCancel: () => void;
  onSubmit: () => void;
};

/** Asks for an authenticator or recovery code before a sensitive action. */
export function StepUpDialog({
  open,
  actionDescription,
  method,
  code,
  error,
  isVerifying,
  isCompletingAction = false,
  completingLabel = "Saving",
  authenticatorCodeLength,
  recoveryCodeMaximumLength,
  onCodeChange,
  onMethodToggle,
  onCancel,
  onSubmit,
}: StepUpDialogProperties) {
  const isBusy = isVerifying || isCompletingAction;

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    onSubmit();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !isBusy && onCancel()}
      title="Confirm it is you"
      description={`For security, enter a code from your authenticator app to ${actionDescription}.`}
      submitLabel="Confirm"
      submittingLabel={isCompletingAction ? completingLabel : "Checking code"}
      isSubmitting={isBusy}
      onSubmit={handleSubmit}
    >
      {method === "totp" ? (
        <OneTimeCodeField
          id="step-up-authenticator-code"
          label="Authenticator code"
          length={authenticatorCodeLength}
          required
          autoFocus
          value={code}
          disabled={isBusy}
          error={error}
          onChange={onCodeChange}
        />
      ) : (
        <TextField
          id="step-up-recovery-code"
          label="Recovery code"
          autoComplete="one-time-code"
          required
          autoFocus
          maxLength={recoveryCodeMaximumLength}
          value={code}
          disabled={isBusy}
          error={error}
          onChange={(changeEvent) => onCodeChange(changeEvent.target.value)}
        />
      )}
      <ActionButton
        className="self-start px-0 font-normal"
        size="small"
        type="button"
        variant="link"
        disabled={isBusy}
        onClick={onMethodToggle}
      >
        {method === "totp"
          ? "Use a recovery code instead"
          : "Use an authenticator code instead"}
      </ActionButton>
    </FormDialog>
  );
}

export type { StepUpDialogProperties, StepUpMethod };
