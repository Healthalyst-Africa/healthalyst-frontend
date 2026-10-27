"use client";

import { ChevronRightIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { Skeleton } from "@healthalyst/ui/primitives/skeleton";
import { cn } from "@healthalyst/ui/lib/utilities";
import type {
  DataTableCell,
  DataTableProperties,
} from "@healthalyst/ui/types/data-table";
import { DataTableCellContent } from "./data-table-cell-content";

const LOADING_CARD_IDENTIFIERS = ["first", "second", "third"] as const;

/** The first column as the card's title, more prominent than the details. */
function CardTitle({ cell }: { cell: DataTableCell }) {
  if (cell.kind !== "text") return <DataTableCellContent cell={cell} />;
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-heading font-semibold text-foreground">
        {cell.primary}
      </span>
      {cell.secondary && (
        <span className="text-caption text-muted-foreground">
          {cell.secondary}
        </span>
      )}
    </span>
  );
}

function CardValue({ cell }: { cell: DataTableCell }) {
  return (
    <span className="text-body">
      <DataTableCellContent cell={cell} />
    </span>
  );
}

/**
 * The table's rows as cards, for narrow screens: the first column is the
 * card's title, the first status column a badge beside it, and the other
 * columns labelled details below.
 */
export function DataTableCardList<RowData>({
  accessibleLabel,
  columns,
  state,
  getRowIdentifier,
  rowAction,
}: Pick<
  DataTableProperties<RowData>,
  "accessibleLabel" | "columns" | "getRowIdentifier" | "rowAction"
> & {
  state: Extract<
    DataTableProperties<RowData>["state"],
    { status: "loading" } | { status: "ready" }
  >;
}) {
  const [titleColumn, ...otherColumns] = columns;

  if (state.status === "loading") {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          {state.label}
        </p>
        <ul aria-hidden="true" className="flex flex-col gap-3">
          {LOADING_CARD_IDENTIFIERS.map((cardIdentifier) => (
            <li
              key={cardIdentifier}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4"
            >
              <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
              <Skeleton className="h-3 w-3/4 motion-reduce:animate-none" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ul aria-label={accessibleLabel} className="flex flex-col gap-3">
      {state.rows.map((row) => {
        const cells = otherColumns.map((column) => ({
          column,
          cell: column.getCell(row),
        }));
        const statusEntry = cells.find(({ cell }) => cell.kind === "status");
        const detailEntries = cells.filter((entry) => entry !== statusEntry);

        return (
          <li
            key={getRowIdentifier(row)}
            className={cn(
              "flex flex-col gap-3 rounded-xl border bg-card p-4",
              rowAction &&
                "cursor-pointer transition-colors hover:bg-secondary/40"
            )}
            onClick={rowAction ? () => rowAction.onSelect(row) : undefined}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                {titleColumn && <CardTitle cell={titleColumn.getCell(row)} />}
              </div>
              {statusEntry?.cell.kind === "status" && (
                <StatusLabel tone={statusEntry.cell.tone}>
                  {statusEntry.cell.label}
                </StatusLabel>
              )}
            </div>
            {detailEntries.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-secondary px-3 py-3">
                {detailEntries.map(({ column, cell }) => (
                  <div key={column.key} className="flex min-w-0 flex-col">
                    <dt className="text-caption text-muted-foreground">
                      {column.label}
                    </dt>
                    <dd>
                      <CardValue cell={cell} />
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {rowAction && (
              <ActionButton
                type="button"
                variant="ghost"
                className="-mx-2 -mb-1 h-11 justify-between px-2 text-body font-semibold text-primary underline-offset-4 hover:bg-transparent hover:text-primary hover:underline"
                trailingIcon={<ChevronRightIcon className="size-4" />}
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  rowAction.onSelect(row);
                }}
              >
                {rowAction.label(row)}
              </ActionButton>
            )}
          </li>
        );
      })}
    </ul>
  );
}
