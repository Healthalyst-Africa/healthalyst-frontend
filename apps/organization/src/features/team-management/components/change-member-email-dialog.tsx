"use client";

import { useState, type FormEvent } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { StepUpDialog } from "@healthalyst/ui/components/step-up-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { useStepUpProtection } from "~/features/account-security/hooks/use-step-up-protection";
import { SIGN_IN_LIMITS } from "~/features/authentication/config/authentication-limits";
import { CODE_LENGTH } from "~/features/authentication/config/authenticator-enrolment";
import {
  EMAIL_CHANGE_REFUSALS,
  TEAM_FIELD_LIMITS,
} from "~/features/team-management/config/team-management";
import { useMemberEmailChangeMutation } from "~/features/team-management/hooks/use-team-members";
import { memberEmailChangeFormSchema } from "~/features/team-management/schemas/team-form-schemas";
import type {
  MemberEmailChangeResult,
  StaffMember,
} from "~/features/team-management/types/team-management";
import { describeFullName } from "~/features/team-management/utilities/describe-team";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

function describeRequestError(error: Error | null): string {
  if (!error) return "";
  if (error instanceof PlatformApiError) {
    if (Object.keys(error.fieldErrors).length > 0) return "";
    const refusal = error.code ? EMAIL_CHANGE_REFUSALS[error.code] : undefined;
    if (refusal) return refusal;
  }
  return error.message;
}

/**
 * Starts changing the sign-in email of a member who lost access to their
 * inbox. The change only happens when they confirm from the new address.
 */
export function ChangeMemberEmailDialog({
  member,
  open,
  onOpenChange,
  onRequested,
}: {
  member: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequested: (result: MemberEmailChangeResult) => void;
}) {
  const emailChangeMutation = useMemberEmailChangeMutation();
  const stepUpProtection = useStepUpProtection();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fullName = describeFullName(member);
  const serverFieldErrors =
    emailChangeMutation.error instanceof PlatformApiError
      ? emailChangeMutation.error.fieldErrors
      : {};
  const visibleFieldErrors = { ...serverFieldErrors, ...fieldErrors };

  function changeOpen(isOpen: boolean) {
    if (
      !isOpen &&
      (emailChangeMutation.isPending || stepUpProtection.dialog.open)
    )
      return;
    if (isOpen) {
      emailChangeMutation.reset();
      setFieldErrors({});
    }
    onOpenChange(isOpen);
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const validation = parseFormData(
      memberEmailChangeFormSchema,
      new FormData(formElement)
    );
    if (!validation.success) {
      setFieldErrors(validation.errors);
      focusFirstInvalidField(formElement, validation.errors);
      return;
    }
    setFieldErrors({});
    const request = validation.data;
    await stepUpProtection.runProtected({
      description: `change ${fullName}'s sign-in email`,
      run: async () => {
        const result = await emailChangeMutation.mutateAsync({
          membershipId: member.membershipId,
          request,
        });
        onOpenChange(false);
        onRequested(result);
      },
    });
  }

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={changeOpen}
        title={`Change ${fullName}'s sign-in email`}
        description="Use this when they can no longer open their email. We send a link to the new address; the change happens only when they open it and choose a new password. Their old address is told, and they keep their authenticator app."
        submitLabel="Send confirmation link"
        submittingLabel="Sending link"
        isSubmitting={emailChangeMutation.isPending}
        error={
          stepUpProtection.dialog.open
            ? ""
            : describeRequestError(emailChangeMutation.error)
        }
        onSubmit={(formEvent) => void handleSubmit(formEvent)}
      >
        {member.email && (
          <TextField
            id="member-email-change-current"
            label="Current email address"
            type="email"
            defaultValue={member.email}
            readOnly
          />
        )}
        <TextField
          id="member-email-change-new"
          label="New email address"
          name="newEmail"
          type="email"
          autoComplete="off"
          maxLength={TEAM_FIELD_LIMITS.emailMaximumLength}
          required
          error={visibleFieldErrors.newEmail}
        />
        <TextAreaField
          id="member-email-change-reason"
          label="Reason"
          description="Recorded in the audit log."
          name="reason"
          required
          rows={3}
          minLength={TEAM_FIELD_LIMITS.emailChangeReasonMinimumLength}
          maxLength={TEAM_FIELD_LIMITS.emailChangeReasonMaximumLength}
          error={visibleFieldErrors.reason}
        />
      </FormDialog>
      <StepUpDialog
        {...stepUpProtection.dialog}
        completingLabel="Sending link"
        authenticatorCodeLength={CODE_LENGTH}
        recoveryCodeMaximumLength={SIGN_IN_LIMITS.recoveryCodeMaximum}
      />
    </>
  );
}
