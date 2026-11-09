"use client";

import { useState } from "react";
import { AddIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FilterBar } from "@healthalyst/ui/components/filter-bar";
import { EmptyOrganizationsIllustration } from "@healthalyst/ui/illustrations/empty-organizations-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { AppointmentTypeSheet } from "~/features/schedule-setup/components/appointment-type-sheet";
import { ScheduleSetupFrame } from "~/features/schedule-setup/components/schedule-setup-frame";
import { MODALITY_OPTIONS } from "~/features/schedule-setup/config/schedule-setup";
import {
  useAppointmentTypes,
  useScheduleCalendars,
} from "~/features/schedule-setup/hooks/use-schedule-setup";
import type { AppointmentType } from "~/features/schedule-setup/schemas/schedule-response-schemas";
import { formatNaira } from "~/features/schedule-setup/utilities/naira-amount";

const STATUS_FILTER_OPTIONS = [
  { value: "active", label: "Bookable" },
  { value: "inactive", label: "Switched off" },
];

function describeModality(appointmentType: AppointmentType): string {
  return (
    MODALITY_OPTIONS.find((option) => option.value === appointmentType.modality)
      ?.label ?? appointmentType.modality
  );
}

function describeLength(appointmentType: AppointmentType): string {
  const length = `${appointmentType.durationMinutes} min`;
  return appointmentType.newPatientDurationMinutes
    ? `${length}, ${appointmentType.newPatientDurationMinutes} min for new patients`
    : length;
}

const COLUMNS: readonly DataTableColumn<AppointmentType>[] = [
  {
    key: "name",
    label: "Appointment type",
    size: "wide",
    getCell: (appointmentType) => ({
      kind: "text",
      primary: appointmentType.name,
      secondary: describeModality(appointmentType),
    }),
  },
  {
    key: "length",
    label: "Length",
    getCell: (appointmentType) => ({
      kind: "text",
      primary: describeLength(appointmentType),
      secondary:
        appointmentType.capacity > 1
          ? `Group of up to ${appointmentType.capacity}`
          : undefined,
    }),
  },
  {
    key: "price",
    label: "Price",
    size: "compact",
    getCell: (appointmentType) => ({
      kind: "text",
      primary:
        appointmentType.priceKobo === null
          ? "No price set"
          : formatNaira(appointmentType.priceKobo),
    }),
  },
  {
    key: "calendars",
    label: "Calendars",
    size: "compact",
    getCell: (appointmentType) => ({
      kind: "text",
      primary:
        appointmentType.resourceIds.length === 0
          ? "None yet"
          : `${appointmentType.resourceIds.length} ${appointmentType.resourceIds.length === 1 ? "calendar" : "calendars"}`,
    }),
  },
  {
    key: "status",
    label: "Status",
    size: "compact",
    getCell: (appointmentType) => ({
      kind: "status",
      label: appointmentType.isActive ? "Bookable" : "Switched off",
      tone: appointmentType.isActive ? "positive" : "neutral",
    }),
  },
];

/** What patients book, how long it takes, what it costs and who offers it. */
export function AppointmentTypesPage() {
  const [editor, setEditor] = useState<{
    appointmentType: AppointmentType | null;
  } | null>(null);

  return (
    <ScheduleSetupFrame
      title="Appointment types"
      description="Each appointment type sets a length, a booking window and a price, and the calendars that offer it."
      action={({ canManage }) =>
        canManage && (
          <ActionButton
            type="button"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={() => setEditor({ appointmentType: null })}
          >
            Add an appointment type
          </ActionButton>
        )
      }
    >
      {({ canManage }) => (
        <AppointmentTypesWorkspace
          canManage={canManage}
          editor={editor}
          setEditor={setEditor}
        />
      )}
    </ScheduleSetupFrame>
  );
}

function AppointmentTypesWorkspace({
  canManage,
  editor,
  setEditor,
}: {
  canManage: boolean;
  editor: { appointmentType: AppointmentType | null } | null;
  setEditor: (
    editor: { appointmentType: AppointmentType | null } | null
  ) => void;
}) {
  const appointmentTypesQuery = useAppointmentTypes();
  const calendarsQuery = useScheduleCalendars();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const normalizedSearch = searchText.trim().toLowerCase();
  const visibleTypes = (appointmentTypesQuery.data ?? [])
    .filter(
      (appointmentType) =>
        (statusFilter === "" ||
          (statusFilter === "active") === appointmentType.isActive) &&
        (!normalizedSearch ||
          appointmentType.name.toLowerCase().includes(normalizedSearch))
    )
    .sort((firstType, secondType) =>
      firstType.name.localeCompare(secondType.name)
    );
  const hasTypes = (appointmentTypesQuery.data ?? []).length > 0;

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        accessibleLabel="Filter appointment types"
        identifier="appointment-type-filters"
        search={{
          label: "Search appointment types",
          placeholder: "Search by name",
          value: searchText,
          onValueChange: setSearchText,
        }}
        filters={[
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
        accessibleLabel="Appointment types"
        columns={COLUMNS}
        state={
          appointmentTypesQuery.isPending
            ? { status: "loading", label: "Loading appointment types" }
            : appointmentTypesQuery.isError
              ? {
                  status: "error",
                  title: "We could not load the appointment types",
                  description: appointmentTypesQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void appointmentTypesQuery.refetch(),
                }
              : { status: "ready", rows: visibleTypes }
        }
        getRowIdentifier={(appointmentType) => appointmentType.id}
        rowAction={
          canManage
            ? {
                label: (appointmentType) => `Edit ${appointmentType.name}`,
                onSelect: (appointmentType) => setEditor({ appointmentType }),
              }
            : undefined
        }
        emptyState={{
          illustration: <EmptyOrganizationsIllustration />,
          title: hasTypes
            ? "No appointment types match"
            : "No appointment types yet",
          description: hasTypes
            ? "Change the search or filters to see more."
            : "Add the appointments patients book, such as a general consultation.",
        }}
      />
      {canManage && (
        <AppointmentTypeSheet
          open={editor !== null}
          onOpenChange={(open) => !open && setEditor(null)}
          appointmentType={editor?.appointmentType ?? null}
          calendars={calendarsQuery.data ?? []}
        />
      )}
    </div>
  );
}
