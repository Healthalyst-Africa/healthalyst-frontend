"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FilterBar } from "@healthalyst/ui/components/filter-bar";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import type { PlatformBranch } from "~/features/organization-management/types/organization-management";
import {
  TeamMemberSheet,
  type TeamMemberAbilities,
} from "~/features/team-management/components/team-member-sheet";
import {
  LICENCE_STATUS_PRESENTATION,
  STAFF_STATUS_FILTER_OPTIONS,
  STAFF_STATUS_PRESENTATION,
  TEAM_DATE_TIME_FORMATTER,
  TEAM_FIELD_LIMITS,
} from "~/features/team-management/config/team-management";
import {
  useTeamMembersQuery,
  type TeamScope,
} from "~/features/team-management/hooks/use-team-members";
import type {
  StaffMember,
  TeamRole,
} from "~/features/team-management/types/team-management";
import {
  describeBranchScope,
  describeFullName,
  describeRoleNames,
} from "~/features/team-management/utilities/describe-team";

const SEARCH_DELAY_MILLISECONDS = 300;

function createMemberColumns(
  branches: readonly PlatformBranch[]
): DataTableColumn<StaffMember>[] {
  return [
    {
      key: "person",
      label: "Person",
      size: "wide",
      getCell: (member) => ({
        kind: "text",
        primary: describeFullName(member),
        secondary: member.jobTitle ?? member.email ?? member.phone ?? undefined,
      }),
    },
    {
      key: "roles",
      label: "Roles",
      getCell: (member) => ({
        kind: "text",
        primary: describeRoleNames(member.roles),
        secondary: describeBranchScope(member, branches),
      }),
    },
    {
      key: "licence",
      label: "Licence",
      size: "compact",
      getCell: (member) => ({
        kind: "status",
        label: LICENCE_STATUS_PRESENTATION[member.licenceStatus].label,
        tone: LICENCE_STATUS_PRESENTATION[member.licenceStatus].tone,
      }),
    },
    {
      key: "status",
      label: "Status",
      size: "compact",
      getCell: (member) => ({
        kind: "status",
        ...STAFF_STATUS_PRESENTATION[member.status],
      }),
    },
    {
      key: "last-sign-in",
      label: "Last signed in",
      size: "compact",
      getCell: (member) =>
        member.lastLoginAt
          ? {
              kind: "date",
              label: TEAM_DATE_TIME_FORMATTER.format(
                new Date(member.lastLoginAt)
              ),
              dateTime: member.lastLoginAt,
            }
          : { kind: "text", primary: "Not yet" },
    },
  ];
}

export function TeamMembersSection({
  scope,
  currentUserId,
  roles,
  branches,
  abilities,
}: {
  scope: TeamScope;
  currentUserId: string;
  roles: readonly TeamRole[];
  branches: readonly PlatformBranch[] | null;
  abilities: TeamMemberAbilities;
}) {
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [branchId, setBranchId] = useState("");
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(
    null
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () => setAppliedSearchText(searchText.trim()),
      SEARCH_DELAY_MILLISECONDS
    );
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const searchIsTooShort =
    appliedSearchText.length > 0 &&
    appliedSearchText.length < TEAM_FIELD_LIMITS.searchMinimumLength;
  const membersQuery = useTeamMembersQuery(
    scope,
    {
      status: (status || undefined) as StaffMember["status"] | undefined,
      branchId: branchId || undefined,
      searchText: searchIsTooShort ? undefined : appliedSearchText,
    },
    true
  );
  const members =
    membersQuery.data?.pages.flatMap((page) => page.members) ?? [];
  const isFiltered = Boolean(
    appliedSearchText || branchId || status !== "ACTIVE"
  );

  return (
    <section
      aria-labelledby="team-members-heading"
      className="flex flex-col gap-4"
    >
      <SectionHeading
        headingIdentifier="team-members-heading"
        heading="Members"
        description="Everyone who works in your organisation on HealthAlyst."
      />
      <FilterBar
        accessibleLabel="Filter team members"
        identifier="team-members"
        search={{
          label: "Search members",
          placeholder: "Search by name, email or phone",
          value: searchText,
          onValueChange: setSearchText,
        }}
        filters={[
          {
            key: "status",
            label: "Status",
            options: STAFF_STATUS_FILTER_OPTIONS,
            allOptionsLabel: "All statuses",
            value: status,
            onValueChange: setStatus,
          },
          ...(branches && branches.length > 1
            ? [
                {
                  key: "branch",
                  label: "Branch",
                  options: branches.map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  })),
                  allOptionsLabel: "All branches",
                  value: branchId,
                  onValueChange: setBranchId,
                },
              ]
            : []),
        ]}
      />
      {searchIsTooShort && (
        <p className="text-sm text-muted-foreground">
          Type at least {TEAM_FIELD_LIMITS.searchMinimumLength} characters to
          search.
        </p>
      )}

      <DataTable
        accessibleLabel="Team members"
        columns={createMemberColumns(branches ?? [])}
        state={
          membersQuery.isPending
            ? { status: "loading", label: "Loading your team" }
            : membersQuery.isError && members.length === 0
              ? {
                  status: "error",
                  title: "We could not load your team",
                  description: membersQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void membersQuery.refetch(),
                }
              : { status: "ready", rows: members }
        }
        getRowIdentifier={(member) => member.membershipId}
        rowAction={{
          label: (member) => `Open ${describeFullName(member)}`,
          onSelect: setSelectedMember,
        }}
        emptyState={{
          illustration: <EmptySearchIllustration />,
          title: isFiltered ? "No members match" : "No members yet",
          description: isFiltered
            ? "Try another name, status or branch."
            : "Invite your team to start working together.",
        }}
      />

      {membersQuery.hasNextPage && (
        <div className="flex justify-center">
          <ActionButton
            type="button"
            variant="outline"
            isLoading={membersQuery.isFetchingNextPage}
            loadingText="Loading more members"
            onClick={() => void membersQuery.fetchNextPage()}
          >
            Show more members
          </ActionButton>
        </div>
      )}
      {membersQuery.isFetchNextPageError && (
        <p role="alert" className="text-center text-sm text-destructive">
          {membersQuery.error?.message}
        </p>
      )}

      <TeamMemberSheet
        selectedMember={selectedMember}
        onClose={() => setSelectedMember(null)}
        scope={scope}
        currentUserId={currentUserId}
        roles={roles}
        branches={branches}
        abilities={abilities}
      />
    </section>
  );
}
