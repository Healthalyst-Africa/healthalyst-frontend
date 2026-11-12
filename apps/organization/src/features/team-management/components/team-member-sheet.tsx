"use client";

import { useState, type ReactNode } from "react";
import {
  ChangeEmailIcon,
  EditIcon,
  LicenceIcon,
  PauseIcon,
  PlayIcon,
  ResetAuthenticatorIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SummaryDetailList } from "@healthalyst/ui/components/review-summary";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { StepUpDialog } from "@healthalyst/ui/components/step-up-dialog";
import { useStepUpProtection } from "~/features/account-security/hooks/use-step-up-protection";
import { SIGN_IN_LIMITS } from "~/features/authentication/config/authentication-limits";
import { CODE_LENGTH } from "~/features/authentication/config/authenticator-enrolment";
import type { PlatformBranch } from "~/features/organization-management/types/organization-management";
import { ChangeMemberEmailDialog } from "~/features/team-management/components/change-member-email-dialog";
import { EditMemberAccessDialog } from "~/features/team-management/components/edit-member-access-dialog";
import {
  LicenceVerificationDialog,
  MemberLicenceDialog,
} from "~/features/team-management/components/member-licence-dialogs";
import {
  LICENCE_BODY_OPTIONS,
  LICENCE_STATUS_PRESENTATION,
  LICENCE_VERIFICATION_METHOD_OPTIONS,
  SPECIALTY_OPTIONS,
  STAFF_STATUS_PRESENTATION,
  TEAM_DATE_TIME_FORMATTER,
} from "~/features/team-management/config/team-management";
import {
  useAuthenticatorResetMutation,
  useTeamMemberAccessMutation,
  useTeamMemberQuery,
  useTeamMemberRemovalMutation,
  type TeamScope,
} from "~/features/team-management/hooks/use-team-members";
import type {
  StaffMember,
  TeamRole,
} from "~/features/team-management/types/team-management";
import {
  formatDateText,
  todayAsDateText,
} from "~/features/team-management/utilities/date-text";
import {
  describeBranchScope,
  describeFullName,
  describeRoleNames,
  formatNaira,
  isOwnMembership,
} from "~/features/team-management/utilities/describe-team";

export type TeamMemberAbilities = {
  canUpdate: boolean;
  canSuspend: boolean;
  canRemove: boolean;
};

type OpenDialog =
  | "access"
  | "licence"
  | "licence-check"
  | "suspend"
  | "reactivate"
  | "reset-authenticator"
  | "change-email"
  | "remove"
  | null;

