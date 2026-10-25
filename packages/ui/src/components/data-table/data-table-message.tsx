import type { ReactNode } from "react";

export function DataTableMessage({
  title,
  description,
  action,
  isError = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  isError?: boolean;
}) {
  return (
    <div className="flex min-h-48 items-center justify-center border-t px-6 py-8 text-center">
      <div
        role={isError ? "alert" : "status"}
        className="mx-auto flex max-w-md flex-col items-center gap-2"
      >
        <p className="text-sm text-foreground">{title}</p>
        {description && (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-2 [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center [&_a]:rounded-sm [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_a]:focus-visible:ring-offset-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
