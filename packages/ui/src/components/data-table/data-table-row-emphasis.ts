import type { DataTableRowEmphasis } from "@healthalyst/ui/types/data-table";

/** Table rows: a tint fading from the leading edge, which is marked in colour. */
export const ROW_EMPHASIS_CLASS_NAMES: Record<DataTableRowEmphasis, string> = {
  none: "",
  attention:
    "bg-gradient-to-r from-alert-warning-surface from-30% to-transparent [&>td:first-child]:shadow-[inset_4px_0_0_var(--status-warning)]",
  critical:
    "bg-gradient-to-r from-alert-error-surface from-30% to-transparent [&>td:first-child]:shadow-[inset_4px_0_0_var(--status-negative)]",
};

/** Phone cards: the same tint, with the leading border in colour. */
export const CARD_EMPHASIS_CLASS_NAMES: Record<DataTableRowEmphasis, string> = {
  none: "bg-card",
  attention:
    "border-l-4 border-l-status-warning bg-gradient-to-r from-alert-warning-surface to-card",
  critical:
    "border-l-4 border-l-status-negative bg-gradient-to-r from-alert-error-surface to-card",
};
