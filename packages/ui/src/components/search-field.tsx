"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { SearchIcon } from "@healthalyst/icons";
import { Input } from "@healthalyst/ui/primitives/input";
import { cn } from "@healthalyst/ui/lib/utilities";

type SearchFieldProperties = Omit<
  ComponentPropsWithoutRef<"input">,
  "className" | "type"
> & {
  className?: string;
  inputClassName?: string;
};

const SearchField = forwardRef<HTMLInputElement, SearchFieldProperties>(
  ({ className, inputClassName, ...properties }, elementReference) => (
    <div
      className={cn(
        "relative flex h-10 min-w-0 items-center rounded-md border border-border bg-background transition-colors hover:border-border",
        "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        className
      )}
    >
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        {...properties}
        ref={elementReference}
        type="search"
        className={cn(
          "h-full border-0 bg-transparent pl-9 pr-3 shadow-none focus-visible:ring-0",
          inputClassName
        )}
      />
    </div>
  )
);

SearchField.displayName = "SearchField";

export { SearchField };
export type { SearchFieldProperties };
