"use client";

import { Card, CardContent } from "@healthalyst/ui/primitives/card";
import { Checkbox } from "@healthalyst/ui/primitives/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@healthalyst/ui/primitives/table";

type CheckboxMatrixColumn = { key: string; label: string };

type CheckboxMatrixRow = {
  key: string;
  label: string;
  /** Each column's state for this row, by column key. */
  values: Record<string, { checked: boolean; disabled?: boolean }>;
};

/**
 * Yes-or-no choices for a set of items, one column per question, such as
 * which services a site offers and which of them take referrals. Each
 * checkbox is named by its row and column for assistive technology.
 */
export function CheckboxMatrix({
  accessibleLabel,
  rowHeading,
  columns,
  rows,
  disabled = false,
  onCheckedChange,
}: {
  accessibleLabel: string;
  /** Heading above the item names, such as "Service". */
  rowHeading: string;
  columns: readonly CheckboxMatrixColumn[];
  rows: readonly CheckboxMatrixRow[];
  disabled?: boolean;
  onCheckedChange: (
    rowKey: string,
    columnKey: string,
    checked: boolean
  ) => void;
}) {
  return (
    <Card className="min-w-0 overflow-hidden shadow-none">
      <CardContent className="p-0">
        <Table aria-label={accessibleLabel}>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead
                scope="col"
                className="h-11 px-5 text-xs font-normal text-muted-foreground sm:px-6"
              >
                {rowHeading}
              </TableHead>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  scope="col"
                  className="h-11 w-20 px-2 text-center text-xs font-normal text-muted-foreground sm:w-36 sm:px-3"
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key} className="hover:bg-muted/25">
                <TableHead
                  scope="row"
                  className="h-12 px-5 text-body font-normal text-foreground sm:px-6"
                >
                  {row.label}
                </TableHead>
                {columns.map((column) => {
                  const cell = row.values[column.key];
                  return (
                    <TableCell
                      key={column.key}
                      // The table primitive drops the right padding of cells
                      // with a checkbox; keep both sides equal so it centres
                      // under its heading.
                      className="px-2 sm:px-3 [&:has([role=checkbox])]:pr-2 sm:[&:has([role=checkbox])]:pr-3"
                    >
                      <div className="flex justify-center">
                        <Checkbox
                          className="size-5"
                          aria-label={`${row.label}: ${column.label}`}
                          checked={cell?.checked ?? false}
                          disabled={disabled || cell?.disabled}
                          onCheckedChange={(checkedState) =>
                            onCheckedChange(
                              row.key,
                              column.key,
                              checkedState === true
                            )
                          }
                        />
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export type { CheckboxMatrixColumn, CheckboxMatrixRow };
