"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SummaryDetailList } from "@healthalyst/ui/components/review-summary";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { StepUpDialog } from "@healthalyst/ui/components/step-up-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { STAFF_AUTHENTICATOR_CONFIGURATION } from "~/features/staff-auth/config/staff-sign-in";
import { useStepUpProtection } from "~/features/staff-auth/hooks/use-step-up-protection";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";
import { PlatformRoleFields } from "~/features/staff-management/components/platform-role-fields";
import {
  PLATFORM_STAFF_STATUS_PRESENTATION,
  STAFF_DATE_TIME_FORMATTER,
  STAFF_MANAGEMENT_LIMITS,
} from "~/features/staff-management/config/staff-management";
import {
  useRemoveSuperAdminMutation,
  useReplacePlatformStaffRolesMutation,
} from "~/features/staff-management/hooks/use-platform-staff";
import {
  platformStaffRolesFormSchema,
  removeSuperAdminFormSchema,
} from "~/features/staff-management/schemas/staff-management-schemas";
import type { PlatformStaffMember } from "~/features/staff-management/types/staff-management";
import {
  describePlatformRoles,
  describeStaffName,
  isSuperAdmin,
  readCheckedRoles,
  readGrantableRoles,
} from "~/features/staff-management/utilities/describe-platform-staff";

const DESTRUCTIVE_OUTLINE_CLASS_NAME =
  "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive";

type OpenDialog = "roles" | "remove-super-admin" | null;

