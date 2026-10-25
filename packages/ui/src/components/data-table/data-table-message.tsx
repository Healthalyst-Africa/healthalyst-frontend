import type { ReactNode } from "react";
import { EmptyState } from "@healthalyst/ui/components/empty-state";

export function DataTableMessage({
  illustration,
  title,
  description,
  action,
  isError = false,
}: {
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  isError?: boolean;
}) {
  return (
    <EmptyState
      illustration={illustration}
      title={title}
      description={description}
      action={action}
      tone={isError ? "error" : "empty"}
      surface="plain"
      className="border-t"
    />
  );
}
