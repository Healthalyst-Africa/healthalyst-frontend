import { StatusLabel } from "@healthalyst/ui/components/status-label";
import type { DataTableCell } from "@healthalyst/ui/types/data-table";

export function DataTableCellContent({ cell }: { cell: DataTableCell }) {
  if (cell.kind === "status") {
    return <StatusLabel tone={cell.tone}>{cell.label}</StatusLabel>;
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
