"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { StatusIcon, StatusTone } from "@healthalyst/ui/types/status-tone";

type PatientQueueFact = {
  /** A small icon that stands for the fact, such as a clock for the wait. */
  icon: StatusIcon;
  /** Read out, and shown on hover; shown beside the icon only with `value`. */
  label: string;
  /** A short value shown beside the icon, such as "4 min". */
  value?: string;
  /** Colours the icon and words, such as red for an emergency. */
  tone?: StatusTone;
};

type PatientQueueItem = {
  id: string;
  name: string;
  /** Such as the queue token "W-001". */
  reference: string;
  facts: readonly PatientQueueFact[];
};

const FACT_TONE_CLASS_NAMES: Record<StatusTone, string> = {
  neutral: "text-muted-foreground",
  information: "text-status-information",
  warning: "text-status-warning",
  highlight: "text-status-highlight",
  positive: "text-status-positive",
  negative: "text-status-negative",
};

/**
 * Patients in a queue as compact cards: the name and token, then facts such
 * as urgency, where they are and how long they have waited as icons. Each
 * icon's meaning is read out and shown on hover; only values such as the
 * wait are written. The chosen patient is marked as current.
 */
export function PatientQueueList({
  items,
  currentIdentifier,
  onSelect,
}: {
  items: readonly PatientQueueItem[];
  currentIdentifier: string | null;
  onSelect: (identifier: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <ActionButton
            type="button"
            variant="unstyled"
            size="unstyled"
            aria-current={item.id === currentIdentifier ? "true" : undefined}
            onClick={() => onSelect(item.id)}
            className="flex h-auto w-full flex-col items-stretch gap-2 whitespace-normal rounded-xl border border-border bg-card p-3 text-left font-normal transition-colors hover:bg-accent aria-[current=true]:border-primary aria-[current=true]:bg-accent"
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {item.reference}
              </span>
            </span>
            {item.facts.length > 0 && (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {item.facts.map((fact) => (
                  <span
                    key={fact.label}
                    title={fact.label}
                    className={cn(
                      "inline-flex h-5 items-center gap-1 leading-none [&_svg]:block [&_svg]:size-4 [&_svg]:shrink-0",
                      // Values, such as the wait, line up on the right.
                      fact.value && "ml-auto",
                      FACT_TONE_CLASS_NAMES[fact.tone ?? "neutral"]
                    )}
                  >
                    <fact.icon aria-hidden="true" />
                    {fact.value ? (
                      <>
                        <span aria-hidden="true" className="tabular-nums">
                          {fact.value}
                        </span>
                        <span className="sr-only">{fact.label}</span>
                      </>
                    ) : (
                      <span className="sr-only">{fact.label}</span>
                    )}
                  </span>
                ))}
              </span>
            )}
          </ActionButton>
        </li>
      ))}
    </ul>
  );
}

export type { PatientQueueFact, PatientQueueItem };
