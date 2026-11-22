import type { AnchorHTMLAttributes, ElementType, ReactNode } from "react";
import { ChevronRightIcon } from "@healthalyst/icons";
import { Skeleton } from "@healthalyst/ui/primitives/skeleton";
import { cn } from "@healthalyst/ui/lib/utilities";

type WorkCardLinkProperties = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

type WorkCard = {
  /** The job, such as "Check patients in". */
  title: string;
  /** Where it stands now, such as "16 booked, not yet arrived". */
  status: string;
  href: string;
  /**
   * A decorative illustration for the job, from
   * `@healthalyst/ui/illustrations/*`. The title carries the meaning.
   */
  illustration: ReactNode;
  /** Marks a status that needs someone, such as patients waiting. */
  needsAttention?: boolean;
  isLoading?: boolean;
};

/**
 * Today's jobs as cards, each opening the page where the job is done, with
 * a short status so people see at a glance where they are needed.
 */
export function WorkCardGrid({
  cards,
  linkComponent: CardLink = "a",
}: {
  cards: readonly WorkCard[];
  /** The application's link component, such as the framework's client-side link. */
  linkComponent?: ElementType<WorkCardLinkProperties>;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <li key={card.href} className="flex">
          <CardLink
            href={card.href}
            className="group flex w-full items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span
              aria-hidden="true"
              className="size-12 shrink-0 [&_svg]:size-12"
            >
              {card.illustration}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
              <span className="text-sm font-semibold leading-5">
                {card.title}
              </span>
              {card.isLoading ? (
                <>
                  <span className="sr-only">Loading</span>
                  <Skeleton
                    aria-hidden="true"
                    className="h-4 w-32 motion-reduce:animate-none"
                  />
                </>
              ) : (
                <span
                  className={cn(
                    "text-sm leading-5",
                    card.needsAttention
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {card.status}
                </span>
              )}
            </span>
            <ChevronRightIcon
              aria-hidden="true"
              className="mt-3.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </CardLink>
        </li>
      ))}
    </ul>
  );
}

export type { WorkCard };
