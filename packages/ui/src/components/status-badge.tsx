import type { ReactNode } from "react";
import { Badge } from "@healthalyst/ui/primitives/badge";

type StatusBadgeProperties = {
  /** `filled` marks a settled state; `outlined` marks one still to do. */
  emphasis?: "filled" | "outlined";
  children: ReactNode;
};

/** A short status label, such as "Complete" or "Required". */
export function StatusBadge({
  emphasis = "filled",
  children,
}: StatusBadgeProperties) {
  return (
    <Badge variant={emphasis === "filled" ? "secondary" : "outline"}>
      {children}
    </Badge>
  );
}
