import { Badge } from "@healthalyst/ui/primitives/badge";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { DataTableCell } from "@healthalyst/ui/types/data-table";

/** A softened version of the text colour, so the label leads. */
const SOFTENED_BORDER =
  "border-[color-mix(in_srgb,currentColor_40%,transparent)]";

/** Text and border colour for each status tone. */
const STATUS_PRESENTATION = {
  neutral: cn("text-status-neutral", SOFTENED_BORDER),
  information: cn("text-status-information", SOFTENED_BORDER),
  warning: cn("text-status-warning", SOFTENED_BORDER),
  // Brand gold is too light for text on white, but suits the border.
  highlight: "text-status-highlight border-gold",
  positive: cn("text-status-positive", SOFTENED_BORDER),
  negative: cn("text-status-negative", SOFTENED_BORDER),
} as const;

export function DataTableCellContent({ cell }: { cell: DataTableCell }) {
  if (cell.kind === "status") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "whitespace-nowrap rounded-full bg-transparent px-2.5 py-0.5 text-xs font-medium",
          STATUS_PRESENTATION[cell.tone]
        )}
      >
        {cell.label}
      </Badge>
    );
  }

  if (cell.kind === "date") {
    return (
      <time dateTime={cell.dateTime} className="whitespace-nowrap tabular-nums">
        {cell.label}
      </time>
    );
  }

  return (
    <div className="flex flex-col gap-1 [overflow-wrap:anywhere]">
      <span className="font-normal text-foreground">{cell.primary}</span>
      {cell.secondary && (
        <span className="text-xs leading-5 text-muted-foreground">
          {cell.secondary}
        </span>
      )}
    </div>
  );
}
