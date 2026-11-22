import type { ReactNode } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  ScheduleEntryList,
  type ScheduleEntry,
} from "@healthalyst/ui/components/schedule-entry-list";

type DayScheduleCalendar = {
  id: string;
  name: string;
  /** Such as "Open 8:00 am – 4:00 pm" or "Closed: annual leave". */
  hours: string;
  entries: readonly ScheduleEntry[];
};

type DayScheduleState =
  | { status: "loading" }
  | { status: "error"; title: string; description: string; onRetry: () => void }
  | { status: "ready"; calendars: readonly DayScheduleCalendar[] };

/**
 * One day of bookings, calendar by calendar: each doctor, room or machine
 * with its hours and its appointments in time order. A day with nothing
 * booked shows `emptyState` once instead of every calendar.
 */
export function DaySchedule({
  accessibleLabel,
  state,
  emptyState,
}: {
  accessibleLabel: string;
  state: DayScheduleState;
  emptyState: {
    illustration?: ReactNode;
    title: string;
    description?: ReactNode;
    action?: ReactNode;
  };
}) {
  if (state.status === "loading") {
    return (
      <LoadingPlaceholder
        label="Loading the day's appointments"
        rows={[
          { shape: "heading", width: "medium" },
          { shape: "card" },
          { shape: "card" },
        ]}
      />
    );
  }
  if (state.status === "error") {
    return (
      <EmptyState
        tone="error"
        title={state.title}
        description={state.description}
        action={
          <ActionButton type="button" variant="outline" onClick={state.onRetry}>
            Try again
          </ActionButton>
        }
      />
    );
  }
  // Nothing booked anywhere: one message for the day, not one per calendar.
  if (state.calendars.every((calendar) => calendar.entries.length === 0)) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <div
      aria-label={accessibleLabel}
      role="region"
      className="flex flex-col gap-8"
    >
      {state.calendars.map((calendar) => (
        <section
          key={calendar.id}
          aria-labelledby={`day-schedule-${calendar.id}`}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-2">
            <h3
              id={`day-schedule-${calendar.id}`}
              className="text-base font-semibold"
            >
              {calendar.name}
            </h3>
            <p className="text-sm text-muted-foreground">{calendar.hours}</p>
          </div>
          {calendar.entries.length === 0 ? (
            <EmptyState
              surface="plain"
              className="min-h-0 py-4"
              title="Nothing booked"
            />
          ) : (
            <ScheduleEntryList entries={calendar.entries} />
          )}
        </section>
      ))}
    </div>
  );
}

export type { DayScheduleCalendar, DayScheduleState };
