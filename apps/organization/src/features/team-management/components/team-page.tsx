"use client";

import { useState } from "react";
import Link from "next/link";
import { InviteIcon, RolesIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { PageBreadcrumbs } from "@healthalyst/ui/components/page-breadcrumbs";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { usePlatformBranchesQuery } from "~/features/organization-management/hooks/use-platform-organization";
import { OrganizationSettingsFrame } from "~/features/organization-settings/components/organization-settings-frame";
import { BulkInviteDialog } from "~/features/team-management/components/bulk-invite-dialog";
import { InviteMemberDialog } from "~/features/team-management/components/invite-member-dialog";
import { TeamInvitationsSection } from "~/features/team-management/components/team-invitations-section";
import { TeamMembersSection } from "~/features/team-management/components/team-members-section";
import { TEAM_PERMISSIONS } from "~/features/team-management/config/team-management";
import type { TeamScope } from "~/features/team-management/hooks/use-team-members";
import { useTeamRolesQuery } from "~/features/team-management/hooks/use-team-roles";
import { describeFullName } from "~/features/team-management/utilities/describe-team";

function TeamWorkspace({
  scope,
  permissions,
}: {
  scope: TeamScope;
  permissions: readonly string[];
}) {
  const canReadStaff = permissions.includes(TEAM_PERMISSIONS.readStaff);
  const canInvite = permissions.includes(TEAM_PERMISSIONS.inviteStaff);
  const canReadRoles = permissions.includes(TEAM_PERMISSIONS.readRoles);
  const canReadBranches = permissions.includes(TEAM_PERMISSIONS.readBranches);
  const rolesQuery = useTeamRolesQuery(scope, canReadRoles);
  const branchesQuery = usePlatformBranchesQuery({
    organizationId: canReadBranches ? scope.organizationId : null,
    userId: scope.userId,
  });
  const [isInviting, setIsInviting] = useState(false);
  const [isBulkInviting, setIsBulkInviting] = useState(false);
  const [invitedName, setInvitedName] = useState<string | null>(null);
  const roles = rolesQuery.data ?? [];
  const branches = canReadBranches ? (branchesQuery.data ?? null) : null;
  // Inviting needs the role list, since every invitation names roles.
  const canOpenInvite = canInvite && canReadRoles && rolesQuery.isSuccess;

  if (!canReadStaff) {
    return (
      <StateNotice tone="information" title="You cannot see the team">
        Your roles do not include viewing staff. Ask an organisation
        administrator if you need this.
      </StateNotice>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {canInvite && rolesQuery.isError && (
        <NoticeBanner
          tone="error"
          title="We could not load your roles, so you cannot invite anyone yet"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void rolesQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          {rolesQuery.error.message}
        </NoticeBanner>
      )}
      {invitedName && (
        <NoticeBanner
          tone="success"
          title={`Invitation sent to ${invitedName}`}
        >
          They join your team when they accept. Their link works for 72 hours.
        </NoticeBanner>
      )}

      {canOpenInvite && (
        <div className="flex flex-wrap gap-3">
          <ActionButton
            type="button"
            leadingIcon={<InviteIcon className="size-4" />}
            onClick={() => {
              setInvitedName(null);
              setIsInviting(true);
            }}
          >
            Invite a team member
          </ActionButton>
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => {
              setInvitedName(null);
              setIsBulkInviting(true);
            }}
          >
            Invite several people
          </ActionButton>
        </div>
      )}

      <TeamMembersSection
        scope={scope}
        currentUserId={scope.userId}
        roles={roles}
        branches={branches}
        abilities={{
          // Editing roles needs the role list as well as permission to update.
          canUpdate:
            permissions.includes(TEAM_PERMISSIONS.updateStaff) &&
            rolesQuery.isSuccess,
          canSuspend: permissions.includes(TEAM_PERMISSIONS.suspendStaff),
          canRemove: permissions.includes(TEAM_PERMISSIONS.removeStaff),
        }}
      />
      <TeamInvitationsSection
        scope={scope}
        branches={branches}
        canInvite={canInvite}
        enabled={canReadStaff}
      />

      {canOpenInvite && (
        <>
          <InviteMemberDialog
            open={isInviting}
            onOpenChange={setIsInviting}
            scope={scope}
            roles={roles}
            branches={branches}
            onInvited={(invitation) =>
              setInvitedName(describeFullName(invitation))
            }
          />
          <BulkInviteDialog
            open={isBulkInviting}
            onOpenChange={setIsBulkInviting}
            scope={scope}
            roles={roles}
            branches={branches}
          />
        </>
      )}
    </div>
  );
}

/** The organisation's members and invitations. */
export function TeamPage() {
  return (
    <OrganizationSettingsFrame>
      {(settings) => (
        <div className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="mb-2">
                <PageBreadcrumbs
                  linkComponent={Link}
                  trail={[
                    { label: "Products", href: ORGANIZATION_ROUTES.products },
                    {
                      label: "Organisation settings",
                      href: ORGANIZATION_ROUTES.organizationSettings,
                    },
                  ]}
                  currentPage="Team"
                />
              </div>
              <h1 className="font-serif text-display font-normal">Team</h1>
              <p className="text-body text-muted-foreground">
                Invite people to {settings.organizationName} and decide what
                each person can do.
              </p>
            </div>
            {settings.permissions.includes(TEAM_PERMISSIONS.readRoles) && (
              <Link
                href={ORGANIZATION_ROUTES.teamRoles}
                className="inline-flex items-center gap-2 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <RolesIcon className="size-4" aria-hidden="true" />
                Roles and permissions
              </Link>
            )}
          </div>
          <TeamWorkspace
            scope={{
              organizationId: settings.organizationId,
              userId: settings.userId,
            }}
            permissions={settings.permissions}
          />
        </div>
      )}
    </OrganizationSettingsFrame>
  );
}
