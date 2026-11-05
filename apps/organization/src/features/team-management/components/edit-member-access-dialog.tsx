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
  SPECIALTY_OPTIONS,
  TEAM_FIELD_LIMITS,
} from "~/features/team-management/config/team-management";
import {
  useTeamMemberUpdateMutation,
  type TeamScope,
} from "~/features/team-management/hooks/use-team-members";
import { memberAccessFormSchema } from "~/features/team-management/schemas/team-form-schemas";
import type {
  StaffMember,
  TeamRole,
} from "~/features/team-management/types/team-management";
import { todayAsDateText } from "~/features/team-management/utilities/date-text";
import {
  describeFullName,
  koboToNairaText,
  readMemberChanges,
} from "~/features/team-management/utilities/describe-team";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

/** Change a member's roles, branches, job details and approval limits. */
export function EditMemberAccessDialog({
  member,
  open,
  onOpenChange,
  scope,
  roles,
  branches,
}: {
  member: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: TeamScope;
  roles: readonly TeamRole[];
  branches: readonly PlatformBranch[] | null;
}) {
  const updateMutation = useTeamMemberUpdateMutation(scope);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const serverFieldErrors =
    updateMutation.error instanceof PlatformApiError
      ? updateMutation.error.fieldErrors
      : {};
  const visibleFieldErrors = { ...serverFieldErrors, ...fieldErrors };

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
      memberAccessFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    const changes = readMemberChanges(member, result.data);
    if (Object.keys(changes).length === 0) {
      onOpenChange(false);
      return;
    }
    updateMutation.mutate(
      { membershipId: member.membershipId, changes },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          if (error instanceof PlatformApiError) {
            focusFirstInvalidField(formElement, error.fieldErrors);
          }
        },
      }
    );
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={changeOpen}
      title={`Edit ${describeFullName(member)}`}
      description="Changes apply the next time they use HealthAlyst."
      submitLabel="Save changes"
      submittingLabel="Saving changes"
      isSubmitting={updateMutation.isPending}
      error={
        updateMutation.error && Object.keys(serverFieldErrors).length === 0
          ? updateMutation.error.message
          : ""
      }
      onSubmit={handleSubmit}
    >
      <TeamAccessFields
        identifierPrefix="member-access"
        roles={roles}
        branches={branches}
        defaults={{
          roleIds: member.roles.map((role) => role.id),
          allBranches: member.allBranches,
          branchIds: member.branchIds,
          departmentIds: member.departmentIds,
        }}
        errors={visibleFieldErrors}
      />
      <TextField
        id="member-access-jobTitle"
        label="Job title (optional)"
        name="jobTitle"
        defaultValue={member.jobTitle ?? ""}
        maxLength={TEAM_FIELD_LIMITS.jobTitleMaximumLength}
        error={visibleFieldErrors.jobTitle}
      />
      <SelectField
        id="member-access-specialty"
        label="Specialty (optional)"
        name="specialty"
        placeholder="No specialty"
        options={SPECIALTY_OPTIONS}
        defaultValue={member.specialty ?? undefined}
        error={visibleFieldErrors.specialty}
      />
      <TextField
        id="member-access-accessEndsOn"
        label="Last working day (locums only)"
        name="accessEndsOn"
        type="date"
        min={todayAsDateText()}
        defaultValue={member.accessEndsOn ?? ""}
        description="Leave empty for permanent staff. Their access ends automatically after this day."
        error={visibleFieldErrors.accessEndsOn}
      />

      <ExpandableSection title="Approval limits">
        <div className="flex flex-col gap-5 pt-2">
          <p className="text-sm text-muted-foreground">
            The most this person can approve on their own. Leave a field empty
            for no limit. You cannot give limits above your own.
          </p>
          <TextField
            id="member-access-waiverAmount"
            label="Fee waivers, up to (₦)"
            name="waiverAmount"
            inputMode="decimal"
            defaultValue={koboToNairaText(member.approvalLimits.waiverKobo)}
            error={visibleFieldErrors.waiverAmount}
          />
          <TextField
            id="member-access-billToFolderAmount"
            label="Charges to a patient's folder, up to (₦)"
            name="billToFolderAmount"
            inputMode="decimal"
            defaultValue={koboToNairaText(
              member.approvalLimits.billToFolderKobo
            )}
            error={visibleFieldErrors.billToFolderAmount}
          />
          <TextField
            id="member-access-discountPercent"
            label="Discounts, up to (%)"
            name="discountPercent"
            inputMode="numeric"
            defaultValue={
              member.approvalLimits.discountPercent === null
                ? ""
                : String(member.approvalLimits.discountPercent)
            }
            error={visibleFieldErrors.discountPercent}
          />
        </div>
      </ExpandableSection>
    </FormDialog>
  );
}
