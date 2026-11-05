"use client";

import { useState, type FormEvent } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import {
  LICENCE_BODY_OPTIONS,
  LICENCE_VERIFICATION_METHOD_OPTIONS,
  TEAM_FIELD_LIMITS,
} from "~/features/team-management/config/team-management";
import {
  useLicenceVerificationMutation,
  useTeamMemberUpdateMutation,
  type TeamScope,
} from "~/features/team-management/hooks/use-team-members";
import {
  licenceVerificationFormSchema,
  memberLicenceFormSchema,
} from "~/features/team-management/schemas/team-form-schemas";
import type { StaffMember } from "~/features/team-management/types/team-management";
import { describeFullName } from "~/features/team-management/utilities/describe-team";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

function readMutationErrors(error: Error | null) {
  const fieldErrors =
    error instanceof PlatformApiError ? error.fieldErrors : {};
  return {
    fieldErrors,
    message:
      error && Object.keys(fieldErrors).length === 0 ? error.message : "",
  };
}

/** Add or replace a member's practising licence. A new licence needs checking again. */
export function MemberLicenceDialog({
  member,
  open,
  onOpenChange,
  scope,
}: {
  member: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: TeamScope;
}) {
  const updateMutation = useTeamMemberUpdateMutation(scope);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const mutationErrors = readMutationErrors(updateMutation.error);
  const visibleFieldErrors = { ...mutationErrors.fieldErrors, ...fieldErrors };

  function changeOpen(isOpen: boolean) {
    if (!isOpen && updateMutation.isPending) return;
    if (isOpen) {
      updateMutation.reset();
      setFieldErrors({});
    }
    onOpenChange(isOpen);
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      memberLicenceFormSchema,
      new FormData(formElement)
    );
    if (!result.success || !result.data) {
      const errors = result.success
        ? { licenceBody: "Choose the regulator that issued the licence." }
        : result.errors;
      setFieldErrors(errors);
      focusFirstInvalidField(formElement, errors);
      return;
    }
    setFieldErrors({});
    updateMutation.mutate(
      { membershipId: member.membershipId, changes: { licence: result.data } },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={changeOpen}
      title={member.licence ? "Update licence" : "Add licence"}
      description={`${describeFullName(member)}'s practising licence. Changing it means it needs checking again.`}
      submitLabel="Save licence"
      submittingLabel="Saving licence"
      isSubmitting={updateMutation.isPending}
      error={mutationErrors.message}
      onSubmit={handleSubmit}
    >
      <SelectField
        id="member-licence-licenceBody"
        label="Regulator"
        name="licenceBody"
        placeholder="Choose the regulator"
        options={LICENCE_BODY_OPTIONS}
        defaultValue={member.licence?.body}
        error={visibleFieldErrors.licenceBody ?? visibleFieldErrors.body}
      />
      <TextField
        id="member-licence-licenceNumber"
        label="Licence number"
        name="licenceNumber"
        autoComplete="off"
        defaultValue={member.licence?.number ?? ""}
        maxLength={TEAM_FIELD_LIMITS.licenceNumberMaximumLength}
        error={visibleFieldErrors.licenceNumber ?? visibleFieldErrors.number}
      />
      <TextField
        id="member-licence-licenceExpiresOn"
        label="Expires on"
        name="licenceExpiresOn"
        type="date"
        defaultValue={member.licence?.expiresOn ?? ""}
        error={
          visibleFieldErrors.licenceExpiresOn ?? visibleFieldErrors.expiresOn
        }
      />
    </FormDialog>
  );
}

/** Record how a licence was confirmed with its regulator. */
export function LicenceVerificationDialog({
  member,
  open,
  onOpenChange,
  scope,
}: {
  member: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: TeamScope;
}) {
  const verificationMutation = useLicenceVerificationMutation(scope);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const mutationErrors = readMutationErrors(verificationMutation.error);
  const visibleFieldErrors = { ...mutationErrors.fieldErrors, ...fieldErrors };

  function changeOpen(isOpen: boolean) {
    if (!isOpen && verificationMutation.isPending) return;
    if (isOpen) {
      verificationMutation.reset();
      setFieldErrors({});
    }
    onOpenChange(isOpen);
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      licenceVerificationFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    verificationMutation.mutate(
      { membershipId: member.membershipId, verification: result.data },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={changeOpen}
      title="Record licence check"
      description={
        member.licence
          ? `${member.licence.body} licence ${member.licence.number}.`
          : undefined
      }
      submitLabel="Record check"
      submittingLabel="Recording check"
      isSubmitting={verificationMutation.isPending}
      error={mutationErrors.message}
      onSubmit={handleSubmit}
    >
      <SelectField
        id="licence-check-method"
        label="How did you confirm it?"
        name="method"
        placeholder="Choose how"
        options={LICENCE_VERIFICATION_METHOD_OPTIONS}
        error={visibleFieldErrors.method}
      />
      <TextField
        id="licence-check-reference"
        label="Reference (optional)"
        name="reference"
        autoComplete="off"
        maxLength={TEAM_FIELD_LIMITS.verificationReferenceMaximumLength}
        description="The register search reference or certificate number, so others can check it later."
        error={visibleFieldErrors.reference}
      />
    </FormDialog>
  );
}
