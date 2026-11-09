"use client";

import { useMemo, useState } from "react";
import { AddIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FilterBar } from "@healthalyst/ui/components/filter-bar";
import { EmptyOrganizationsIllustration } from "@healthalyst/ui/illustrations/empty-organizations-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { AddCalendarDialog } from "~/features/schedule-setup/components/add-calendar-dialog";
import { CalendarSheet } from "~/features/schedule-setup/components/calendar-sheet";
import { ScheduleSetupFrame } from "~/features/schedule-setup/components/schedule-setup-frame";
import { CALENDAR_KIND_OPTIONS } from "~/features/schedule-setup/config/schedule-setup";
import { useScheduleCalendars } from "~/features/schedule-setup/hooks/use-schedule-setup";
import type { ScheduleCalendar } from "~/features/schedule-setup/schemas/schedule-response-schemas";
import {
  describeCalendarKind,
  describeCalendarPlace,
  resolveHoursBranch,
} from "~/features/schedule-setup/utilities/describe-calendar";
import { summarizeWeeklyHours } from "~/features/schedule-setup/utilities/weekly-hours";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const STATUS_FILTER_OPTIONS = [
  { value: "active", label: "Taking bookings" },
  { value: "paused", label: "Paused" },
];

function useBranchContext() {
  const { branchSelection } = useWorkspace();
  const branchOptions = useMemo(
    () =>
      branchSelection.status === "selected" ||
      branchSelection.status === "choosing"
        ? branchSelection.branchOptions
        : [],
    [branchSelection]
  );
  const selectedBranch =
    branchSelection.status === "selected" ? branchSelection.branch : null;
  const branchNames = useMemo(
    () => new Map(branchOptions.map((branch) => [branch.id, branch.name])),
    [branchOptions]
  );
  return { branchOptions, selectedBranch, branchNames };
}

/** Practitioners, rooms and equipment, with the hours each can be booked. */
export function CalendarsPage() {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <ScheduleSetupFrame
      title="Calendars"
      description="Each practitioner, room and piece of equipment that patients book has a calendar. Its weekly hours decide when it can be booked."
      action={({ canManage }) =>
        canManage && (
          <ActionButton
            type="button"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={() => setIsAdding(true)}
          >
            Add a calendar
          </ActionButton>
        )
      }
    >
      {(access) => (
        <CalendarsWorkspace
          canManage={access.canManage}
          canChoosePractitioners={access.canChoosePractitioners}
          isAdding={isAdding}
          setIsAdding={setIsAdding}
        />
      )}
    </ScheduleSetupFrame>
  );
}

function CalendarsWorkspace({
  canManage,
  canChoosePractitioners,
  isAdding,
  setIsAdding,
}: {
  canManage: boolean;
  canChoosePractitioners: boolean;
  isAdding: boolean;
  setIsAdding: (isAdding: boolean) => void;
}) {
  const calendarsQuery = useScheduleCalendars();
  const { branchOptions, selectedBranch, branchNames } = useBranchContext();
  const [searchText, setSearchText] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [openCalendarIdentifier, setOpenCalendarIdentifier] = useState<
    string | null
  >(null);

  const calendars = calendarsQuery.data ?? [];
  // The panel shows the saved calendar, refreshed after each change.
  const openCalendar =
    calendars.find((calendar) => calendar.id === openCalendarIdentifier) ??
    null;
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleCalendars = calendars
    .filter(
      (calendar) =>
        (!kindFilter || calendar.kind === kindFilter) &&
        (statusFilter === "" ||
          (statusFilter === "active") === calendar.isActive) &&
        (!normalizedSearch ||
          calendar.name.toLowerCase().includes(normalizedSearch))
    )
    .sort((firstCalendar, secondCalendar) =>
      firstCalendar.name.localeCompare(secondCalendar.name)
    );

  const columns: readonly DataTableColumn<ScheduleCalendar>[] = [
    {
      key: "name",
      label: "Calendar",
      size: "wide",
      getCell: (calendar) => ({
        kind: "text",
        primary: calendar.name,
        secondary: describeCalendarKind(calendar),
      }),
    },
    {
      key: "place",
      label: "Branch",
      getCell: (calendar) => ({
        kind: "text",
        primary: describeCalendarPlace(calendar, branchNames),
      }),
    },
    {
      key: "hours",
      label: selectedBranch
        ? `Hours at ${selectedBranch.name}`
        : "Weekly hours",
      size: "wide",
      getCell: (calendar) => {
        const hoursBranch = resolveHoursBranch(
          calendar,
          selectedBranch?.id ?? null
        );
        return {
          kind: "text",
          primary: summarizeWeeklyHours(
            calendar.availability,
            hoursBranch ?? undefined
          ),
        };
      },
    },
    {
      key: "status",
      label: "Status",
      size: "compact",
      getCell: (calendar) => ({
        kind: "status",
        label: calendar.isActive ? "Taking bookings" : "Paused",
        tone: calendar.isActive ? "positive" : "neutral",
      }),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        accessibleLabel="Filter calendars"
        identifier="calendar-filters"
        search={{
          label: "Search calendars",
          placeholder: "Search by name",
          value: searchText,
          onValueChange: setSearchText,
        }}
        filters={[
          {
            key: "kind",
            label: "Type",
            options: CALENDAR_KIND_OPTIONS,
            allOptionsLabel: "All types",
            value: kindFilter,
            onValueChange: setKindFilter,
          },
          {
            key: "status",
            label: "Status",
            options: STATUS_FILTER_OPTIONS,
            allOptionsLabel: "All statuses",
            value: statusFilter,
            onValueChange: setStatusFilter,
          },
        ]}
      />
      <DataTable
        accessibleLabel="Calendars"
        columns={columns}
        state={
          calendarsQuery.isPending
            ? { status: "loading", label: "Loading calendars" }
            : calendarsQuery.isError
              ? {
                  status: "error",
                  title: "We could not load the calendars",
                  description: calendarsQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void calendarsQuery.refetch(),
                }
              : { status: "ready", rows: visibleCalendars }
        }
        getRowIdentifier={(calendar) => calendar.id}
        rowAction={{
          label: (calendar) => `Open ${calendar.name}`,
          onSelect: (calendar) => setOpenCalendarIdentifier(calendar.id),
        }}
        emptyState={{
          illustration: <EmptyOrganizationsIllustration />,
          title:
            calendars.length === 0 ? "No calendars yet" : "No calendars match",
          description:
            calendars.length === 0
              ? "Add a calendar for each practitioner, room or piece of equipment that patients book."
              : "Change the search or filters to see more calendars.",
        }}
      />
      <CalendarSheet
        calendar={openCalendar}
        onOpenChange={(open) => !open && setOpenCalendarIdentifier(null)}
        branchNames={branchNames}
        selectedBranch={selectedBranch}
        canManage={canManage}
      />
      {canManage && (
        <AddCalendarDialog
          open={isAdding}
          onOpenChange={setIsAdding}
          existingCalendars={calendars}
          branchOptions={branchOptions.map((branch) => ({
            value: branch.id,
            label: branch.name,
          }))}
          defaultBranchIdentifier={selectedBranch?.id ?? ""}
          canChoosePractitioners={canChoosePractitioners}
          onAdded={(calendar) => {
            setStatusFilter("active");
            setOpenCalendarIdentifier(calendar.id);
          }}
        />
      )}
    </div>
  );
}
