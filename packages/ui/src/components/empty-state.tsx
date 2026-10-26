import type { ReactNode } from "react";
import { cn } from "@healthalyst/ui/lib/utilities";

type EmptyStateProperties = {
  /**
   * A decorative illustration from `@healthalyst/ui/illustrations/*`. It is
   * hidden from assistive technology, so the title must carry the meaning.
   */
  illustration?: ReactNode;
  title: string;
  description?: ReactNode;
  /** A next step, such as a link to related records or a retry button. */
  action?: ReactNode;
  /** `error` interrupts as an alert; `empty` is announced politely. */
  tone?: "empty" | "error";
  /** `panel` stands alone on a page with its own border; `plain` sits inside another surface. */
  surface?: "panel" | "plain";
  className?: string;
};

/**
 * A centred message for a list, queue or page with nothing to show, with an
 * optional illustration and next step.
 */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  tone = "empty",
  surface = "panel",
  className,
}: EmptyStateProperties) {
  return (
    <div
      className={cn(
        "flex min-h-48 items-center justify-center px-6 py-10 text-center",
        surface === "panel" && "rounded-lg border bg-card",
        className
      )}
    >
      <div
        role={tone === "error" ? "alert" : "status"}
        className="mx-auto flex max-w-md flex-col items-center gap-2"
      >
        {illustration && (
          <div
            aria-hidden="true"
            className="mb-3 w-28 max-w-full [&_svg]:h-auto [&_svg]:w-full"
          >
            {illustration}
          </div>
        )}
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-3 [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center [&_a]:rounded-sm [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_a]:focus-visible:ring-offset-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
