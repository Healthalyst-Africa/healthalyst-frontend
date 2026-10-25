import type { ReactNode } from "react";

export type DataTableCell =
  | { kind: "text"; primary: string; secondary?: string }
  | { kind: "date"; label: string; dateTime: string }
  | {
      kind: "status";
      label: string;
      tone: "neutral" | "positive" | "negative";
    };

export type DataTableColumn<RowData> = {
  key: string;
  label: string;
  size?: "wide" | "regular" | "compact";
  getCell: (row: RowData) => DataTableCell;
};

export type DataTableState<RowData> =
  | { status: "loading"; label: string }
  | {
      status: "error";
      title: string;
      description: string;
      retryLabel: string;
      onRetry: () => void;
    }
  | { status: "ready"; rows: readonly RowData[] };

export type DataTableEmptyState = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export type DataTableProperties<RowData> = {
  title: string;
  description?: string;
  columns: readonly DataTableColumn<RowData>[];
  state: DataTableState<RowData>;
  getRowIdentifier: (row: RowData) => string;
  emptyState: DataTableEmptyState;
  summary?: string;
};
