import {
  CompletedStepIcon,
  CurrentStepIcon,
  UpcomingStepIcon,
} from "@healthalyst/icons";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { VisitProgressStep } from "@healthalyst/ui/types/visit-progress";

const STEP_STATE_NAMES = {
  done: "done",
  current: "now",
  upcoming: "next",
} as const;

/**
 * Where a patient is on their visit, such as checked in, vital signs, then
 * the doctor, so anyone can see what has happened and what comes next.
 */
export function VisitProgress({
  steps,
}: {
  steps: readonly VisitProgressStep[];
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5">
      {steps.map((step, stepIndex) => (
        <li key={step.label} className="flex items-center gap-1">
          {stepIndex > 0 && (
            <span aria-hidden="true" className="text-muted-foreground/60">
              ›
            </span>
          )}
          {step.state === "done" ? (
            <CompletedStepIcon
              aria-hidden="true"
              className="size-3.5 shrink-0 text-primary"
            />
          ) : step.state === "current" ? (
            <CurrentStepIcon
              aria-hidden="true"
              className="size-3.5 shrink-0 text-foreground"
            />
          ) : (
            <UpcomingStepIcon
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )}
          <span
            className={cn(
              step.state === "current"
                ? "font-semibold text-foreground"
                : "text-muted-foreground"
            )}
          >
            {step.label}
            {step.detail && (
              <span className="font-normal text-muted-foreground">
                {" "}
                · {step.detail}
              </span>
            )}
          </span>
          <span className="sr-only">, {STEP_STATE_NAMES[step.state]}</span>
        </li>
      ))}
    </ol>
  );
}
