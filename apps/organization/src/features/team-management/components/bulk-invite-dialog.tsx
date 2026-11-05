"use client";

import { useState, type FormEvent } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import type { PlatformBranch } from "~/features/organization-management/types/organization-management";
import { TeamAccessFields } from "~/features/team-management/components/team-access-fields";
import { TEAM_FIELD_LIMITS } from "~/features/team-management/config/team-management";
import { useBulkStaffInvitationMutation } from "~/features/team-management/hooks/use-team-invitations";
import type { TeamScope } from "~/features/team-management/hooks/use-team-members";
import { bulkInvitationFormSchema } from "~/features/team-management/schemas/team-form-schemas";
import type {
  StaffInvitationRequest,
  TeamRole,
} from "~/features/team-management/types/team-management";
import {
  describeBulkInvitationFailures,
  describeFullName,
  readBulkInvitationRows,
} from "~/features/team-management/utilities/describe-team";
import { INTERNATIONAL_PHONE_PATTERN } from "~/shared/organization/config/organization-validation";
import { toInternationalPhoneNumber } from "~/shared/organization/utilities/international-phone-number";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

type BulkInvitationReport = {
  sentCount: number;
  failures: { name: string; message: string }[];
};

/** Invite several people with the same roles and branches in one go. */
export function BulkInviteDialog({
  open,
  onOpenChange,
  scope,
  roles,
  branches,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: TeamScope;
  roles: readonly TeamRole[];
  branches: readonly PlatformBranch[] | null;
}) {
  const bulkMutation = useBulkStaffInvitationMutation(scope);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lineProblems, setLineProblems] = useState<string[]>([]);
  const [report, setReport] = useState<BulkInvitationReport | null>(null);
  const serverFieldErrors =
    bulkMutation.error instanceof PlatformApiError
      ? bulkMutation.error.fieldErrors
      : {};
  const visibleFieldErrors = { ...serverFieldErrors, ...fieldErrors };

  function changeOpen(isOpen: boolean) {
    if (!isOpen && bulkMutation.isPending) return;
    if (isOpen) {
      bulkMutation.reset();
      setFieldErrors({});
      setLineProblems([]);
    }
    onOpenChange(isOpen);
  }

  function summarise(
    invitations: StaffInvitationRequest[],
    results: Awaited<ReturnType<typeof bulkMutation.mutateAsync>>
  ): BulkInvitationReport {
    const failures = results
      .filter((result) => result.status === "FAILED")
      .map((result) => {
        const invitation = invitations[result.index];
        return {
          name: invitation
            ? describeFullName(invitation)
            : `Row ${result.index + 1}`,
          message: result.error?.message ?? "This invitation was not sent.",
        };
      });
    return { sentCount: results.length - failures.length, failures };
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      bulkInvitationFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      setLineProblems([]);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    const rows = readBulkInvitationRows(
      result.data.people,
      {
        roleIds: result.data.roleIds,
        allBranches: result.data.allBranches,
        branchIds: result.data.branchIds,
        departmentIds: result.data.departmentIds,
      },
      toInternationalPhoneNumber,
      INTERNATIONAL_PHONE_PATTERN
    );
    setFieldErrors({});
    if (!rows.success) {
      setLineProblems(rows.problems);
      focusFirstInvalidField(formElement, { people: rows.problems[0] ?? "" });
      return;
    }
    setLineProblems([]);
    bulkMutation.mutate(rows.invitations, {
      onSuccess: (results) => {
        onOpenChange(false);
        setReport(summarise(rows.invitations, results));
      },
    });
  }

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={changeOpen}
        title="Invite several people"
        description="Everyone on the list gets the same roles and branches. You can change each person afterwards."
        submitLabel="Send invitations"
        submittingLabel="Sending invitations"
        isSubmitting={bulkMutation.isPending}
        error={
          bulkMutation.error && Object.keys(serverFieldErrors).length === 0
            ? bulkMutation.error.message
            : ""
        }
        onSubmit={handleSubmit}
      >
        <TextAreaField
          id="bulk-invitation-people"
          label="People"
          name="people"
          rows={8}
          placeholder={
            "Amaka, Obi, amaka.obi@example.com, Nurse\nTunde, Bello, 08031234567"
          }
          description={`One person per line: first name, last name, email or phone, and an optional job title. Up to ${TEAM_FIELD_LIMITS.bulkInvitationMaximum} people.`}
          error={visibleFieldErrors.people}
        />
        {lineProblems.length > 0 && (
          <NoticeBanner tone="error" title="Fix these lines and try again">
            <ul className="list-disc pl-5">
              {lineProblems.slice(0, 10).map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
            {lineProblems.length > 10 && (
              <p>And {lineProblems.length - 10} more.</p>
            )}
          </NoticeBanner>
        )}
        <TeamAccessFields
          identifierPrefix="bulk-invitation"
          roles={roles}
          branches={branches}
          errors={visibleFieldErrors}
        />
      </FormDialog>

      <FeedbackDialog
        open={report !== null}
        onOpenChange={(isOpen) => !isOpen && setReport(null)}
        tone={report && report.failures.length > 0 ? "warning" : "success"}
        title={
          report
            ? `${report.sentCount} ${report.sentCount === 1 ? "invitation" : "invitations"} sent`
            : ""
        }
        // The description is a single paragraph, so failures are text.
        description={
          report && report.failures.length > 0
            ? describeBulkInvitationFailures(report.failures)
            : "Everyone on the list has a link to join. Links work for 72 hours."
        }
        primaryAction={{ label: "Done", onSelect: () => setReport(null) }}
      />
    </>
  );
}
