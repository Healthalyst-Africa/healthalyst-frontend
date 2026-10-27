"use client";

import { ChevronRightIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Card, CardContent } from "@healthalyst/ui/primitives/card";
import { Skeleton } from "@healthalyst/ui/primitives/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@healthalyst/ui/primitives/table";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { DataTableProperties } from "@healthalyst/ui/types/data-table";
import { DataTableCardList } from "./data-table/data-table-card-list";
import { DataTableCellContent } from "./data-table/data-table-cell-content";
import { DataTableMessage } from "./data-table/data-table-message";

const COLUMN_SIZES = {
  wide: "w-1/3 min-w-64",
  regular: "min-w-40",
  compact: "min-w-32",
} as const;

const LOADING_ROW_IDENTIFIERS = ["first", "second", "third"] as const;

/**
 * A complete, standalone tabular data surface; applications supply records and
 * column content. It has no visible title: place any page or section heading
 * outside the table, and name the table with `accessibleLabel`.
 */
export function DataTable<RowData>({
  accessibleLabel,
  columns,
  state,
  getRowIdentifier,
  emptyState,
  rowAction,
}: DataTableProperties<RowData>) {
  const hasRows =
    state.status === "loading" ||
    (state.status === "ready" && state.rows.length > 0);

  return (
    <>
      {/* Phones show the rows as cards; wider screens show the table. */}
      {hasRows && (state.status === "loading" || state.status === "ready") && (
        <div className="sm:hidden">
          <DataTableCardList
            accessibleLabel={accessibleLabel}
            columns={columns}
            state={state}
            getRowIdentifier={getRowIdentifier}
            rowAction={rowAction}
          />
        </div>
      )}
      <Card
        className={cn(
          "min-w-0 overflow-hidden shadow-none",
          hasRows && "max-sm:hidden"
        )}
      >
        <CardContent className="p-0">
          {state.status === "error" && (
            <DataTableMessage
              title={state.title}
              description={state.description}
              isError
              action={
                <ActionButton
                  type="button"
                  variant="outline"
                  onClick={state.onRetry}
                >
                  {state.retryLabel}
                </ActionButton>
              }
            />
          )}
          {state.status === "ready" && state.rows.length === 0 && (
            <DataTableMessage {...emptyState} />
          )}
          {(state.status === "loading" ||
            (state.status === "ready" && state.rows.length > 0)) && (
            <div
              role="region"
              aria-label={accessibleLabel}
              aria-busy={state.status === "loading" || undefined}
              tabIndex={0}
              className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&>div]:overflow-visible"
            >
              {state.status === "loading" && (
                <p role="status" className="sr-only">
                  {state.label}
                </p>
              )}
              <Table aria-label={accessibleLabel}>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        scope="col"
                        className={cn(
                          "h-11 px-5 text-xs font-normal text-muted-foreground sm:px-6",
                          COLUMN_SIZES[column.size ?? "regular"]
                        )}
                      >
                        {column.label}
                      </TableHead>
                    ))}
                    {rowAction && (
                      <TableHead scope="col" className="w-14 px-3">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.status === "loading" &&
                    LOADING_ROW_IDENTIFIERS.map((rowIdentifier) => (
                      <TableRow key={rowIdentifier} aria-hidden="true">
                        {columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className="h-20 px-5 py-4 sm:px-6"
                          >
                            <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
                          </TableCell>
                        ))}
                        {rowAction && <TableCell className="px-3" />}
                      </TableRow>
                    ))}
                  {state.status === "ready" &&
                    state.rows.map((row) => (
                      <TableRow
                        key={getRowIdentifier(row)}
                        className={cn(
                          "hover:bg-muted/25",
                          rowAction && "cursor-pointer hover:bg-secondary/50"
                        )}
                        onClick={
                          rowAction ? () => rowAction.onSelect(row) : undefined
                        }
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className="h-20 px-5 py-4 text-sm font-normal leading-6 sm:px-6"
                          >
                            <DataTableCellContent cell={column.getCell(row)} />
                          </TableCell>
                        ))}
                        {rowAction && (
                          <TableCell className="px-3 py-4 text-right">
                            <ActionButton
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-9 text-muted-foreground"
                              aria-label={rowAction.label(row)}
                              onClick={(clickEvent) => {
                                clickEvent.stopPropagation();
                                rowAction.onSelect(row);
                              }}
                            >
                              <ChevronRightIcon
                                aria-hidden="true"
                                className="size-4"
                              />
                            </ActionButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
