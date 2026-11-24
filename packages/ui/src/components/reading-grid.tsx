import { cn } from "@healthalyst/ui/lib/utilities";

type Reading = {
  label: string;
  value: string;
};

/**
 * Short measured values, such as vital signs, as compact tiles: two across on
 * phones, four on wider screens. Each tile keeps its label above its value,
 * so values never wrap a letter at a time in a narrow column.
 */
export function ReadingGrid({
  readings,
  className,
}: {
  readings: readonly Reading[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {readings.map((reading) => (
        <div
          key={reading.label}
          className="flex min-w-0 flex-col gap-0.5 rounded-lg border bg-card px-3 py-2"
        >
          <dt className="text-caption text-muted-foreground">
            {reading.label}
          </dt>
          <dd className="text-sm font-semibold tabular-nums [overflow-wrap:anywhere]">
            {reading.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export type { Reading };
