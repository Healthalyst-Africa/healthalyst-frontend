import type { ReactNode } from "react";
import type { StatusTone } from "@healthalyst/ui/types/status-tone";

export type DataTableCell =
  | { kind: "text"; primary: string; secondary?: string }
  | { kind: "date"; label: string; dateTime: string }
  | {
      kind: "status";
      label: string;
      tone: StatusTone;
    };

/**
 * How much a row needs attention. `attention` and `critical` tint the row
 * from its leading edge and mark that edge in the status colour. Colour is
 * never the only signal: a cell must also say why, such as a status label.
 */
export type DataTableRowEmphasis = "none" | "attention" | "critical";

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
  /**
   * A decorative illustration from `@healthalyst/ui/illustrations/*`. It is
   * hidden from assistive technology, so the title must carry the meaning.
   */
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export type DataTableProperties<RowData> = {
  /** Names the table for assistive technology; it is not displayed. */
  accessibleLabel: string;
  columns: readonly DataTableColumn<RowData>[];
  state: DataTableState<RowData>;
  getRowIdentifier: (row: RowData) => string;
  emptyState: DataTableEmptyState;
  /**
   * Makes each row open something, such as a details panel. The whole row is
   * clickable, and a labelled button at the end of the row serves keyboards
   * and assistive technology.
   */
  /**
   * Rows shown before the table scrolls inside its own box, with its column
   * headings kept in view. Defaults to 5.
   */
  maximumVisibleRows?: number;
  /** Highlights rows that need attention first, such as long waits. */
  getRowEmphasis?: (row: RowData) => DataTableRowEmphasis;
  rowAction?: {
    /** The button's accessible name, such as "Review HealthAlyst". */
    label: (row: RowData) => string;
    onSelect: (row: RowData) => void;
  };
};
