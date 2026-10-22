"use client";

import * as React from "react";

import { cn } from "@healthalyst/ui/lib/utilities";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...properties }, elementReference) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-input/35 bg-card hover:border-input px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-xs placeholder:font-light placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={elementReference}
        {...properties}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
