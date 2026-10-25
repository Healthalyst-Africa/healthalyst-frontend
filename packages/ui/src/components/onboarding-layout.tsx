import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@healthalyst/ui/components/accordion";
import { cn } from "@healthalyst/ui/lib/utilities";

type OnboardingLayoutProperties = {
  brand: ReactNode;
  actions?: ReactNode;
  progress?: ReactNode;
  children: ReactNode;
};

/** A spacious setup workspace with persistent account context and progress. */
export function OnboardingLayout({
  brand,
  actions,
  progress,
  children,
}: OnboardingLayoutProperties) {
  return (
    <div className="min-h-dvh bg-card text-foreground">
      <a
        href="#onboarding-content"
        className="sr-only rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to setup content
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex min-h-20 max-w-screen-2xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-12">
          {brand}
          {actions}
        </div>
      </header>
      <div
        className={cn(
          "mx-auto grid w-full max-w-7xl gap-8 px-5 py-6 sm:px-8 lg:gap-12 lg:px-0 lg:py-12",
          progress && "lg:grid-cols-[15rem_minmax(0,1fr)]"
        )}
      >
        {progress && (
          <aside aria-label="Onboarding progress" className="min-w-0">
            <div className="lg:hidden">
              <Accordion type="single" collapsible>
                <AccordionItem value="progress">
                  <AccordionTrigger>Your onboarding progress</AccordionTrigger>
                  <AccordionContent>{progress}</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <div className="hidden lg:sticky lg:top-28 lg:block">
              {progress}
            </div>
          </aside>
        )}
        <main
          id="onboarding-content"
          className="min-w-0 scroll-mt-28"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
