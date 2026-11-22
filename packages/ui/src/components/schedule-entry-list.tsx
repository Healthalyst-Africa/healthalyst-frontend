import { WarningIcon } from "@healthalyst/icons";
import {
  ActionMenu,
  type ActionMenuItem,
} from "@healthalyst/ui/components/action-menu";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { StatusTone } from "@healthalyst/ui/types/status-tone";

type ScheduleEntry = {
  id: string;
  /** Such as "Tue 24 Nov", above the time in a list spanning several days. */
  day?: string;
  /** Such as "9:30 am". */
  time: string;
  /** Such as "9:30 – 9:50 am", read out instead of the shorter time. */
  period: string;
  /** Usually the patient's name, or who the appointment is with. */
  title: string;
  /** Such as the appointment type and patient number. */
  details?: string;
  status: { label: string; tone: StatusTone };
  /** Something staff must do, such as call the patient to move it. */
  attention?: string;
  /** Faded, such as a cancelled booking kept for the record. */
  isInactive?: boolean;
  actions?: readonly ActionMenuItem[];
};

const TIME_COLUMN_CLASS_NAMES = {
  time: "grid-cols-[4.5rem_minmax(0,1fr)_auto]",
  "date-time": "grid-cols-[6rem_minmax(0,1fr)_auto]",
} as const;

/**
 * Appointments in time order: when, who or what, its status, anything staff
 * must do about it, and its actions behind a menu.
 */
export function ScheduleEntryList({
  entries,
  timeColumn = "time",
}: {
  entries: readonly ScheduleEntry[];
  /** `date-time` widens the first column for entries with a `day`. */
  timeColumn?: keyof typeof TIME_COLUMN_CLASS_NAMES;
}) {
  return (
    <ol className="flex flex-col divide-y">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className={cn(
            "grid items-start gap-x-3 py-3",
            TIME_COLUMN_CLASS_NAMES[timeColumn],
            entry.isInactive && "text-muted-foreground"
          )}
        >
          <p className="flex flex-col text-sm font-medium tabular-nums leading-6">
            {entry.day && <span aria-hidden="true">{entry.day}</span>}
            <span
              aria-hidden="true"
              className={cn(entry.day && "font-normal text-muted-foreground")}
            >
              {entry.time}
            </span>
            <span className="sr-only">{entry.period}</span>
          </p>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p
                className={cn(
                  "text-sm font-medium leading-6",
                  entry.isInactive &&
                    "line-through decoration-muted-foreground/60"
                )}
              >
                {entry.title}
              </p>
              <StatusLabel tone={entry.status.tone}>
                {entry.status.label}
              </StatusLabel>
            </div>
            {entry.details && (
              <p className="text-caption text-muted-foreground">
                {entry.details}
              </p>
            )}
            {entry.attention && (
              <p className="flex items-start gap-1.5 text-caption text-status-warning">
                <WarningIcon
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0"
                />
                {entry.attention}
              </p>
            )}
          </div>
          <div className="flex min-w-9 justify-end">
            {entry.actions && entry.actions.length > 0 && (
              <ActionMenu
                accessibleLabel={`Actions for ${entry.title}, ${entry.period}`}
                items={entry.actions}
              />
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export type { ScheduleEntry };
