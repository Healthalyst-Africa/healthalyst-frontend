import type { AnchorHTMLAttributes, ElementType } from "react";
import { CompletedStepIcon, UpcomingStepIcon } from "@healthalyst/icons";
import { Skeleton } from "@healthalyst/ui/primitives/skeleton";
import { cn } from "@healthalyst/ui/lib/utilities";

type SetupLinkProperties = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

type SetupStep = {
  title: string;
  /** What is still missing, or what was done. */
  description: string;
  isComplete: boolean;
  /** Where the step is done; left out when the page itself holds it. */
  action?: { label: string; href: string };
};

/**
 * What a new organisation needs before it can see patients, in order. Each
 * step is ticked from real data, never by hand, and links to where it is
 * done.
 */
export function SetupChecklist({
  heading,
  steps,
  isLoading = false,
  linkComponent: StepLink = "a",
}: {
  heading: string;
  steps: readonly SetupStep[];
  isLoading?: boolean;
  /** The application's link component, such as the framework's client-side link. */
  linkComponent?: ElementType<SetupLinkProperties>;
}) {
  const completedCount = steps.filter((step) => step.isComplete).length;

  return (
    <section
      aria-labelledby="setup-checklist-heading"
      className="rounded-lg border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="setup-checklist-heading"
          className="font-serif text-lg font-normal leading-snug"
        >
          {heading}
        </h2>
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {completedCount} of {steps.length} done
          </p>
        )}
      </div>
      <ol className="mt-4 flex flex-col divide-y" aria-busy={isLoading}>
        {steps.map((step) => (
          <li
            key={step.title}
            className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              {step.isComplete ? (
                <CompletedStepIcon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
              ) : (
                <UpcomingStepIcon
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                />
              )}
              <div className="flex flex-col gap-0.5">
                <p
                  className={cn(
                    "text-sm font-medium leading-5",
                    step.isComplete && "text-muted-foreground"
                  )}
                >
                  {step.title}
                  <span className="sr-only">
                    {step.isComplete ? ", done" : ", to do"}
                  </span>
                </p>
                {isLoading ? (
                  <Skeleton
                    aria-hidden="true"
                    className="h-4 w-48 motion-reduce:animate-none"
                  />
                ) : (
                  <p className="text-sm leading-5 text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            {!isLoading && !step.isComplete && step.action && (
              <StepLink
                href={step.action.href}
                className="ml-8 inline-flex h-8 shrink-0 items-center justify-center self-start rounded-full border border-input px-3 text-xs font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:ml-0 sm:self-center"
              >
                {step.action.label}
              </StepLink>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

export type { SetupStep };
