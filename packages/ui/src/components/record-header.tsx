import type { ReactNode } from "react";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { StatusPresentation } from "@healthalyst/ui/types/status-tone";

type RecordHeaderStatus = { key: string } & StatusPresentation;

/**
 * The top of a record's page: its name as the page heading, short details
 * such as numbers and dates, status labels, an alerts line for what must not
 * be missed, and the record's main actions.
 */
export function RecordHeader({
  title,
  details,
  statuses = [],
  alerts,
  actions,
  className,
}: {
  title: string;
  /** Short facts shown on one line, separated by dots. */
  details: readonly string[];
  statuses?: readonly RecordHeaderStatus[];
  /** Shown under the details, such as allergies. */
  alerts?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="font-serif text-title font-normal tracking-tight [overflow-wrap:anywhere]">
          {title}
        </h1>
        {details.length > 0 && (
          <p className="text-body text-muted-foreground">
            {details.join(" · ")}
          </p>
        )}
        {statuses.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Status">
            {statuses.map((status) => (
              <li key={status.key}>
                <StatusLabel
                  label={status.label}
                  tone={status.tone}
                  icon={status.icon}
                />
              </li>
            ))}
          </ul>
        )}
        {alerts && <div className="pt-1 text-sm">{alerts}</div>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}

export type { RecordHeaderStatus };
