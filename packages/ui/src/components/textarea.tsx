"use client";

import * as React from "react";

import { cn } from "@healthalyst/ui/lib/utilities";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...properties }, elementReference) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input/35 transition-colors hover:border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-xs placeholder:font-light placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={elementReference}
      {...properties}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
