"use client";

import { useMemo, useState } from "react";
import { AddIcon, DeleteIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FilterBar } from "@healthalyst/ui/components/filter-bar";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { AddTimeOffDialog } from "~/features/schedule-setup/components/add-time-off-dialog";
import { ScheduleSetupFrame } from "~/features/schedule-setup/components/schedule-setup-frame";
import {
  TIME_OFF_KIND_OPTIONS,
  TIME_OFF_PERIOD_OPTIONS,
} from "~/features/schedule-setup/config/schedule-setup";
import {
  useRemoveTimeOff,
  useScheduleCalendars,
  useTimeOff,
} from "~/features/schedule-setup/hooks/use-schedule-setup";
import type { TimeOffEntry } from "~/features/schedule-setup/schemas/schedule-response-schemas";
import {
  describeBranchPeriod,
  upcomingBranchPeriod,
} from "~/features/schedule-setup/utilities/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const [DEFAULT_PERIOD_OPTION, ...LONGER_PERIOD_OPTIONS] =
  TIME_OFF_PERIOD_OPTIONS;

function describeTimeOffKind(entry: TimeOffEntry): string {
  return (
    TIME_OFF_KIND_OPTIONS.find((option) => option.value === entry.kind)
      ?.label ?? entry.kind
  );
}

/** Leave, breaks and holidays that close calendars or branches. */
export function TimeOffPage() {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <ScheduleSetupFrame
      title="Time off and holidays"
      description="Leave, breaks and public holidays close a calendar or a whole branch for a while. Free slots that overlap them disappear."
      action={({ canManage }) =>
        canManage && (
          <ActionButton
            type="button"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={() => setIsAdding(true)}
          >
            Add time off
          </ActionButton>
        )
      }
    >
      {({ canManage }) => (
        <TimeOffWorkspace
          canManage={canManage}
          isAdding={isAdding}
          setIsAdding={setIsAdding}
        />
      )}
    </ScheduleSetupFrame>
  );
}

