"use client";

import { useState } from "react";
import { AddIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";
import { AddStaffDialog } from "~/features/staff-management/components/add-staff-dialog";
import { StaffMemberSheet } from "~/features/staff-management/components/staff-member-sheet";
import {
  PLATFORM_STAFF_STATUS_PRESENTATION,
  STAFF_DATE_TIME_FORMATTER,
  STAFF_MANAGEMENT_ROLES,
} from "~/features/staff-management/config/staff-management";
import { usePlatformStaffQuery } from "~/features/staff-management/hooks/use-platform-staff";
import type { PlatformStaffMember } from "~/features/staff-management/types/staff-management";
import {
  describePlatformRoles,
  describeStaffName,
} from "~/features/staff-management/utilities/describe-platform-staff";
import { useStaffSession } from "~/infrastructure/auth/staff-session-provider";

const STAFF_COLUMNS: readonly DataTableColumn<PlatformStaffMember>[] = [
  {
    key: "person",
    label: "Person",
    size: "wide",
    getCell: (staffMember) => ({
      kind: "text",
      primary: describeStaffName(staffMember),
      secondary: staffMember.email ?? undefined,
    }),
  },
  {
    key: "roles",
    label: "Roles",
    getCell: (staffMember) => ({
      kind: "text",
      primary: describePlatformRoles(staffMember.roles),
    }),
  },
  {
    key: "authenticator",
    label: "Authenticator",
    size: "compact",
    getCell: (staffMember) =>
      staffMember.mfaEnrolled
        ? { kind: "status", label: "Set up", tone: "positive" }
        : { kind: "status", label: "Not set up", tone: "warning" },
  },
  {
    key: "status",
    label: "Status",
    size: "compact",
    getCell: (staffMember) => ({
      kind: "status",
      ...PLATFORM_STAFF_STATUS_PRESENTATION[staffMember.status],
    }),
  },
  {
    key: "last-sign-in",
    label: "Last signed in",
    size: "compact",
    getCell: (staffMember) =>
      staffMember.lastLoginAt
        ? {
            kind: "date",
            label: STAFF_DATE_TIME_FORMATTER.format(
              new Date(staffMember.lastLoginAt)
            ),
            dateTime: staffMember.lastLoginAt,
          }
        : { kind: "text", primary: "Not yet" },
  },
];

export function StaffManagementPage() {
  const { staffIdentity } = useStaffSession();
  if (!staffIdentity) return null;
  const canManageStaff = STAFF_MANAGEMENT_ROLES.some((role) =>
    staffIdentity.platformRoles.includes(role)
  );
  return (
    <>
      <div>
        <h1 className="font-serif text-title font-normal tracking-tight">
          HealthAlyst staff
        </h1>
        <p className="mt-2 text-lede text-muted-foreground">
          Who can use the staff app, and what each person can do.
        </p>
      </div>
      {canManageStaff ? (
        <StaffDirectory staffIdentity={staffIdentity} />
      ) : (
        <StateNotice tone="warning" title="Only super admins can manage staff">
          Ask a super admin if you need to see or change staff access.
        </StateNotice>
      )}
    </>
  );
}

function StaffDirectory({ staffIdentity }: { staffIdentity: StaffIdentity }) {
  const staffQuery = usePlatformStaffQuery(staffIdentity);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const staffMembers = staffQuery.data ?? [];
  // Read the person from the latest list so the sheet shows saved changes.
  const selectedStaffMember =
    staffMembers.find((staffMember) => staffMember.id === selectedStaffId) ??
    null;

  return (
    <section aria-label="Staff members" className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ActionButton
          type="button"
          leadingIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Add staff member
        </ActionButton>
      </div>
      <DataTable
        accessibleLabel="HealthAlyst staff"
        columns={STAFF_COLUMNS}
        state={
          staffQuery.isPending
            ? { status: "loading", label: "Loading HealthAlyst staff" }
            : staffQuery.isError
              ? {
                  status: "error",
                  title: "We could not load HealthAlyst staff",
                  description: staffQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void staffQuery.refetch(),
                }
              : { status: "ready", rows: staffMembers }
        }
        getRowIdentifier={(staffMember) => staffMember.id}
        rowAction={{
          label: (staffMember) => `Open ${describeStaffName(staffMember)}`,
          onSelect: (staffMember) => setSelectedStaffId(staffMember.id),
        }}
        emptyState={{
          illustration: <EmptySearchIllustration />,
          title: "No staff yet",
          description: "Add a staff member to give them access.",
        }}
      />

      <AddStaffDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        staffIdentity={staffIdentity}
      />
      <StaffMemberSheet
        staffMember={selectedStaffMember}
        staffIdentity={staffIdentity}
        onClose={() => setSelectedStaffId(null)}
      />
    </section>
  );
}
