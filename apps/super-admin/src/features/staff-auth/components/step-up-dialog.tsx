"use client";

import type { FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { OneTimeCodeField } from "@healthalyst/ui/components/one-time-code-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { STAFF_AUTHENTICATOR_CONFIGURATION } from "~/features/staff-auth/config/staff-sign-in";
import type { useStepUpVerification } from "~/features/staff-auth/hooks/use-step-up-verification";

type StepUpDialogProperties = {
  open: boolean;
  /** What the code confirms, such as "approve this organisation". */
  actionDescription: string;
  verification: ReturnType<typeof useStepUpVerification>;
  /** True while the protected action is sent again after a successful check. */
  isCompletingAction?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

/** Asks for an authenticator or recovery code before a sensitive action. */
export function StepUpDialog({
  open,
  actionDescription,
  verification,
  isCompletingAction = false,
  onCancel,
  onSubmit,
}: StepUpDialogProperties) {
  const isBusy = verification.isVerifying || isCompletingAction;

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
      submittingLabel={isCompletingAction ? "Saving decision" : "Checking code"}
      isSubmitting={isBusy}
      onSubmit={handleSubmit}
    >
      {verification.method === "totp" ? (
        <OneTimeCodeField
          id="step-up-authenticator-code"
          label="Authenticator code"
          length={STAFF_AUTHENTICATOR_CONFIGURATION.codeLength}
          required
          autoFocus
          value={verification.code}
          disabled={isBusy}
          error={verification.error}
          onChange={verification.updateCode}
        />
      ) : (
        <TextField
          id="step-up-recovery-code"
          label="Recovery code"
          autoComplete="one-time-code"
          required
          autoFocus
          maxLength={
            STAFF_AUTHENTICATOR_CONFIGURATION.recoveryCodeMaximumLength
          }
          value={verification.code}
          disabled={isBusy}
          error={verification.error}
          onChange={(changeEvent) =>
            verification.updateCode(changeEvent.target.value)
          }
        />
      )}
      <ActionButton
        className="self-start px-0 font-normal"
        size="small"
        type="button"
        variant="link"
        disabled={isBusy}
        onClick={verification.toggleMethod}
      >
        {verification.method === "totp"
          ? "Use a recovery code instead"
          : "Use an authenticator code instead"}
      </ActionButton>
    </FormDialog>
  );
}