function TimeOffWorkspace({
  canManage,
  isAdding,
  setIsAdding,
}: {
  canManage: boolean;
  isAdding: boolean;
  setIsAdding: (isAdding: boolean) => void;
}) {
  const { branchSelection } = useWorkspace();
  const [periodDays, setPeriodDays] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [openEntry, setOpenEntry] = useState<TimeOffEntry | null>(null);
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);
  const period = useMemo(
    () =>
      upcomingBranchPeriod(
        Number(periodDays || DEFAULT_PERIOD_OPTION?.value || 30)
      ),
    [periodDays]
  );
  const timeOffQuery = useTimeOff(period);
  const calendarsQuery = useScheduleCalendars();
  const removeMutation = useRemoveTimeOff();

  const branchOptions =
    branchSelection.status === "selected" ||
    branchSelection.status === "choosing"
      ? branchSelection.branchOptions
      : [];
  const selectedBranchIdentifier =
    branchSelection.status === "selected" ? branchSelection.branch.id : "";
  const calendarNames = new Map(
    (calendarsQuery.data ?? []).map((calendar) => [calendar.id, calendar.name])
  );
  const branchNames = new Map(
    branchOptions.map((branch) => [branch.id, branch.name])
  );

  function describeTarget(entry: TimeOffEntry): string {
    if (entry.resourceId)
      return calendarNames.get(entry.resourceId) ?? "A calendar";
    if (entry.branchId)
      return `All of ${branchNames.get(entry.branchId) ?? "another branch"}`;
    return "Unknown";
  }

  const columns: readonly DataTableColumn<TimeOffEntry>[] = [
    {
      key: "when",
      label: "When",
      size: "wide",
      getCell: (entry) => ({
        kind: "text",
        primary: describeBranchPeriod(entry.startsAt, entry.endsAt),
      }),
    },
    {
      key: "kind",
      label: "Reason",
      getCell: (entry) => ({
        kind: "text",
        primary: describeTimeOffKind(entry),
        secondary: entry.reason ?? undefined,
      }),
    },
    {
      key: "target",
      label: "Closes",
      getCell: (entry) => ({ kind: "text", primary: describeTarget(entry) }),
    },
  ];
  const visibleEntries = (timeOffQuery.data ?? [])
    .filter((entry) => !kindFilter || entry.kind === kindFilter)
    .sort((firstEntry, secondEntry) =>
      firstEntry.startsAt.localeCompare(secondEntry.startsAt)
    );

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        accessibleLabel="Filter time off"
        identifier="time-off-filters"
        filters={[
          {
            key: "period",
            label: "Period",
            options: LONGER_PERIOD_OPTIONS,
            allOptionsLabel: DEFAULT_PERIOD_OPTION?.label ?? "Next 30 days",
            value: periodDays,
            onValueChange: setPeriodDays,
          },
          {
            key: "kind",
            label: "Reason",
            options: TIME_OFF_KIND_OPTIONS,
            allOptionsLabel: "All reasons",
            value: kindFilter,
            onValueChange: setKindFilter,
          },
        ]}
      />
      <DataTable
        accessibleLabel="Time off and holidays"
        columns={columns}
        state={
          timeOffQuery.isPending
            ? { status: "loading", label: "Loading time off" }
            : timeOffQuery.isError
              ? {
                  status: "error",
                  title: "We could not load time off",
                  description: timeOffQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void timeOffQuery.refetch(),
                }
              : { status: "ready", rows: visibleEntries }
        }
        getRowIdentifier={(entry) => entry.id}
        rowAction={{
          label: (entry) =>
            `Open ${describeTimeOffKind(entry)}, ${describeBranchPeriod(entry.startsAt, entry.endsAt)}`,
          onSelect: (entry) => {
            removeMutation.reset();
            setOpenEntry(entry);
          },
        }}
        emptyState={{
          illustration: <EmptyReviewQueueIllustration />,
          title: "No time off in this period",
          description: "Every calendar keeps its weekly hours.",
        }}
      />
      <DetailSheet
        open={openEntry !== null}
        onOpenChange={(open) => !open && setOpenEntry(null)}
        title={openEntry ? describeTimeOffKind(openEntry) : ""}
        description={
          openEntry
            ? describeBranchPeriod(openEntry.startsAt, openEntry.endsAt)
            : undefined
        }
        footer={
          openEntry &&
          canManage && (
            <ActionButton
              type="button"
              variant="outline"
              className="text-destructive"
              leadingIcon={<DeleteIcon className="size-4" />}
              onClick={() => {
                removeMutation.reset();
                setIsConfirmingRemoval(true);
              }}
            >
              Remove time off
            </ActionButton>
          )
        }
      >
        {openEntry && (
          <dl className="grid gap-4 text-sm sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">Closes</dt>
            <dd>{describeTarget(openEntry)}</dd>
            <dt className="text-muted-foreground">Note</dt>
            <dd>{openEntry.reason ?? "No note"}</dd>
          </dl>
        )}
      </DetailSheet>
      <FormDialog
        open={isConfirmingRemoval}
        onOpenChange={setIsConfirmingRemoval}
        title="Remove this time off?"
        description="Its free slots come back for booking."
        submitLabel="Remove time off"
        submittingLabel="Removing time off"
        tone="destructive"
        isSubmitting={removeMutation.isPending}
        error={removeMutation.error?.message}
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          if (!openEntry) return;
          removeMutation.mutate(openEntry.id, {
            onSuccess: () => {
              announceSuccess("Time off removed");
              setIsConfirmingRemoval(false);
              setOpenEntry(null);
            },
          });
        }}
      >
        {null}
      </FormDialog>
      {canManage && (
        <AddTimeOffDialog
          open={isAdding}
          onOpenChange={setIsAdding}
          calendars={calendarsQuery.data ?? []}
          branchOptions={branchOptions.map((branch) => ({
            value: branch.id,
            label: branch.name,
          }))}
          defaultBranchIdentifier={selectedBranchIdentifier}
        />
      )}
    </div>
  );
}
