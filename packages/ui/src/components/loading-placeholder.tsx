import { Skeleton } from "@healthalyst/ui/primitives/skeleton";
import { cn } from "@healthalyst/ui/lib/utilities";

const BLOCK_HEIGHT_CLASS_NAMES = {
  rule: "h-2",
  text: "h-4",
  heading: "h-6",
  field: "h-12",
  card: "h-20",
} as const;

const BLOCK_WIDTH_CLASS_NAMES = {
  short: "w-32",
  medium: "w-48",
  full: "w-full",
} as const;

type LoadingPlaceholderRow = {
  shape: keyof typeof BLOCK_HEIGHT_CLASS_NAMES;
  width?: keyof typeof BLOCK_WIDTH_CLASS_NAMES;
  /** Draws the shape side by side in two columns on wider screens. */
  columns?: 1 | 2;
};

type LoadingPlaceholderProperties = {
  /** Announced to assistive technology while the content loads. */
  label: string;
  rows: readonly LoadingPlaceholderRow[];
  /** Draws the placeholder inside a bordered surface. */
  framed?: boolean;
};

/** Shapes that stand in for content while it loads, without layout shift. */
export function LoadingPlaceholder({
  label,
  rows,
  framed = false,
}: LoadingPlaceholderProperties) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        framed && "gap-6 rounded-2xl border border-border p-8"
      )}
      role="status"
    >
      <span className="sr-only">{label}</span>
      {rows.map((row, rowIndex) => {
        const shapeClassName = cn(
          "motion-reduce:animate-none",
          BLOCK_HEIGHT_CLASS_NAMES[row.shape],
          BLOCK_WIDTH_CLASS_NAMES[row.width ?? "full"]
        );

        return row.columns === 2 ? (
          <div
            key={rowIndex}
            aria-hidden="true"
            className="grid gap-5 sm:grid-cols-2"
          >
            <Skeleton className={shapeClassName} />
            <Skeleton className={shapeClassName} />
          </div>
        ) : (
          <Skeleton
            key={rowIndex}
            aria-hidden="true"
            className={shapeClassName}
          />
        );
      })}
    </div>
  );
}

export type { LoadingPlaceholderRow };