export function StaffMemberSheet({
  staffMember,
  staffIdentity,
  onClose,
}: {
  staffMember: PlatformStaffMember | null;
  staffIdentity: StaffIdentity;
  onClose: () => void;
}) {
  const rolesMutation = useReplacePlatformStaffRolesMutation(staffIdentity);
  const removalMutation = useRemoveSuperAdminMutation(staffIdentity);
  const stepUpProtection = useStepUpProtection();
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const [reasonError, setReasonError] = useState("");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const isSelf = staffMember?.id === staffIdentity.staffAccountId;
  const name = staffMember ? describeStaffName(staffMember) : "";

  function openActionDialog(dialog: Exclude<OpenDialog, null>) {
    rolesMutation.reset();
    removalMutation.reset();
    setReasonError("");
    setOpenDialog(dialog);
  }

  function closeActionDialog() {
    if (
      rolesMutation.isPending ||
      removalMutation.isPending ||
      stepUpProtection.isAwaitingCode
    )
      return;
    setOpenDialog(null);
  }

  async function handleRolesSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!staffMember) return;
    const result = platformStaffRolesFormSchema.safeParse({
      roles: readCheckedRoles(new FormData(formEvent.currentTarget)),
    });
    if (!result.success) return;
    const roles = result.data.roles;
    await stepUpProtection.runProtected({
      description: `change ${name}'s roles`,
      run: async () => {
        await rolesMutation.mutateAsync({ userId: staffMember.id, roles });
        setOpenDialog(null);
        setConfirmation(
          roles.length === 0 && !isSuperAdmin(staffMember)
            ? {
                title: `${name} no longer has staff access`,
                description:
                  "They were signed out of the staff app. Give them a role to restore their access.",
              }
            : {
                title: `${name}'s roles were saved`,
                description:
                  "Any role you removed signed them out of the staff app at once.",
              }
        );
      },
    });
  }

  async function handleRemovalSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!staffMember) return;
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const result = removeSuperAdminFormSchema.safeParse({
      reason: formData.get("reason"),
      deactivate: formData.get("deactivate") === "on",
    });
    if (!result.success) {
      setReasonError(result.error.issues[0]?.message ?? "Give a reason.");
      formElement.querySelector<HTMLElement>('[name="reason"]')?.focus();
      return;
    }
    setReasonError("");
    const removal = result.data;
    await stepUpProtection.runProtected({
      description: `remove ${name} as a super admin`,
      run: async () => {
        await removalMutation.mutateAsync({ userId: staffMember.id, removal });
        setOpenDialog(null);
        setConfirmation({
          title: `${name} is no longer a super admin`,
          description: removal.deactivate
            ? "Their sessions ended and their account is deactivated, so they cannot sign in. Every super admin was emailed."
            : "Their sessions ended. Any other staff roles they hold still apply. Every super admin was emailed.",
        });
      },
    });
  }

  const canRemoveSuperAdmin =
    staffMember !== null && isSuperAdmin(staffMember) && !isSelf;

  return (
    <>
      <DetailSheet
        open={staffMember !== null}
        onOpenChange={(isOpen) => !isOpen && onClose()}
        title={name}
        titleAccessory={
          staffMember && (
            <StatusLabel
              tone={PLATFORM_STAFF_STATUS_PRESENTATION[staffMember.status].tone}
            >
              {PLATFORM_STAFF_STATUS_PRESENTATION[staffMember.status].label}
            </StatusLabel>
          )
        }
        description={staffMember?.email ?? "No email address"}
        footer={
          staffMember && !isSelf ? (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {canRemoveSuperAdmin && (
                <ActionButton
                  type="button"
                  variant="outline"
                  className={`${DESTRUCTIVE_OUTLINE_CLASS_NAME} sm:mr-auto`}
                  onClick={() => openActionDialog("remove-super-admin")}
                >
                  Remove super admin
                </ActionButton>
              )}
              <ActionButton
                type="button"
                className="sm:ml-auto"
                onClick={() => openActionDialog("roles")}
              >
                Change roles
              </ActionButton>
            </div>
          ) : undefined
        }
      >
        {staffMember && (
          <div className="flex flex-col gap-6">
            {isSelf && (
              <NoticeBanner tone="information" title="This is you">
                Another super admin has to change your roles.
              </NoticeBanner>
            )}
            <SummaryDetailList
              details={[
                {
                  label: "Roles",
                  value: describePlatformRoles(staffMember.roles),
                },
                {
                  label: "Authenticator",
                  value: staffMember.mfaEnrolled ? "Set up" : "Not set up",
                },
                {
                  label: "Last signed in",
                  value: staffMember.lastLoginAt
                    ? STAFF_DATE_TIME_FORMATTER.format(
                        new Date(staffMember.lastLoginAt)
                      )
                    : "Not yet",
                },
                {
                  label: "Added",
                  value: STAFF_DATE_TIME_FORMATTER.format(
                    new Date(staffMember.createdAt)
                  ),
                },
              ]}
            />
          </div>
        )}
      </DetailSheet>

      {staffMember && (
        <FormDialog
          // Remount for each person so the boxes start from their roles.
          key={`roles-${staffMember.id}`}
          open={openDialog === "roles"}
          onOpenChange={(isOpen) => !isOpen && closeActionDialog()}
          title={`Change ${name}'s roles`}
          description={
            isSuperAdmin(staffMember)
              ? "They stay a super admin whatever you choose here. Removing a role signs them out of the staff app."
              : "Removing a role signs them out of the staff app. Clear every role to end their staff access."
          }
          submitLabel="Save roles"
          submittingLabel="Saving roles"
          isSubmitting={rolesMutation.isPending}
          error={
            rolesMutation.error && !stepUpProtection.isAwaitingCode
              ? rolesMutation.error.message
              : ""
          }
          onSubmit={(formEvent) => void handleRolesSubmit(formEvent)}
        >
          <PlatformRoleFields
            identifier="change-staff"
            defaultRoles={readGrantableRoles(staffMember.roles)}
          />
        </FormDialog>
      )}

      <FormDialog
        open={openDialog === "remove-super-admin"}
        onOpenChange={(isOpen) => !isOpen && closeActionDialog()}
        title={`Remove ${name} as a super admin`}
        description="All their sessions end at once. You cannot remove the last super admin. Every super admin and the person are emailed."
        submitLabel="Remove super admin"
        submittingLabel="Removing super admin"
        tone="destructive"
        isSubmitting={removalMutation.isPending}
        error={
          removalMutation.error && !stepUpProtection.isAwaitingCode
            ? removalMutation.error.message
            : ""
        }
        onSubmit={(formEvent) => void handleRemovalSubmit(formEvent)}
      >
        <TextAreaField
          id="remove-super-admin-reason"
          label="Reason"
          description="Recorded in the audit log and included in the emails."
          name="reason"
          required
          rows={4}
          minLength={STAFF_MANAGEMENT_LIMITS.removalReasonMinimumLength}
          maxLength={STAFF_MANAGEMENT_LIMITS.removalReasonMaximumLength}
          error={reasonError}
        />
        <CheckboxField
          id="remove-super-admin-deactivate"
          name="deactivate"
          label="Also deactivate their account"
          description="They will not be able to sign in to HealthAlyst at all."
        />
      </FormDialog>

      <StepUpDialog
        {...stepUpProtection.dialog}
        completingLabel="Saving change"
        authenticatorCodeLength={STAFF_AUTHENTICATOR_CONFIGURATION.codeLength}
        recoveryCodeMaximumLength={
          STAFF_AUTHENTICATOR_CONFIGURATION.recoveryCodeMaximumLength
        }
      />

      {confirmation && (
        <FeedbackDialog
          open
          onOpenChange={(isOpen) => !isOpen && setConfirmation(null)}
          tone="success"
          title={confirmation.title}
          description={confirmation.description}
          primaryAction={{
            label: "Done",
            onSelect: () => setConfirmation(null),
          }}
        />
      )}
    </>
  );
}
