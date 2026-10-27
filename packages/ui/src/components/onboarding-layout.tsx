import type { ReactNode } from "react";
import { cn } from "@healthalyst/ui/lib/utilities";

type OnboardingLayoutProperties = {
  brand: ReactNode;
  actions?: ReactNode;
  /** Progress beside the content on large screens. */
  progress?: ReactNode;
  /** A compact form of the progress, pinned under the header on small screens. */
  compactProgress?: ReactNode;
  children: ReactNode;
};

/** A spacious setup workspace with persistent account context and progress. */
export function OnboardingLayout({
  brand,
  actions,
  progress,
  compactProgress,
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
      {compactProgress && (
        <nav
          aria-label="Setup progress"
          className="sticky top-20 z-20 border-b border-border bg-card px-5 py-2 sm:px-8 lg:hidden"
        >
          {compactProgress}
        </nav>
      )}
      <div
        className={cn(
          "mx-auto grid w-full max-w-7xl gap-8 px-5 py-6 sm:px-8 lg:gap-12 lg:px-0 lg:py-12",
          progress && "lg:grid-cols-[15rem_minmax(0,1fr)]"
        )}
      >
        {progress && (
          <aside
            aria-label="Onboarding progress"
            className="hidden min-w-0 lg:block"
          >
            <div className="lg:sticky lg:top-28">{progress}</div>
          </aside>
        )}
        <main
          id="onboarding-content"
          className="min-w-0 scroll-mt-40 lg:scroll-mt-28"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
