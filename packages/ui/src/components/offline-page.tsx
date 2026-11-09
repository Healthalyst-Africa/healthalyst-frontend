import type { ReactNode } from "react";
import { AttentionNeededIllustration } from "@healthalyst/ui/illustrations/attention-needed-illustration";

type OfflinePageProperties = {
  title?: string;
  description?: string;
  /** A way to try again, such as a link to the page that could not load. */
  action: ReactNode;
  /** An optional brand mark shown above the illustration. */
  brand?: ReactNode;
};

/**
 * Shown by a service worker when a page cannot load without a connection.
 * It is stored ahead of time, so it must not depend on data or sign-in.
 */
export function OfflinePage({
  title = "You are offline",
  description = "This page needs a connection to open. Check your Wi-Fi or mobile data, then try again.",
  action,
  brand,
}: OfflinePageProperties) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-card px-6 py-16 text-center">
      {brand && <div className="mb-10">{brand}</div>}
      <div
        aria-hidden="true"
        className="w-56 max-w-full sm:w-64 [&_svg]:h-auto [&_svg]:w-full"
      >
        <AttentionNeededIllustration />
      </div>
      <h1 className="mt-6 max-w-lg font-serif text-display font-normal">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-lede text-muted-foreground">
        {description}
      </p>
      <div className="mt-8 [&_a]:inline-flex [&_a]:h-11 [&_a]:items-center [&_a]:justify-center [&_a]:rounded-full [&_a]:bg-primary [&_a]:px-8 [&_a]:text-sm [&_a]:font-semibold [&_a]:text-primary-foreground [&_a]:transition-opacity hover:[&_a]:opacity-90 [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_a]:focus-visible:ring-offset-2">
        {action}
      </div>
    </main>
  );
}

export type { OfflinePageProperties };
