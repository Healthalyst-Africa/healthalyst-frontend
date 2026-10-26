import type { ReactNode } from "react";
import { InformationIcon } from "@healthalyst/icons";
import { cn } from "@healthalyst/ui/lib/utilities";

/** A short tip with an information icon, such as guidance under a field. */
export function HintText({
  id,
  children,
  className,
}: {
  /** Lets a control reference the tip with `aria-describedby`. */
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      id={id}
      className={cn(
        "flex items-start gap-1.5 text-xs italic leading-5 text-muted-foreground",
        className
      )}
    >
      <InformationIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
