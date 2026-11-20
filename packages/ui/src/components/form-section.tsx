import type { ReactNode } from "react";
import { cn } from "@healthalyst/ui/lib/utilities";

/**
 * A group of related fields under a heading, two to a row from tablet width
 * and one to a row on phones. Give a field `sm:col-span-2` to span the row.
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-1 text-base font-semibold text-foreground">
        {title}
      </legend>
      {description && (
        <p className="text-caption text-muted-foreground">{description}</p>
      )}
      <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
