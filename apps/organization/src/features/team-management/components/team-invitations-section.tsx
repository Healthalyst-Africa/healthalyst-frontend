"use client";

import { useState } from "react";
import { ResendIcon, RevokeIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SummaryDetailList } from "@healthalyst/ui/components/review-summary";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { EmailSentIllustration } from "@healthalyst/ui/illustrations/email-sent-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import type { PlatformBranch } from "~/features/organization-management/types/organization-management";
import {
  INVITATION_STATUS_PRESENTATION,
  TEAM_DATE_TIME_FORMATTER,
} from "~/features/team-management/config/team-management";
import {
  useInvitationActionMutation,
  useTeamInvitationsQuery,
} from "~/features/team-management/hooks/use-team-invitations";
import type { TeamScope } from "~/features/team-management/hooks/use-team-members";
import type { StaffInvitation } from "~/features/team-management/types/team-management";
import {
  describeBranchScope,
  describeFullName,
  describeRoleNames,
} from "~/features/team-management/utilities/describe-team";

const INVITATION_COLUMNS: readonly DataTableColumn<StaffInvitation>[] = [
  {
    key: "person",
    label: "Person",
    size: "wide",
    getCell: (invitation) => ({
      kind: "text",
      primary: describeFullName(invitation),
      secondary: invitation.email ?? invitation.phone ?? undefined,
    }),
  },
  {
    key: "roles",
    label: "Roles",
    getCell: (invitation) => ({
      kind: "text",
      primary: describeRoleNames(invitation.roles),
    }),
  },
  {
    key: "status",
    label: "Status",
    size: "compact",
    getCell: (invitation) => ({
      kind: "status",
      ...INVITATION_STATUS_PRESENTATION[invitation.status],
    }),
  },
  {
    key: "expires",
    label: "Link expires",
    size: "compact",
    getCell: (invitation) => ({
      kind: "date",
      label: TEAM_DATE_TIME_FORMATTER.format(new Date(invitation.expiresAt)),
      dateTime: invitation.expiresAt,
    }),
  },
];

/** Invitations people have not accepted yet, newest first. */
function sortInvitations(invitations: readonly StaffInvitation[]) {
  const openStatuses = new Set(["PENDING", "EXPIRED"]);
  return invitations
    .filter((invitation) => openStatuses.has(invitation.status))
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

export function TeamInvitationsSection({
  scope,
  branches,
  canInvite,
  enabled,
}: {
  scope: TeamScope;
  branches: readonly PlatformBranch[] | null;
  canInvite: boolean;
  enabled: boolean;
}) {
  const invitationsQuery = useTeamInvitationsQuery(scope, enabled);
  const actionMutation = useInvitationActionMutation(scope);
  const [selectedInvitation, setSelectedInvitation] =
    useState<StaffInvitation | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function runAction(action: "resend" | "revoke") {
    if (!selectedInvitation) return;
    const name = describeFullName(selectedInvitation);
    actionMutation.mutate(
      { invitationId: selectedInvitation.id, action },
      {
        onSuccess: () => {
          setSelectedInvitation(null);
          setNotice(
            action === "resend"
              ? `A new link is on its way to ${name}. The old link no longer works.`
              : `${name}'s invitation is cancelled.`
          );
        },
      }
    );
  }

  const openInvitations = sortInvitations(invitationsQuery.data ?? []);
  const selectedPresentation = selectedInvitation
    ? INVITATION_STATUS_PRESENTATION[selectedInvitation.status]
    : null;

  return (
    <section
      aria-labelledby="team-invitations-heading"
      className="flex flex-col gap-4"
    >
      <SectionHeading
        headingIdentifier="team-invitations-heading"
        heading="Invitations"
        description="People who have not joined yet. Links work for 72 hours."
      />
      {notice && <NoticeBanner tone="success" title={notice} />}

      <DataTable
        accessibleLabel="Invitations waiting to be accepted"
        columns={INVITATION_COLUMNS}
        state={
          invitationsQuery.isPending
            ? { status: "loading", label: "Loading invitations" }
            : invitationsQuery.isError
              ? {
                  status: "error",
                  title: "We could not load your invitations",
                  description: invitationsQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void invitationsQuery.refetch(),
                }
              : { status: "ready", rows: openInvitations }
        }
        getRowIdentifier={(invitation) => invitation.id}
        rowAction={
          canInvite
            ? {
                label: (invitation) =>
                  `Manage the invitation for ${describeFullName(invitation)}`,
                onSelect: (invitation) => {
                  actionMutation.reset();
                  setNotice(null);
                  setSelectedInvitation(invitation);
                },
              }
            : undefined
        }
        emptyState={{
          illustration: <EmailSentIllustration />,
          title: "No invitations waiting",
          description: "Everyone you invited has joined.",
        }}
      />

      <DetailSheet
        open={selectedInvitation !== null}
        onOpenChange={(isOpen) =>
          !isOpen && !actionMutation.isPending && setSelectedInvitation(null)
        }
        title={selectedInvitation ? describeFullName(selectedInvitation) : ""}
        titleAccessory={
          selectedPresentation && (
            <StatusLabel tone={selectedPresentation.tone}>
              {selectedPresentation.label}
            </StatusLabel>
          )
        }
        description={
          selectedInvitation?.email ?? selectedInvitation?.phone ?? undefined
        }
        footer={
          <>
            <ActionButton
              type="button"
              variant="outline"
              className="text-destructive sm:mr-auto"
              leadingIcon={<RevokeIcon className="size-4" />}
              disabled={actionMutation.isPending}
              onClick={() => runAction("revoke")}
            >
              Cancel invitation
            </ActionButton>
            <ActionButton
              type="button"
              leadingIcon={<ResendIcon className="size-4" />}
              isLoading={
                actionMutation.isPending &&
                actionMutation.variables?.action === "resend"
              }
              loadingText="Sending"
              disabled={actionMutation.isPending}
              onClick={() => runAction("resend")}
            >
              Send a new link
            </ActionButton>
          </>
        }
      >
        {selectedInvitation && (
          <div className="flex flex-col gap-6">
            {actionMutation.error && (
              <NoticeBanner tone="error" title={actionMutation.error.message} />
            )}
            {selectedInvitation.status === "EXPIRED" && (
              <NoticeBanner tone="warning" title="This link has expired">
                Send a new link so they can still join.
              </NoticeBanner>
            )}
            <SummaryDetailList
              details={[
                {
                  label: "Roles",
                  value: describeRoleNames(selectedInvitation.roles),
                },
                {
                  label: "Branches",
                  value: describeBranchScope(
                    selectedInvitation,
                    branches ?? []
                  ),
                },
                {
                  label: "Invited",
                  value: TEAM_DATE_TIME_FORMATTER.format(
                    new Date(selectedInvitation.createdAt)
                  ),
                },
                {
                  label: "Link expires",
                  value: TEAM_DATE_TIME_FORMATTER.format(
                    new Date(selectedInvitation.expiresAt)
                  ),
                },
                {
                  label: "Times sent",
                  value: String(selectedInvitation.sendCount),
                },
              ]}
            />
          </div>
        )}
      </DetailSheet>
    </section>
  );
}