function DetailSection({
  heading,
  action,
  children,
}: {
  heading: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-medium">{heading}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function labelFor(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined
): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatDateTime(value: string | null): string | null {
  return value ? TEAM_DATE_TIME_FORMATTER.format(new Date(value)) : null;
}

/** One member's access, contact details and licence, with the actions allowed. */
export function TeamMemberSheet({
  selectedMember,
  onClose,
  scope,
  currentUserId,
  roles,
  branches,
  abilities,
}: {
  selectedMember: StaffMember | null;
  onClose: () => void;
  scope: TeamScope;
  currentUserId: string;
  roles: readonly TeamRole[];
  branches: readonly PlatformBranch[] | null;
  abilities: TeamMemberAbilities;
}) {
  const memberQuery = useTeamMemberQuery(scope, selectedMember);
  const accessMutation = useTeamMemberAccessMutation(scope);
  const resetMutation = useAuthenticatorResetMutation();
  const removalMutation = useTeamMemberRemovalMutation(scope);
  const stepUpProtection = useStepUpProtection();
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const member = memberQuery.data ?? selectedMember;

  if (!member) return null;

  const fullName = describeFullName(member);
  const isOwn = isOwnMembership(member, currentUserId);
  const isRemoved = member.status === "REVOKED";
  const canChange = !isOwn && !isRemoved;
  const canChangeEmail =
    canChange && abilities.canUpdate && member.status === "ACTIVE";
  const statusPresentation = STAFF_STATUS_PRESENTATION[member.status];
  const licencePresentation = LICENCE_STATUS_PRESENTATION[member.licenceStatus];
  const departmentNames = (branches ?? [])
    .flatMap((branch) => branch.departments)
    .filter((department) => member.departmentIds.includes(department.id))
    .map((department) => department.name);

  function openFor(dialog: Exclude<OpenDialog, null>) {
    setNotice(null);
    accessMutation.reset();
    resetMutation.reset();
    removalMutation.reset();
    setOpenDialog(dialog);
  }

  function closeDialog() {
    if (
      accessMutation.isPending ||
      resetMutation.isPending ||
      removalMutation.isPending
    )
      return;
    setOpenDialog(null);
  }

  function changeAccess(action: "suspend" | "reactivate") {
    if (!member) return;
    accessMutation.mutate(
      { membershipId: member.membershipId, action },
      {
        onSuccess: () => {
          setOpenDialog(null);
          setNotice(
            action === "suspend"
              ? `${fullName} is suspended and has been signed out.`
              : `${fullName} can use HealthAlyst again.`
          );
        },
      }
    );
  }

  async function resetAuthenticator() {
    if (!member) return;
    setOpenDialog(null);
    const membershipId = member.membershipId;
    await stepUpProtection.runProtected({
      description: `reset ${fullName}'s authenticator`,
      run: () =>
        resetMutation
          .mutateAsync(membershipId)
          .then(() =>
            setNotice(
              `${fullName} must set up their authenticator again the next time they sign in.`
            )
          ),
    });
  }

  function removeMember() {
    if (!member) return;
    removalMutation.mutate(member.membershipId, {
      onSuccess: () => {
        setOpenDialog(null);
        onClose();
      },
    });
  }

  const actionError =
    accessMutation.error?.message ??
    (resetMutation.error && !stepUpProtection.dialog.open
      ? resetMutation.error.message
      : null);

  return (
    <>
      <DetailSheet
        open={selectedMember !== null}
        onOpenChange={(isOpen) => !isOpen && onClose()}
        title={fullName}
        titleAccessory={
          <StatusLabel tone={statusPresentation.tone}>
            {statusPresentation.label}
          </StatusLabel>
        }
        description={[member.jobTitle, member.email ?? member.phone]
          .filter(Boolean)
          .join(" · ")}
        footer={
          canChange && (
            <>
              {abilities.canRemove && (
                <ActionButton
                  type="button"
                  variant="outline"
                  className="text-destructive sm:mr-auto"
                  onClick={() => openFor("remove")}
                >
                  Remove from organisation
                </ActionButton>
              )}
              {abilities.canSuspend &&
                (member.status === "SUSPENDED" ? (
                  <ActionButton
                    type="button"
                    variant="outline"
                    leadingIcon={<PlayIcon className="size-4" />}
                    onClick={() => openFor("reactivate")}
                  >
                    Reactivate
                  </ActionButton>
                ) : (
                  <ActionButton
                    type="button"
                    variant="outline"
                    leadingIcon={<PauseIcon className="size-4" />}
                    onClick={() => openFor("suspend")}
                  >
                    Suspend
                  </ActionButton>
                ))}
              {abilities.canUpdate && (
                <ActionButton
                  type="button"
                  leadingIcon={<EditIcon className="size-4" />}
                  onClick={() => openFor("access")}
                >
                  Edit access
                </ActionButton>
              )}
            </>
          )
        }
      >
        <div className="flex flex-col gap-8">
          {isOwn && (
            <NoticeBanner tone="information" title="This is you">
              You cannot change your own access. Ask another administrator.
            </NoticeBanner>
          )}
          {notice && <NoticeBanner tone="success" title={notice} />}
          {actionError && <NoticeBanner tone="error" title={actionError} />}
          {memberQuery.isError && (
            <NoticeBanner
              tone="warning"
              title="These details may be out of date"
              action={
                <ActionButton
                  type="button"
                  variant="outline"
                  onClick={() => void memberQuery.refetch()}
                >
                  Try again
                </ActionButton>
              }
            >
              {memberQuery.error.message}
            </NoticeBanner>
          )}

          <DetailSection heading="Access">
            <SummaryDetailList
              emptyValueLabel="None"
              details={[
                { label: "Roles", value: describeRoleNames(member.roles) },
                {
                  label: "Branches",
                  value: describeBranchScope(member, branches ?? []),
                },
                {
                  label: "Departments",
                  value:
                    departmentNames.length > 0
                      ? departmentNames.join(", ")
                      : null,
                },
                {
                  label: "Specialty",
                  value: labelFor(SPECIALTY_OPTIONS, member.specialty),
                },
                {
                  label: "Access ends",
                  value: member.accessEndsOn
                    ? `After ${formatDateText(member.accessEndsOn)}`
                    : "Permanent staff",
                },
              ]}
            />
          </DetailSection>

          <DetailSection heading="Contact and sign-in">
            <SummaryDetailList
              details={[
                { label: "Email address", value: member.email },
                { label: "Phone number", value: member.phone },
                {
                  label: "Last signed in",
                  value: formatDateTime(member.lastLoginAt) ?? "Not yet",
                },
                { label: "Joined", value: formatDateTime(member.createdAt) },
              ]}
            />
            {canChange && abilities.canUpdate && (
              <div className="flex flex-wrap gap-3">
                {canChangeEmail && (
                  <ActionButton
                    type="button"
                    variant="outline"
                    leadingIcon={<ChangeEmailIcon className="size-4" />}
                    onClick={() => openFor("change-email")}
                  >
                    Change sign-in email
                  </ActionButton>
                )}
                <ActionButton
                  type="button"
                  variant="outline"
                  leadingIcon={<ResetAuthenticatorIcon className="size-4" />}
                  onClick={() => openFor("reset-authenticator")}
                >
                  Reset authenticator
                </ActionButton>
              </div>
            )}
          </DetailSection>

          <DetailSection
            heading="Clinical licence"
            action={
              <StatusLabel tone={licencePresentation.tone}>
                {licencePresentation.label}
              </StatusLabel>
            }
          >
            <p className="text-sm text-muted-foreground">
              {licencePresentation.description}
            </p>
            {member.licence && (
              <SummaryDetailList
                details={[
                  {
                    label: "Regulator",
                    value: labelFor(LICENCE_BODY_OPTIONS, member.licence.body),
                  },
                  { label: "Licence number", value: member.licence.number },
                  {
                    label: "Expires on",
                    value: formatDateText(member.licence.expiresOn),
                  },
                  {
                    label: "Checked",
                    value: member.licence.verifiedAt
                      ? [
                          labelFor(
                            LICENCE_VERIFICATION_METHOD_OPTIONS,
                            member.licence.verificationMethod
                          ),
                          formatDateTime(member.licence.verifiedAt),
                          member.licence.verificationReference,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : "Not yet",
                  },
                ]}
              />
            )}
            {canChange && abilities.canUpdate && (
              <div className="flex flex-wrap gap-3">
                <ActionButton
                  type="button"
                  variant="outline"
                  leadingIcon={<LicenceIcon className="size-4" />}
                  onClick={() => openFor("licence")}
                >
                  {member.licence ? "Update licence" : "Add licence"}
                </ActionButton>
                {member.licence && !member.licence.verifiedAt && (
                  <ActionButton
                    type="button"
                    variant="outline"
                    onClick={() => openFor("licence-check")}
                  >
                    Record licence check
                  </ActionButton>
                )}
              </div>
            )}
          </DetailSection>

          <DetailSection heading="Approval limits">
            <SummaryDetailList
              details={[
                {
                  label: "Fee waivers",
                  value: formatNaira(member.approvalLimits.waiverKobo),
                },
                {
                  label: "Charges to a folder",
                  value: formatNaira(member.approvalLimits.billToFolderKobo),
                },
                {
                  label: "Discounts",
                  value:
                    member.approvalLimits.discountPercent === null
                      ? "No limit set"
                      : `${member.approvalLimits.discountPercent}%`,
                },
              ]}
            />
          </DetailSection>
        </div>
      </DetailSheet>

      {canChange && (
        <>
          <EditMemberAccessDialog
            member={member}
            open={openDialog === "access"}
            onOpenChange={(isOpen) => setOpenDialog(isOpen ? "access" : null)}
            scope={scope}
            roles={roles}
            branches={branches}
          />
          <MemberLicenceDialog
            member={member}
            open={openDialog === "licence"}
            onOpenChange={(isOpen) => setOpenDialog(isOpen ? "licence" : null)}
            scope={scope}
          />
          {canChangeEmail && (
            <ChangeMemberEmailDialog
              member={member}
              open={openDialog === "change-email"}
              onOpenChange={(isOpen) =>
                setOpenDialog(isOpen ? "change-email" : null)
              }
              onRequested={(result) =>
                setNotice(
                  `We emailed a confirmation link to ${result.pendingEmail}. ${fullName}'s sign-in email changes once they open it and choose a new password, before ${TEAM_DATE_TIME_FORMATTER.format(new Date(result.expiresAt))}. Their old address was told. If they also lost their phone, reset their authenticator too.`
                )
              }
            />
          )}
          <LicenceVerificationDialog
            member={member}
            open={openDialog === "licence-check"}
            onOpenChange={(isOpen) =>
              setOpenDialog(isOpen ? "licence-check" : null)
            }
            scope={scope}
          />
        </>
      )}

      <FormDialog
        open={openDialog === "suspend" || openDialog === "reactivate"}
        onOpenChange={(isOpen) => !isOpen && closeDialog()}
        title={
          openDialog === "suspend"
            ? `Suspend ${fullName}?`
            : `Reactivate ${fullName}?`
        }
        description={
          openDialog === "suspend"
            ? "They are signed out of this organisation at once and cannot sign back in until you reactivate them. Their records stay as they are."
            : member.accessEndsOn && member.accessEndsOn < todayAsDateText()
              ? "Their locum access period has ended. Extend or clear the last working day first, or reactivation will be refused."
              : "They can sign in and work again with their current roles."
        }
        submitLabel={openDialog === "suspend" ? "Suspend" : "Reactivate"}
        submittingLabel={
          openDialog === "suspend" ? "Suspending" : "Reactivating"
        }
        tone={openDialog === "suspend" ? "destructive" : "default"}
        isSubmitting={accessMutation.isPending}
        error={accessMutation.error?.message}
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          changeAccess(openDialog === "suspend" ? "suspend" : "reactivate");
        }}
      >
        {null}
      </FormDialog>

      <FormDialog
        open={openDialog === "reset-authenticator"}
        onOpenChange={(isOpen) => !isOpen && closeDialog()}
        title={`Reset ${fullName}'s authenticator?`}
        description="Use this when they have lost the phone with their authenticator app. They set up a new one the next time they sign in. If you have not entered your own authenticator code in the last 15 minutes, you will be asked for it first."
        submitLabel="Reset authenticator"
        submittingLabel="Resetting"
        tone="destructive"
        isSubmitting={resetMutation.isPending}
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          void resetAuthenticator();
        }}
      >
        {null}
      </FormDialog>

      <FormDialog
        open={openDialog === "remove"}
        onOpenChange={(isOpen) => !isOpen && closeDialog()}
        title={`Remove ${fullName}?`}
        description="They lose access to this organisation at once. Their past work stays on record. To bring them back, invite them again."
        submitLabel="Remove"
        submittingLabel="Removing"
        tone="destructive"
        isSubmitting={removalMutation.isPending}
        error={removalMutation.error?.message}
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          removeMember();
        }}
      >
        {null}
      </FormDialog>

      <StepUpDialog
        {...stepUpProtection.dialog}
        completingLabel="Resetting"
        authenticatorCodeLength={CODE_LENGTH}
        recoveryCodeMaximumLength={SIGN_IN_LIMITS.recoveryCodeMaximum}
      />
    </>
  );
}
