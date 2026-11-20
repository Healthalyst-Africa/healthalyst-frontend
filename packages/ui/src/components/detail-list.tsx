import type { ReactNode } from "react";
import { cn } from "@healthalyst/ui/lib/utilities";

type DetailListItem = {
  term: string;
  /** Null when nothing is recorded: shown as a red "N/A". */
  description: ReactNode | null;
};

/**
 * A value that was never recorded. Screen readers hear the full words rather
 * than the letters.
 */
function MissingValue() {
  return (
    <span className="font-medium text-destructive">
      <span aria-hidden="true">N/A</span>
      <span className="sr-only">Not recorded</span>
    </span>
  );
}

/**
 * Labelled facts about one record, such as "Phone" and its number. Terms sit
 * beside their values from tablet width and above them on phones. `striped`
 * shades every other row inside a bordered box, for longer lists that are
 * read across, such as a patient's registration details.
 */
export function DetailList({
  items,
  variant = "plain",
  className,
}: {
  items: readonly DetailListItem[];
  variant?: "plain" | "striped";
  className?: string;
}) {
  if (variant === "striped") {
    return (
      <dl
        className={cn(
          "overflow-hidden rounded-lg border text-sm [&>div:nth-child(odd)]:bg-muted/60",
          className
        )}
      >
        {items.map((item) => (
          <div
            key={item.term}
            className="grid gap-x-6 gap-y-0.5 px-4 py-2.5 sm:grid-cols-[minmax(8rem,12rem)_1fr]"
          >
            <dt className="text-muted-foreground">{item.term}</dt>
            <dd className="min-w-0 [overflow-wrap:anywhere]">
              {item.description ?? <MissingValue />}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[minmax(8rem,12rem)_1fr]",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.term} className="contents">
          <dt className="text-muted-foreground">{item.term}</dt>
          <dd className="min-w-0 [overflow-wrap:anywhere] max-sm:mb-2">
            {item.description ?? <MissingValue />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export type { DetailListItem };
