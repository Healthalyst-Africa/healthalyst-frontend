import type { ReactNode } from "react";
import { cn } from "@healthalyst/ui/lib/utilities";

/** How tall the box may grow before its content scrolls inside it. */
const SCROLL_REGION_HEIGHTS = {
  small: "max-h-80",
  medium: "max-h-[28rem]",
  large: "max-h-[36rem]",
} as const;

/**
 * A list that can grow long, such as a patient's notes or a busy queue,
 * kept to a set height so it scrolls inside its own box instead of
 * stretching the page, panel or dialog. It can be scrolled with the
 * keyboard once focused, and is named for assistive technology.
 */
export function ScrollRegion({
  accessibleLabel,
  size = "medium",
  children,
  className,
}: {
  accessibleLabel: string;
  size?: keyof typeof SCROLL_REGION_HEIGHTS;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label={accessibleLabel}
      tabIndex={0}
      className={cn(
        "-m-1 overflow-y-auto overscroll-contain rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        SCROLL_REGION_HEIGHTS[size],
        className
      )}
    >
      {children}
    </div>
  );
}
