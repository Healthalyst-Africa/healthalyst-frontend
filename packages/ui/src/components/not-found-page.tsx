import type { ReactNode } from "react";
import { PageNotFoundIllustration } from "@healthalyst/ui/illustrations/page-not-found-illustration";

type NotFoundPageProperties = {
  title?: string;
  description?: string;
  /** Where to go next, such as a link to the application's home page. */
  action: ReactNode;
  /** An optional brand mark shown above the illustration. */
  brand?: ReactNode;
};

/** A full-page "not found" state with an illustration and a way back. */
export function NotFoundPage({
  title = "We could not find that page",
  description = "The link may be out of date, or the page may have moved. Check the address, or go back to where you started.",
  action,
  brand,
}: NotFoundPageProperties) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-card px-6 py-16 text-center">
      {brand && <div className="mb-10">{brand}</div>}
      <div
        aria-hidden="true"
        className="w-56 max-w-full sm:w-64 [&_svg]:h-auto [&_svg]:w-full"
      >
        <PageNotFoundIllustration />
      </div>
      <p className="mt-6 text-sm font-medium text-muted-foreground">
        Error 404
      </p>
      <h1 className="mt-2 max-w-lg font-serif text-display font-normal">
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

export type { NotFoundPageProperties };
