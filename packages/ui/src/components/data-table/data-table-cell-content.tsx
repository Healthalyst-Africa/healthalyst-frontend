import { Badge } from "@healthalyst/ui/components/badge";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { DataTableCell } from "@healthalyst/ui/types/data-table";

const STATUS_PRESENTATION = {
  neutral: "bg-muted text-muted-foreground",
  positive: "bg-primary/10 text-primary",
  negative: "bg-destructive/10 text-destructive",
} as const;

export function DataTableCellContent({ cell }: { cell: DataTableCell }) {
  if (cell.kind === "status") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1.5 whitespace-nowrap rounded-full border-transparent px-2.5 py-1 text-xs font-normal",
          STATUS_PRESENTATION[cell.tone]
        )}
      >
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
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
