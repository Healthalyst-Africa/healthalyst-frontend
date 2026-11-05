"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { StepUpDialog } from "@healthalyst/ui/components/step-up-dialog";
import { TextField } from "@healthalyst/ui/components/text-field";
import { useStepUpProtection } from "~/features/account-security/hooks/use-step-up-protection";
import { SIGN_IN_LIMITS } from "~/features/authentication/config/authentication-limits";
import { CODE_LENGTH } from "~/features/authentication/config/authenticator-enrolment";
import { useOwnershipTransferMutation } from "~/features/organization-management/hooks/use-platform-organization";
import {
  clearOwnershipTransfer,
  readOwnershipTransfer,
  rememberOwnershipTransfer,
} from "~/features/organization-settings/utilities/ownership-transfer-notice";
import { TEAM_FIELD_LIMITS } from "~/features/team-management/config/team-management";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import { useTeamMembersQuery } from "~/features/team-management/hooks/use-team-members";
import {
  describeFullName,
  describeRoleNames,
} from "~/features/team-management/utilities/describe-team";

const SEARCH_DELAY_MILLISECONDS = 300;

/**
 * Lets the owner hand the organisation to another active member. The owner
 * stays on as an administrator. Shown only to people who may transfer it.
 */
export function OrganizationOwnershipSection({
  organizationId,
  userId,
  canTransfer,
}: {
  organizationId: string;
  userId: string;
  canTransfer: boolean;
}) {
  const scope = { organizationId, userId };
  const transferMutation = useOwnershipTransferMutation(scope);
  const stepUpProtection = useStepUpProtection();
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { restoreSession, isRestoring: isRestoringSession } =
    usePlatformSession();
  // Set when this page returns after the session restore that follows a transfer.
  const [newOwnerName, setNewOwnerName] = useState<string | null>(
    readOwnershipTransfer
  );

  useEffect(() => {
    // Shown once: leaving and returning to settings starts fresh.
    if (!isRestoringSession) clearOwnershipTransfer();
  }, [isRestoringSession]);
  const membersQuery = useTeamMembersQuery(
    scope,
    {
      status: "ACTIVE",
      searchText:
        appliedSearchText.length >= TEAM_FIELD_LIMITS.searchMinimumLength
          ? appliedSearchText
          : undefined,
    },
    isOpen
  );
  const candidates = (
    membersQuery.data?.pages.flatMap((page) => page.members) ?? []
  ).filter((member) => member.userId !== userId);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setAppliedSearchText(searchText.trim()),
      SEARCH_DELAY_MILLISECONDS
    );
    return () => window.clearTimeout(timer);
  }, [searchText]);

  // After a transfer the person is no longer an owner, but they still see
  // what happened.
  if (!canTransfer && !newOwnerName) return null;

  function changeOpen(open: boolean) {
    if (!open && (transferMutation.isPending || stepUpProtection.dialog.open))
      return;
    if (open) {
      transferMutation.reset();
      setFieldErrors({});
      setSearchText("");
    }
    setIsOpen(open);
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formData = new FormData(formEvent.currentTarget);
    const membershipId = String(formData.get("membershipId") ?? "");
    const errors: Record<string, string> = {};
    if (!membershipId) errors.membershipId = "Choose the new owner.";
    if (formData.get("confirmed") !== "on") {
      errors.confirmed = "Confirm that you understand what changes.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const newOwner = candidates.find(
      (member) => member.membershipId === membershipId
    );
    const name = newOwner ? describeFullName(newOwner) : "The new owner";
    await stepUpProtection.runProtected({
      description: `make ${name} the owner`,
      run: async () => {
        await transferMutation.mutateAsync(membershipId);
        // Restoring the session unmounts this page, so keep the result first.
        rememberOwnershipTransfer(name);
        setIsOpen(false);
        setNewOwnerName(name);
        await restoreSession();
      },
    });
  }

  return (
    <section
      aria-labelledby="organization-ownership-heading"
      className="flex flex-col gap-4"
    >
      <SectionHeading
        headingIdentifier="organization-ownership-heading"
        heading="Ownership"
        description="The owner can do everything, including handing the organisation to someone else."
      />
      {newOwnerName ? (
        <NoticeBanner
          tone="success"
          title={`${newOwnerName} now owns the organisation`}
        >
          You are an administrator now. To have more than one owner, give the
          Owner role to someone on the team page instead.
        </NoticeBanner>
      ) : (
        <div>
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => changeOpen(true)}
          >
            Transfer ownership
          </ActionButton>
        </div>
      )}

      <FormDialog
        open={isOpen}
        onOpenChange={changeOpen}
        title="Transfer ownership"
        description="Choose an active member. They become the owner and you stay on as an administrator. You will both get an email."
        submitLabel="Transfer ownership"
        submittingLabel="Transferring"
        tone="destructive"
        isSubmitting={transferMutation.isPending}
        error={
          transferMutation.error && !stepUpProtection.dialog.open
            ? transferMutation.error.message
            : ""
        }
        onSubmit={(formEvent) => void handleSubmit(formEvent)}
      >
        <TextField
          id="ownership-search"
          label="Find a team member"
          type="search"
          value={searchText}
          onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
          placeholder="Name, email or phone"
          maxLength={TEAM_FIELD_LIMITS.searchMaximumLength}
        />
        <SelectField
          // Remount when the results change so a stale choice is cleared.
          key={appliedSearchText}
          id="ownership-membershipId"
          label="New owner"
          name="membershipId"
          placeholder={
            membersQuery.isPending
              ? "Loading team members"
              : candidates.length > 0
                ? "Choose a team member"
                : "No matching active members"
          }
          options={candidates.map((member) => ({
            value: member.membershipId,
            label: `${describeFullName(member)} (${describeRoleNames(member.roles)})`,
          }))}
          disabled={candidates.length === 0}
          error={
            fieldErrors.membershipId ??
            (membersQuery.isError ? membersQuery.error.message : undefined)
          }
        />
        <CheckboxField
          id="ownership-confirmed"
          name="confirmed"
          label="I understand I will become an administrator and lose owner-only actions, such as transferring ownership."
          error={fieldErrors.confirmed}
        />
      </FormDialog>

      <StepUpDialog
        {...stepUpProtection.dialog}
        completingLabel="Transferring"
        authenticatorCodeLength={CODE_LENGTH}
        recoveryCodeMaximumLength={SIGN_IN_LIMITS.recoveryCodeMaximum}
      />
    </section>
  );
}
