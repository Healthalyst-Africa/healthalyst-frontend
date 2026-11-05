"use client";

import { useState, type FormEvent } from "react";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { StepUpDialog } from "@healthalyst/ui/components/step-up-dialog";
import { TextField } from "@healthalyst/ui/components/text-field";
import { STAFF_AUTHENTICATOR_CONFIGURATION } from "~/features/staff-auth/config/staff-sign-in";
import { useStepUpProtection } from "~/features/staff-auth/hooks/use-step-up-protection";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";
import { PlatformRoleFields } from "~/features/staff-management/components/platform-role-fields";
import { STAFF_MANAGEMENT_LIMITS } from "~/features/staff-management/config/staff-management";
import { useAddPlatformStaffMutation } from "~/features/staff-management/hooks/use-platform-staff";
import { addPlatformStaffFormSchema } from "~/features/staff-management/schemas/staff-management-schemas";
import type { AddedPlatformStaffMember } from "~/features/staff-management/types/staff-management";
import {
  describeStaffName,
  readCheckedRoles,
} from "~/features/staff-management/utilities/describe-platform-staff";

const FIELD_ORDER = ["firstName", "lastName", "email", "roles"] as const;

export function AddStaffDialog({
  open,
  onOpenChange,
  staffIdentity,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffIdentity: StaffIdentity;
}) {
  const addMutation = useAddPlatformStaffMutation(staffIdentity);
  const stepUpProtection = useStepUpProtection();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [addedStaffMember, setAddedStaffMember] =
    useState<AddedPlatformStaffMember | null>(null);

  function changeOpen(isOpen: boolean) {
    if (!isOpen && (addMutation.isPending || stepUpProtection.isAwaitingCode))
      return;
    if (isOpen) {
      addMutation.reset();
      setFieldErrors({});
    }
    onOpenChange(isOpen);
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const result = addPlatformStaffFormSchema.safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      roles: readCheckedRoles(formData),
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = String(issue.path[0]);
        errors[fieldName] ??= issue.message;
      }
      setFieldErrors(errors);
      const firstInvalidField = FIELD_ORDER.find(
        (fieldName) => errors[fieldName]
      );
      formElement
        .querySelector<HTMLElement>(
          firstInvalidField === "roles"
            ? '[id^="add-staff-role-"]'
            : `[name="${firstInvalidField}"]`
        )
        ?.focus();
      return;
    }
    setFieldErrors({});
    await stepUpProtection.runProtected({
      description: `add ${describeStaffName(result.data)} to HealthAlyst staff`,
      run: async () => {
        const addedMember = await addMutation.mutateAsync(result.data);
        onOpenChange(false);
        setAddedStaffMember(addedMember);
      },
    });
  }

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={changeOpen}
        title="Add a staff member"
        description="They can use the HealthAlyst staff app with the roles you choose. Super admin is granted by an operator, not here."
        submitLabel="Add staff member"
        submittingLabel="Adding staff member"
        isSubmitting={addMutation.isPending}
        error={
          addMutation.error && !stepUpProtection.isAwaitingCode
            ? addMutation.error.message
            : ""
        }
        onSubmit={(formEvent) => void handleSubmit(formEvent)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="add-staff-first-name"
            label="First name"
            name="firstName"
            autoComplete="off"
            required
            maxLength={STAFF_MANAGEMENT_LIMITS.nameMaximumLength}
            error={fieldErrors.firstName}
          />
          <TextField
            id="add-staff-last-name"
            label="Last name"
            name="lastName"
            autoComplete="off"
            required
            maxLength={STAFF_MANAGEMENT_LIMITS.nameMaximumLength}
            error={fieldErrors.lastName}
          />
        </div>
        <TextField
          id="add-staff-email"
          label="Work email"
          name="email"
          type="email"
          autoComplete="off"
          required
          maxLength={STAFF_MANAGEMENT_LIMITS.emailMaximumLength}
          error={fieldErrors.email}
        />
        <PlatformRoleFields
          identifier="add-staff"
          message={fieldErrors.roles}
          messageTone="error"
        />
      </FormDialog>

      <StepUpDialog
        {...stepUpProtection.dialog}
        completingLabel="Adding staff member"
        authenticatorCodeLength={STAFF_AUTHENTICATOR_CONFIGURATION.codeLength}
        recoveryCodeMaximumLength={
          STAFF_AUTHENTICATOR_CONFIGURATION.recoveryCodeMaximumLength
        }
      />

      {addedStaffMember && (
        <FeedbackDialog
          open
          onOpenChange={(isOpen) => !isOpen && setAddedStaffMember(null)}
          tone="success"
          title={`${describeStaffName(addedStaffMember)} was added`}
          description={
            addedStaffMember.newAccount
              ? "We emailed them a link to set a password and an authenticator."
              : "They already had a HealthAlyst account, so they keep their password. We emailed them about their new access."
          }
          primaryAction={{
            label: "Done",
            onSelect: () => setAddedStaffMember(null),
          }}
        />
      )}
    </>
  );
}
