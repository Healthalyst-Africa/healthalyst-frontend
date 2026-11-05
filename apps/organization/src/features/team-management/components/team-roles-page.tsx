"use client";

import { useState } from "react";
import Link from "next/link";
import { AddIcon, DeleteIcon, EditIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { PageBreadcrumbs } from "@healthalyst/ui/components/page-breadcrumbs";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { EmptyOrganizationsIllustration } from "@healthalyst/ui/illustrations/empty-organizations-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { OrganizationSettingsFrame } from "~/features/organization-settings/components/organization-settings-frame";
import { TeamRoleDialog } from "~/features/team-management/components/team-role-dialog";
import { TEAM_PERMISSIONS } from "~/features/team-management/config/team-management";
import type { TeamScope } from "~/features/team-management/hooks/use-team-members";
import {
  useTeamPermissionsQuery,
  useTeamRoleDeleteMutation,
  useTeamRolesQuery,
} from "~/features/team-management/hooks/use-team-roles";
import type { TeamRole } from "~/features/team-management/types/team-management";
import { groupPermissionsByArea } from "~/features/team-management/utilities/describe-team";

const ROLE_COLUMNS: readonly DataTableColumn<TeamRole>[] = [
  {
    key: "role",
    label: "Role",
    size: "wide",
    getCell: (role) => ({
      kind: "text",
      primary: role.name,
      secondary: `${role.permissions.length} ${role.permissions.length === 1 ? "permission" : "permissions"}`,
    }),
  },
  {
    key: "type",
    label: "Type",
    size: "compact",
    getCell: (role) => ({
      kind: "status",
      label: role.isPreset ? "Preset" : "Custom",
      tone: role.isPreset ? "neutral" : "information",
    }),
  },
  {
    key: "members",
    label: "People",
    size: "compact",
    getCell: (role) => ({ kind: "text", primary: String(role.memberCount) }),
  },
];

/** Presets first, then custom roles, each by name. */
function sortRoles(roles: readonly TeamRole[]) {
  return [...roles].sort(
    (first, second) =>
      Number(second.isPreset) - Number(first.isPreset) ||
      first.name.localeCompare(second.name)
  );
}

function RolesWorkspace({
  scope,
  permissions,
}: {
  scope: TeamScope;
  permissions: readonly string[];
}) {
  const canReadRoles = permissions.includes(TEAM_PERMISSIONS.readRoles);
  const canManageRoles = permissions.includes(TEAM_PERMISSIONS.manageRoles);
  const rolesQuery = useTeamRolesQuery(scope, canReadRoles);
  const catalogueQuery = useTeamPermissionsQuery(scope, canReadRoles);
  const deleteMutation = useTeamRoleDeleteMutation(scope);
  const [selectedRole, setSelectedRole] = useState<TeamRole | null>(null);
  const [editingRole, setEditingRole] = useState<TeamRole | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const catalogue = catalogueQuery.data ?? [];
  const canEditRoles = canManageRoles && catalogueQuery.isSuccess;
  // The sheet shows the saved role, refreshed after edits.
  const shownRole = selectedRole
    ? (rolesQuery.data?.find((role) => role.id === selectedRole.id) ??
      selectedRole)
    : null;

  if (!canReadRoles) {
    return (
      <StateNotice tone="information" title="You cannot see roles">
        Your roles do not include viewing roles and permissions. Ask an
        organisation administrator if you need this.
      </StateNotice>
    );
  }

  function deleteRole() {
    if (!shownRole) return;
    const roleName = shownRole.name;
    deleteMutation.mutate(shownRole.id, {
      onSuccess: () => {
        setIsConfirmingDelete(false);
        setSelectedRole(null);
        setNotice(`${roleName} is deleted.`);
      },
    });
  }

  const permissionLabels = new Map(
    catalogue.map((permission) => [permission.code, permission.description])
  );
  const shownAreas = shownRole
    ? groupPermissionsByArea(
        shownRole.permissions.map((code) => ({
          code,
          description: permissionLabels.get(code) ?? code,
        }))
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      {notice && <NoticeBanner tone="success" title={notice} />}
      {catalogueQuery.isError && (
        <NoticeBanner
          tone="warning"
          title="We could not load the permission list"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void catalogueQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          Permissions show by their codes, and you cannot create or edit roles
          until it loads.
        </NoticeBanner>
      )}
      {canEditRoles && (
        <div>
          <ActionButton
            type="button"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={() => {
              setNotice(null);
              setEditingRole(null);
              setIsCreating(true);
            }}
          >
            Create a role
          </ActionButton>
        </div>
      )}

      <DataTable
        accessibleLabel="Roles"
        columns={ROLE_COLUMNS}
        state={
          rolesQuery.isPending
            ? { status: "loading", label: "Loading roles" }
            : rolesQuery.isError
              ? {
                  status: "error",
                  title: "We could not load your roles",
                  description: rolesQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void rolesQuery.refetch(),
                }
              : { status: "ready", rows: sortRoles(rolesQuery.data) }
        }
        getRowIdentifier={(role) => role.id}
        rowAction={{
          label: (role) => `View ${role.name}`,
          onSelect: (role) => {
            setNotice(null);
            deleteMutation.reset();
            setSelectedRole(role);
          },
        }}
        emptyState={{
          illustration: <EmptyOrganizationsIllustration />,
          title: "No roles yet",
        }}
      />

      <DetailSheet
        open={shownRole !== null}
        onOpenChange={(isOpen) => !isOpen && setSelectedRole(null)}
        title={shownRole?.name ?? ""}
        titleAccessory={
          shownRole && (
            <StatusLabel tone={shownRole.isPreset ? "neutral" : "information"}>
              {shownRole.isPreset ? "Preset" : "Custom"}
            </StatusLabel>
          )
        }
        description={
          shownRole
            ? `${shownRole.memberCount} ${shownRole.memberCount === 1 ? "person holds" : "people hold"} this role.`
            : undefined
        }
        footer={
          shownRole &&
          !shownRole.isPreset &&
          canEditRoles && (
            <>
              <ActionButton
                type="button"
                variant="outline"
                className="text-destructive sm:mr-auto"
                leadingIcon={<DeleteIcon className="size-4" />}
                disabled={shownRole.memberCount > 0}
                onClick={() => {
                  deleteMutation.reset();
                  setIsConfirmingDelete(true);
                }}
              >
                Delete role
              </ActionButton>
              <ActionButton
                type="button"
                leadingIcon={<EditIcon className="size-4" />}
                onClick={() => {
                  setEditingRole(shownRole);
                  setIsCreating(false);
                }}
              >
                Edit role
              </ActionButton>
            </>
          )
        }
      >
        {shownRole && (
          <div className="flex flex-col gap-6">
            {shownRole.isPreset && (
              <NoticeBanner
                tone="information"
                title="HealthAlyst sets this role"
              >
                Preset roles cannot be changed. Create a custom role for a
                different set of permissions.
              </NoticeBanner>
            )}
            {!shownRole.isPreset &&
              canEditRoles &&
              shownRole.memberCount > 0 && (
                <NoticeBanner tone="neutral" title="This role is in use">
                  Move everyone to another role before deleting it.
                </NoticeBanner>
              )}
            {shownAreas.map((area) => (
              <section key={area.key} className="flex flex-col gap-2">
                <h3 className="text-base font-medium">{area.label}</h3>
                <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                  {area.permissions.map((permission) => (
                    <li key={permission.code}>{permission.description}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </DetailSheet>

      {canEditRoles && (
        <TeamRoleDialog
          // A fresh form for each role, so its defaults are the saved values.
          key={editingRole?.id ?? "new-role"}
          role={editingRole}
          open={isCreating || editingRole !== null}
          onOpenChange={(isOpen) => {
            if (isOpen) return;
            setIsCreating(false);
            setEditingRole(null);
          }}
          scope={scope}
          catalogue={catalogue}
          heldPermissions={permissions}
        />
      )}

      <FormDialog
        open={isConfirmingDelete}
        onOpenChange={(isOpen) =>
          !isOpen && !deleteMutation.isPending && setIsConfirmingDelete(false)
        }
        title={shownRole ? `Delete ${shownRole.name}?` : "Delete role?"}
        description="This cannot be undone."
        submitLabel="Delete role"
        submittingLabel="Deleting role"
        tone="destructive"
        isSubmitting={deleteMutation.isPending}
        error={deleteMutation.error?.message}
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          deleteRole();
        }}
      >
        {null}
      </FormDialog>
    </div>
  );
}

/** The organisation's preset and custom roles and what each one allows. */
export function TeamRolesPage() {
  return (
    <OrganizationSettingsFrame>
      {(settings) => (
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <div className="mb-2">
              <PageBreadcrumbs
                linkComponent={Link}
                trail={[
                  { label: "Products", href: ORGANIZATION_ROUTES.products },
                  { label: "Team", href: ORGANIZATION_ROUTES.team },
                ]}
                currentPage="Roles and permissions"
              />
            </div>
            <h1 className="font-serif text-display font-normal">
              Roles and permissions
            </h1>
            <p className="text-body text-muted-foreground">
              A role is a set of permissions. Give people roles when you invite
              them or from their details on the team page.
            </p>
          </div>
          <RolesWorkspace
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
