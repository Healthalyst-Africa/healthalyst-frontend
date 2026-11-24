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
import { DataTableRowActions } from "./data-table/data-table-row-actions";
import { ROW_EMPHASIS_CLASS_NAMES } from "./data-table/data-table-row-emphasis";

const COLUMN_SIZES = {
  wide: "w-1/3 min-w-64",
  regular: "min-w-40",
  compact: "min-w-32",
} as const;

const LOADING_ROW_IDENTIFIERS = ["first", "second", "third"] as const;

const DEFAULT_MAXIMUM_VISIBLE_ROWS = 5;

/** The heading row (2.75rem) and each data row (5rem with its border). */
function readScrollHeight(maximumVisibleRows: number): string {
  return `calc(2.75rem + ${maximumVisibleRows} * (5rem + 1px))`;
}

/**
 * A complete, standalone tabular data surface; applications supply records and
 * column content. It has no visible title: place any page or section heading
 * outside the table, and name the table with `accessibleLabel`.
 */
/**
 * Phones show rows as cards, about this tall with the gap after them, and at
 * most this many before the cards scroll inside their own box: a phone
 * screen holds about three.
 */
const CARD_HEIGHT_REM = 9;
const MAXIMUM_VISIBLE_CARDS = 3;

export function DataTable<RowData>({
  accessibleLabel,
  columns,
  state,
  getRowIdentifier,
  emptyState,
  rowAction,
  getRowActions,
  getRowActionsLabel,
  getRowEmphasis,
  maximumVisibleRows = DEFAULT_MAXIMUM_VISIBLE_ROWS,
}: DataTableProperties<RowData>) {
  const isScrollable =
    state.status === "ready" && state.rows.length > maximumVisibleRows;
  const hasRows =
    state.status === "loading" ||
    (state.status === "ready" && state.rows.length > 0);

  return (
    <>
      {/* Phones show the rows as cards; wider screens show the table. */}
      {hasRows && (state.status === "loading" || state.status === "ready") && (
        <div
          className={cn(
            "sm:hidden",
            isScrollable && "-m-1 overflow-y-auto overscroll-contain p-1"
          )}
          style={
            isScrollable
              ? {
                  maxHeight: `${(Math.min(maximumVisibleRows, MAXIMUM_VISIBLE_CARDS) + 0.5) * CARD_HEIGHT_REM}rem`,
                }
              : undefined
          }
        >
          <DataTableCardList
            accessibleLabel={accessibleLabel}
            columns={columns}
            state={state}
            getRowIdentifier={getRowIdentifier}
            rowAction={rowAction}
            getRowActions={getRowActions}
            getRowActionsLabel={getRowActionsLabel}
            getRowEmphasis={getRowEmphasis}
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
              className={cn(
                "overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&>div]:overflow-visible",
                isScrollable && "overflow-y-auto overscroll-contain"
              )}
              style={
                isScrollable
                  ? { maxHeight: readScrollHeight(maximumVisibleRows) }
                  : undefined
              }
            >
              {state.status === "loading" && (
                <p role="status" className="sr-only">
                  {state.label}
                </p>
              )}
              <Table aria-label={accessibleLabel}>
                {/* The headings stay in view while the rows scroll beneath. */}
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
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
                    {(rowAction || getRowActions) && (
                      <TableHead
                        scope="col"
                        className={cn(
                          "px-3",
                          rowAction && getRowActions ? "w-24" : "w-14"
                        )}
                      >
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
                        {(rowAction || getRowActions) && (
                          <TableCell className="px-3" />
                        )}
                      </TableRow>
                    ))}
                  {state.status === "ready" &&
                    state.rows.map((row) => (
                      <TableRow
                        key={getRowIdentifier(row)}
                        className={cn(
                          "hover:bg-muted/25",
                          rowAction && "cursor-pointer hover:bg-secondary/50",
                          ROW_EMPHASIS_CLASS_NAMES[
                            getRowEmphasis?.(row) ?? "none"
                          ]
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
                        {(rowAction || getRowActions) && (
                          <TableCell className="px-3 py-4 text-right">
                            <span className="inline-flex items-center justify-end gap-1">
                              {getRowActions && (
                                <DataTableRowActions
                                  items={getRowActions(row)}
                                  accessibleLabel={
                                    getRowActionsLabel?.(row) ?? "Actions"
                                  }
                                />
                              )}
                              {rowAction &&
                                (rowAction.visibleLabel ? (
                                  <ActionButton
                                    type="button"
                                    size="compact"
                                    variant="outline"
                                    aria-label={rowAction.label(row)}
                                    onClick={(clickEvent) => {
                                      clickEvent.stopPropagation();
                                      rowAction.onSelect(row);
                                    }}
                                  >
                                    {rowAction.visibleLabel}
                                  </ActionButton>
                                ) : (
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
                                ))}
                            </span>
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
