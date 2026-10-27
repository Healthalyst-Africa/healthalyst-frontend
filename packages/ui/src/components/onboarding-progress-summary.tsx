"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@healthalyst/icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@healthalyst/ui/primitives/sheet";
import {
  OnboardingStepList,
  type OnboardingProgressStep,
} from "@healthalyst/ui/components/onboarding-progress";
import { cn } from "@healthalyst/ui/lib/utilities";

const RING_RADIUS = 15;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** A ring filled by the share of complete steps, with the current step inside. */
function ProgressRing({
  completedCount,
  totalCount,
  currentNumber,
  isCurrentComplete,
}: {
  completedCount: number;
  totalCount: number;
  currentNumber: number;
  /** Green marks a complete step, so the number is green only then. */
  isCurrentComplete: boolean;
}) {
  const completedLength =
    totalCount > 0 ? (completedCount / totalCount) * RING_CIRCUMFERENCE : 0;

  return (
    <span aria-hidden="true" className="relative flex size-9 shrink-0">
      <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="3"
          className="stroke-muted-foreground/15"
        />
        <circle
          cx="18"
          cy="18"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${completedLength} ${RING_CIRCUMFERENCE}`}
          className={cn(
            "transition-[stroke-dasharray] duration-300 motion-reduce:transition-none",
            // Gold while steps remain, as in the desktop bar; green once all are complete.
            completedCount === totalCount ? "stroke-primary" : "stroke-gold"
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-caption font-semibold",
          isCurrentComplete ? "text-primary" : "text-foreground"
        )}
      >
        {currentNumber}
      </span>
    </span>
  );
}

/**
 * Progress for small screens in one row: a ring showing how much is
 * complete, the current step, and every step in a panel that opens from the
 * bottom.
 */
export function OnboardingProgressSummary({
  steps,
  label,
}: {
  steps: readonly OnboardingProgressStep[];
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const completedCount = steps.filter((step) => step.complete).length;
  const currentIndex = Math.max(
    steps.findIndex((step) => step.current),
    0
  );
  const currentStep = steps[currentIndex];
  const completionText = `${completedCount} of ${steps.length} steps complete`;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-3">
        <ProgressRing
          completedCount={completedCount}
          totalCount={steps.length}
          currentNumber={currentIndex + 1}
          isCurrentComplete={Boolean(currentStep?.complete)}
        />
        <p className="flex min-w-0 flex-1 flex-col">
          <span className="text-caption text-muted-foreground">
            Step {currentIndex + 1} of {steps.length}
            <span className="sr-only">, {completionText}</span>
          </span>
          {currentStep && (
            <span className="truncate text-body font-medium">
              {currentStep.title}
            </span>
          )}
        </p>
        <SheetTrigger
          aria-label="All steps"
          className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDownIcon aria-hidden="true" className="size-5" />
        </SheetTrigger>
      </div>
      <SheetContent
        side="bottom"
        className="flex max-h-[85dvh] flex-col gap-0 rounded-t-2xl p-0"
      >
        <SheetHeader className="gap-1 border-b px-5 pb-4 pt-5 text-left">
          <SheetTitle className="pr-10 font-serif text-xl font-normal leading-tight">
            {label}
          </SheetTitle>
          <SheetDescription>{completionText}</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-3 py-3">
          <OnboardingStepList
            steps={steps}
            onStepSelect={() => setIsOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
