"use client";

import { useState, type FormEvent } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { ExpandableSection } from "@healthalyst/ui/components/expandable-section";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import type { PlatformBranch } from "~/features/organization-management/types/organization-management";
import { TeamAccessFields } from "~/features/team-management/components/team-access-fields";
import {
  LICENCE_BODY_OPTIONS,
  SPECIALTY_OPTIONS,
  TEAM_FIELD_LIMITS,
} from "~/features/team-management/config/team-management";
import { useStaffInvitationMutation } from "~/features/team-management/hooks/use-team-invitations";
import type { TeamScope } from "~/features/team-management/hooks/use-team-members";
import { staffInvitationFormSchema } from "~/features/team-management/schemas/team-form-schemas";
import type {
  StaffInvitation,
  TeamRole,
} from "~/features/team-management/types/team-management";
import { todayAsDateText } from "~/features/team-management/utilities/date-text";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

/** Invite one person into roles, branches and departments. */
export function InviteMemberDialog({
  open,
  onOpenChange,
  scope,
  roles,
  branches,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: TeamScope;
  roles: readonly TeamRole[];
  branches: readonly PlatformBranch[] | null;
  onInvited: (invitation: StaffInvitation) => void;
}) {
  const invitationMutation = useStaffInvitationMutation(scope);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const serverFieldErrors =
    invitationMutation.error instanceof PlatformApiError
      ? invitationMutation.error.fieldErrors
      : {};
  const visibleFieldErrors = { ...serverFieldErrors, ...fieldErrors };
  const dialogError =
    invitationMutation.error && Object.keys(serverFieldErrors).length === 0
      ? invitationMutation.error.message
      : "";

  function changeOpen(isOpen: boolean) {
    if (!isOpen && invitationMutation.isPending) return;
    if (isOpen) {
      invitationMutation.reset();
      setFieldErrors({});
    }
    onOpenChange(isOpen);
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      staffInvitationFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    invitationMutation.mutate(result.data, {
      onSuccess: (invitation) => {
        onOpenChange(false);
        onInvited(invitation);
      },
      onError: (error) => {
        if (error instanceof PlatformApiError) {
          focusFirstInvalidField(formElement, error.fieldErrors);
        }
      },
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={changeOpen}
      title="Invite a team member"
      description="They get a link to join your organisation. It works for 72 hours."
      submitLabel="Send invitation"
      submittingLabel="Sending invitation"
      isSubmitting={invitationMutation.isPending}
      error={dialogError}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="invitation-firstName"
          label="First name"
          name="firstName"
          autoComplete="off"
          required
          maxLength={TEAM_FIELD_LIMITS.nameMaximumLength}
          error={visibleFieldErrors.firstName}
        />
        <TextField
          id="invitation-lastName"
          label="Last name"
          name="lastName"
          autoComplete="off"
          required
          maxLength={TEAM_FIELD_LIMITS.nameMaximumLength}
          error={visibleFieldErrors.lastName}
        />
      </div>
      <TextField
        id="invitation-email"
        label="Email address"
        name="email"
        type="email"
        autoComplete="off"
        maxLength={TEAM_FIELD_LIMITS.emailMaximumLength}
        description="We send the invitation here. Use a phone number instead if they have no email."
        error={visibleFieldErrors.email}
      />
      <TextField
        id="invitation-phone"
        label="Phone number (optional)"
        name="phone"
        type="tel"
        autoComplete="off"
        placeholder="08031234567"
        error={visibleFieldErrors.phone}
      />

      <TeamAccessFields
        identifierPrefix="invitation"
        roles={roles}
        branches={branches}
        errors={visibleFieldErrors}
      />

      <TextField
        id="invitation-jobTitle"
        label="Job title (optional)"
        name="jobTitle"
        maxLength={TEAM_FIELD_LIMITS.jobTitleMaximumLength}
        placeholder="For example, Medical officer"
        error={visibleFieldErrors.jobTitle}
      />
      <SelectField
        id="invitation-specialty"
        label="Specialty (optional)"
        name="specialty"
        placeholder="Choose a specialty"
        options={SPECIALTY_OPTIONS}
        error={visibleFieldErrors.specialty}
      />

      <ExpandableSection title="Clinical licence and locum access">
        <div className="flex flex-col gap-5 pt-2">
          <p className="text-sm text-muted-foreground">
            Clinical staff need a current licence for their clinical permissions
            to work. You can add it now or later.
          </p>
          <SelectField
            id="invitation-licenceBody"
            label="Regulator"
            name="licenceBody"
            placeholder="Choose the regulator"
            options={LICENCE_BODY_OPTIONS}
            error={visibleFieldErrors.licenceBody}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="invitation-licenceNumber"
              label="Licence number"
              name="licenceNumber"
              autoComplete="off"
              maxLength={TEAM_FIELD_LIMITS.licenceNumberMaximumLength}
              error={visibleFieldErrors.licenceNumber}
            />
            <TextField
              id="invitation-licenceExpiresOn"
              label="Expires on"
              name="licenceExpiresOn"
              type="date"
              error={visibleFieldErrors.licenceExpiresOn}
            />
          </div>
          <TextField
            id="invitation-accessEndsOn"
            label="Last working day (locums only)"
            name="accessEndsOn"
            type="date"
            min={todayAsDateText()}
            description="Their access ends automatically after this day."
            error={visibleFieldErrors.accessEndsOn}
          />
        </div>
      </ExpandableSection>
    </FormDialog>
  );
}
