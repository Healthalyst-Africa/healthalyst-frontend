import type { MouseEvent } from "react";
import { SuccessIcon } from "@healthalyst/icons";
import { cn } from "@healthalyst/ui/lib/utilities";

export type OnboardingProgressStep = {
  identifier: string;
  title: string;
  description: string;
  complete: boolean;
  current?: boolean;
  /** Opens the step; leave empty when the step cannot be visited. */
  href?: string;
  /** Runs instead of following `href`, for in-page navigation. */
  onSelect?: () => void;
};

function selectStep(
  step: OnboardingProgressStep,
  clickEvent: MouseEvent<HTMLAnchorElement>,
  onStepSelect?: () => void
) {
  if (step.onSelect) {
    clickEvent.preventDefault();
    step.onSelect();
  }
  onStepSelect?.();
}

/**
 * The steps of a setup journey with their status. Steps with an `href` open
 * when chosen; the current step is marked for assistive technology.
 */
export function OnboardingStepList({
  steps,
  onStepSelect,
  className,
}: {
  steps: readonly OnboardingProgressStep[];
  /** Runs after any step is chosen, such as to close the panel it sits in. */
  onStepSelect?: () => void;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col gap-2", className)}>
      {steps.map((step, stepIndex) => {
        const content = (
          <>
            <span
              aria-hidden="true"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-sm",
                step.complete
                  ? // White on the green current-step card, so the circle stays visible.
                    step.current
                    ? "bg-background text-primary"
                    : "bg-secondary text-primary"
                  : step.current
                    ? "bg-gold text-primary-foreground"
                    : "bg-muted-foreground text-primary-foreground"
              )}
            >
              {step.complete ? (
                // Matches the completed-section mark in ReviewSections.
                <SuccessIcon className="size-5" />
              ) : (
                stepIndex + 1
              )}
            </span>
            <span className="flex min-w-0 flex-col gap-1 pt-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  !step.current && "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
              <span className="text-xs leading-5 text-muted-foreground">
                {step.description}
              </span>
              <span className="sr-only">
                {step.complete ? "Complete" : "Not complete"}
              </span>
            </span>
          </>
        );
        const itemClassName = cn(
          "flex items-start gap-3 rounded-xl border border-transparent px-3 py-4",
          step.current &&
            (step.complete
              ? "border-alert-success-border bg-alert-success-surface"
              : "border-gold-subtle bg-gold-subtle/30")
        );

        return (
          <li key={step.identifier}>
            {step.href ? (
              <a
                href={step.href}
                aria-current={step.current ? "step" : undefined}
                onClick={(clickEvent) =>
                  selectStep(step, clickEvent, onStepSelect)
                }
                className={cn(
                  itemClassName,
                  !step.current && "hover:bg-secondary/60",
                  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                {content}
              </a>
            ) : (
              <div
                aria-current={step.current ? "step" : undefined}
                className={itemClassName}
              >
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Progress through a setup journey: a label, a bar and the step list. */
export function OnboardingProgress({
  steps,
  label,
}: {
  steps: readonly OnboardingProgressStep[];
  label: string;
}) {
  const completedCount = steps.filter((step) => step.complete).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">{label}</p>
        <progress
          className={cn(
            "h-1.5 w-full overflow-hidden rounded-full bg-muted-foreground/10 [&::-webkit-progress-bar]:bg-muted-foreground/10 [&::-webkit-progress-value]:rounded-full",
            // Gold while steps remain; green once every step is complete.
            completedCount === steps.length
              ? "[&::-moz-progress-bar]:bg-primary [&::-webkit-progress-value]:bg-primary"
              : "[&::-moz-progress-bar]:bg-gold [&::-webkit-progress-value]:bg-gold"
          )}
          value={completedCount}
          max={steps.length}
          aria-label={`${completedCount} of ${steps.length} onboarding steps complete`}
        />
        <p className="text-xs text-muted-foreground">
          {completedCount} of {steps.length} steps complete
        </p>
      </div>
      <OnboardingStepList steps={steps} />
    </div>
  );
}
