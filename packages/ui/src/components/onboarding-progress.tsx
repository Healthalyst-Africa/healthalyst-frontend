import { CheckIcon } from "@healthalyst/icons";
import { cn } from "@healthalyst/ui/lib/utilities";

export type OnboardingProgressStep = {
  identifier: string;
  title: string;
  description: string;
  complete: boolean;
  current?: boolean;
};

/** Progress indicators describe real requirements without promising navigation. */
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
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted-foreground/10 [&::-moz-progress-bar]:bg-gold [&::-webkit-progress-bar]:bg-muted-foreground/10 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-gold"
          value={completedCount}
          max={steps.length}
          aria-label={`${completedCount} of ${steps.length} onboarding steps complete`}
        />
        <p className="text-xs text-muted-foreground">
          {completedCount} of {steps.length} steps complete
        </p>
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-col">
        {steps.map((step, stepIndex) => (
          <li
            key={step.identifier}
            aria-current={step.current ? "step" : undefined}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-transparent px-3 py-4",
              step.current && "border-gold-subtle bg-gold-subtle/30"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs text-primary-foreground",
                step.complete || step.current
                  ? "bg-gold"
                  : "bg-muted-foreground/50"
              )}
            >
              {step.complete ? <CheckIcon className="size-4" /> : stepIndex + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  !step.current && "text-muted-foreground/60"
                )}
              >
                {step.title}
              </p>
              <p
                className={cn(
                  "text-xs leading-5",
                  step.current
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60"
                )}
              >
                {step.description}
              </p>
              <span className="sr-only">
                {step.complete ? "Complete" : "Not complete"}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
