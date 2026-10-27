import type { ReactNode } from "react";
import { Card, CardContent } from "@healthalyst/ui/primitives/card";
import { Skeleton } from "@healthalyst/ui/primitives/skeleton";

type MetricSummaryItem = {
  label: string;
  value: number | string;
  icon?: ReactNode;
};

export function MetricSummary({
  items,
  isLoading = false,
}: {
  items: readonly MetricSummaryItem[];
  isLoading?: boolean;
}) {
  return (
    <div
      // Two across on phones, so four metrics take two rows, not four.
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      aria-busy={isLoading || undefined}
    >
      {items.map((item) => (
        <Card key={item.label} className="shadow-none">
          <CardContent className="p-4 sm:p-6">
            <dl className="flex flex-col gap-2 sm:gap-3">
              <dt className="flex flex-col items-start gap-2 text-body text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
                {item.icon && (
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground [&_svg]:size-4"
                  >
                    {item.icon}
                  </span>
                )}
                {item.label}
              </dt>
              <dd className="text-xl font-semibold tabular-nums sm:text-2xl">
                {isLoading ? (
                  <>
                    <span className="sr-only">Loading</span>
                    <Skeleton
                      className="h-7 w-12 motion-reduce:animate-none sm:h-8"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  item.value
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
