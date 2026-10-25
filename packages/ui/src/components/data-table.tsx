"use client";

import { useId } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@healthalyst/ui/components/card";
import { Skeleton } from "@healthalyst/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@healthalyst/ui/components/table";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { DataTableProperties } from "@healthalyst/ui/types/data-table";
import { DataTableCellContent } from "./data-table/data-table-cell-content";
import { DataTableMessage } from "./data-table/data-table-message";

const COLUMN_SIZES = {
  wide: "w-1/3 min-w-64",
  regular: "min-w-40",
  compact: "min-w-32",
} as const;

const LOADING_ROW_IDENTIFIERS = ["first", "second", "third"] as const;

/** A complete tabular data surface; applications supply records and column content. */
export function DataTable<RowData>({
  title,
  description,
  columns,
  state,
  getRowIdentifier,
  emptyState,
  summary,
}: DataTableProperties<RowData>) {
  const headingIdentifier = useId();
  const descriptionIdentifier = useId();

  return (
    <Card className="min-w-0 overflow-hidden shadow-none">
      <CardHeader className="gap-1.5 px-5 py-5 sm:px-6">
        <CardTitle className="text-base leading-6">
          <h2 id={headingIdentifier}>{title}</h2>
        </CardTitle>
        {description && (
          <CardDescription id={descriptionIdentifier} className="leading-6">
            {description}
          </CardDescription>
        )}
      </CardHeader>
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
            aria-labelledby={headingIdentifier}
            aria-describedby={description ? descriptionIdentifier : undefined}
            aria-busy={state.status === "loading" || undefined}
            tabIndex={0}
            className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&>div]:overflow-visible"
          >
            {state.status === "loading" && (
              <p role="status" className="sr-only">
                {state.label}
              </p>
            )}
            <Table aria-labelledby={headingIdentifier}>
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
                    </TableRow>
                  ))}
                {state.status === "ready" &&
                  state.rows.map((row) => (
                    <TableRow
                      key={getRowIdentifier(row)}
                      className="hover:bg-muted/25"
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className="h-20 px-5 py-4 text-sm font-normal leading-6 sm:px-6"
                        >
                          <DataTableCellContent cell={column.getCell(row)} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {summary && state.status === "ready" && state.rows.length > 0 && (
        <div className="border-t bg-muted/20 px-5 py-3 text-xs leading-5 text-muted-foreground sm:px-6">
          {summary}
        </div>
      )}
    </Card>
  );
}
