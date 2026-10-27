"use client";

import type { MouseEvent } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@healthalyst/icons";
import { cn } from "@healthalyst/ui/lib/utilities";

type StepLink = {
  /** Where the link leads, such as "organisation details". */
  destination: string;
  href: string;
  /** Runs instead of following `href`, for in-page navigation. */
  onSelect?: () => void;
};

const LINK_CLASS_NAME =
  "inline-flex min-h-11 items-center gap-1.5 rounded-sm text-body text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function followStepLink(
  stepLink: StepLink,
  clickEvent: MouseEvent<HTMLAnchorElement>
) {
  if (!stepLink.onSelect) return;
  clickEvent.preventDefault();
  stepLink.onSelect();
}

/**
 * Back and Continue links between the steps of a workflow, on one row at
 * every width. Phones show "Back" and "Continue"; the destination is shown
 * from 640 px and is always part of the accessible name.
 */
export function StepNavigation({
  previous,
  next,
  className,
}: {
  previous?: StepLink;
  next?: StepLink;
  className?: string;
}) {
  return (
    <nav
      aria-label="Steps"
      className={cn(
        "flex items-center justify-between gap-4 border-t border-border pt-4 sm:pt-5",
        className
      )}
    >
      {previous ? (
        <a
          href={previous.href}
          onClick={(clickEvent) => followStepLink(previous, clickEvent)}
          className={LINK_CLASS_NAME}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4 shrink-0" />
          <span>
            Back
            <span className="max-sm:sr-only"> to {previous.destination}</span>
          </span>
        </a>
      ) : (
        <span aria-hidden="true" />
      )}
      {next && (
        <a
          href={next.href}
          onClick={(clickEvent) => followStepLink(next, clickEvent)}
          className={cn(LINK_CLASS_NAME, "font-semibold")}
        >
          <span>
            Continue
            <span className="max-sm:sr-only"> to {next.destination}</span>
          </span>
          <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" />
        </a>
      )}
    </nav>
  );
}

export type { StepLink };
