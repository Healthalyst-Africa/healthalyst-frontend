import type { ReactNode } from "react";

/** One action in an action menu. */
export type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Destructive actions, such as ending something, show in red. */
  tone?: "default" | "destructive";
  /** Draws a dividing line above the item, to set it apart. */
  separatedAbove?: boolean;
  isPending?: boolean;
  pendingLabel?: string;
};
