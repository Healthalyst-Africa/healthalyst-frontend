"use client";

import { useState, type FormEvent } from "react";
import { OwnerIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { HintText } from "@healthalyst/ui/components/hint-text";
import { SummaryDetailList } from "@healthalyst/ui/components/review-summary";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { StepUpDialog } from "@healthalyst/ui/components/step-up-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import {
  MEMBER_STATUS_LABELS,
  OWNER_RECOVERY,
} from "~/features/organization-oversight/config/organization-lifecycle";
import { useAssignOrganizationOwnerMutation } from "~/features/organization-oversight/hooks/use-organization-oversight";
import { ownerAssignmentFormSchema } from "~/features/organization-oversight/schemas/organization-lifecycle-schemas";
import type {
  OrganizationMember,
  OwnerAssignment,
  RegistrationStatus,
} from "~/features/organization-oversight/types/organization-types";
import { STAFF_AUTHENTICATOR_CONFIGURATION } from "~/features/staff-auth/config/staff-sign-in";
import { useStepUpProtection } from "~/features/staff-auth/hooks/use-step-up-protection";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

const FIELD_ORDER = ["userId", "reason", "confirmed"] as const;

/** "front_desk" becomes "Front desk". */
function describeRoleCode(roleCode: string): string {
  const words = roleCode.replaceAll("_", " ").replaceAll("-", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function isOwner(member: OrganizationMember): boolean {
  return member.roles.includes(OWNER_RECOVERY.ownerRoleCode);
}

/**
 * The organisation's members, and support-assisted owner recovery for when no
 * owner can be reached.
 */
export function OrganizationMembers({
  organizationId,
  organizationName,
  status,
  members,
  staffIdentity,
}: {
  organizationId: string;
  organizationName: string;
  status: RegistrationStatus;
  members: readonly OrganizationMember[];
  staffIdentity: StaffIdentity;
}) {
  const assignMutation = useAssignOrganizationOwnerMutation(staffIdentity);
  const stepUpProtection = useStepUpProtection();
  const [isOpen, setIsOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [assignment, setAssignment] = useState<OwnerAssignment | null>(null);

  const canRecoverOwner =
    OWNER_RECOVERY.roles.some((role) =>
      staffIdentity.platformRoles.includes(role)
    ) &&
    (OWNER_RECOVERY.fromStatuses as readonly RegistrationStatus[]).includes(
      status
    );
  const candidates = members.filter(
    (member) => member.status === "ACTIVE" && !isOwner(member)
  );
  const sortedMembers = [...members].sort(
    (first, second) =>
      Number(isOwner(second)) - Number(isOwner(first)) ||
      first.name.localeCompare(second.name)
  );

  function changeOpen(open: boolean) {
    if (!open && (assignMutation.isPending || stepUpProtection.isAwaitingCode))
      return;
    if (open) {
      assignMutation.reset();
      setFieldErrors({});
    }
    setIsOpen(open);
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const result = ownerAssignmentFormSchema.safeParse({
      userId: formData.get("userId") ?? "",
      reason: formData.get("reason"),
      confirmed: formData.get("confirmed") === "on",
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] ??= issue.message;
      }
      setFieldErrors(errors);
      const firstInvalidField = FIELD_ORDER.find(
        (fieldName) => errors[fieldName]
      );
      formElement
        .querySelector<HTMLElement>(`#owner-recovery-${firstInvalidField}`)
        ?.focus();
      return;
    }
    setFieldErrors({});
    const { userId, reason } = result.data;
    const newOwnerName =
      candidates.find((member) => member.userId === userId)?.name ??
      "this member";
    await stepUpProtection.runProtected({
      description: `make ${newOwnerName} an owner of ${organizationName}`,
      run: async () => {
        const ownerAssignment = await assignMutation.mutateAsync({
          organizationId,
          userId,
          reason,
        });
        setIsOpen(false);
        setAssignment(ownerAssignment);
      },
    });
  }

  const newOwner = assignment?.owners.find(
    (owner) => owner.userId === assignment.userId
  );

  return (
    <div className="flex flex-col gap-4">
      {sortedMembers.length > 0 ? (
        <SummaryDetailList
          details={sortedMembers.map((member) => ({
            label: member.name || "Unnamed member",
            value: `${
              member.roles.length > 0
                ? member.roles.map(describeRoleCode).join(", ")
                : "No roles"
            } · ${MEMBER_STATUS_LABELS[member.status]}`,
          }))}
        />
      ) : (
        <HintText>No members yet.</HintText>
      )}

      {canRecoverOwner && (
        <div>
          <ActionButton
            type="button"
            variant="outline"
            leadingIcon={<OwnerIcon />}
            disabled={candidates.length === 0}
            onClick={() => changeOpen(true)}
          >
            Assign an owner
          </ActionButton>
          <HintText className="mt-2">
            {candidates.length === 0
              ? "No active member without the owner role can be assigned."
              : "Only when the owners have left or cannot be reached, after you verify the request outside HealthAlyst."}
          </HintText>
        </div>
      )}

      <FormDialog
        open={isOpen}
        onOpenChange={changeOpen}
        title="Assign an owner"
        description="The member gets the owner role. Existing owners keep theirs, and the new owner can remove them. The member and every owner are emailed."
        submitLabel="Assign owner"
        submittingLabel="Assigning owner"
        tone="destructive"
        isSubmitting={assignMutation.isPending}
        error={
          assignMutation.error && !stepUpProtection.isAwaitingCode
            ? assignMutation.error.message
            : ""
        }
        onSubmit={(formEvent) => void handleSubmit(formEvent)}
      >
        <SelectField
          id="owner-recovery-userId"
          label="New owner"
          name="userId"
          placeholder="Choose an active member"
          options={candidates.map((member) => ({
            value: member.userId,
            label: `${member.name} (${
              member.roles.map(describeRoleCode).join(", ") || "No roles"
            })`,
          }))}
          error={fieldErrors.userId}
        />
        <TextAreaField
          id="owner-recovery-reason"
          label="How you verified the request"
          description="Recorded in the audit log and included in the emails."
          name="reason"
          required
          rows={4}
          minLength={OWNER_RECOVERY.reasonMinimumLength}
          maxLength={OWNER_RECOVERY.reasonMaximumLength}
          error={fieldErrors.reason}
        />
        <CheckboxField
          id="owner-recovery-confirmed"
          name="confirmed"
          label="I verified this request outside HealthAlyst, and no current owner can act."
          error={fieldErrors.confirmed}
        />
      </FormDialog>

      <StepUpDialog
        {...stepUpProtection.dialog}
        completingLabel="Assigning owner"
        authenticatorCodeLength={STAFF_AUTHENTICATOR_CONFIGURATION.codeLength}
        recoveryCodeMaximumLength={
          STAFF_AUTHENTICATOR_CONFIGURATION.recoveryCodeMaximumLength
        }
      />

      {assignment && (
        <FeedbackDialog
          open
          onOpenChange={(open) => !open && setAssignment(null)}
          tone="success"
          title={`${newOwner?.name ?? "The member"} is now an owner`}
          description={`Owners of ${organizationName}: ${assignment.owners
            .map((owner) => owner.name)
            .join(", ")}. Everyone affected was emailed.`}
          primaryAction={{ label: "Done", onSelect: () => setAssignment(null) }}
        />
      )}
    </div>
  );
}
