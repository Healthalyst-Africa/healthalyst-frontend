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
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-busy={isLoading || undefined}
    >
      {items.map((item) => (
        <Card key={item.label} className="shadow-none">
          <CardContent className="p-6">
            <dl className="flex flex-col gap-3">
              <dt className="flex items-center gap-3 text-sm text-muted-foreground">
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
              <dd className="text-2xl font-normal tabular-nums">
                {isLoading ? (
                  <>
                    <span className="sr-only">Loading</span>
                    <Skeleton
                      className="h-8 w-12 motion-reduce:animate-none"
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
