"use client";

import * as React from "react";
import { cn } from "@healthalyst/ui/lib/utilities";
import { ChevronDownIcon } from "lucide-react";

type NativeSelectProperties = React.ComponentPropsWithoutRef<"select"> & {
  controlSize?: "small" | "default";
};

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  NativeSelectProperties
>(({ className, controlSize = "default", ...properties }, elementReference) => {
  return (
    <div
      className="group/native-select relative w-full has-[select:disabled]:opacity-50"
      data-slot="native-select-wrapper"
    >
      <select
        ref={elementReference}
        data-slot="native-select"
        data-size={controlSize}
        className={cn(
          "h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-transparent px-3 py-2 pr-9 text-sm shadow-sm transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed data-[size=small]:h-8 data-[size=small]:py-1 dark:bg-input/30 dark:hover:bg-input/50",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...properties}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground opacity-50 select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
});
NativeSelect.displayName = "NativeSelect";

function NativeSelectOption({
  className,
  ...properties
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...properties}
    />
  );
}

function NativeSelectOptionGroup({
  className,
  ...properties
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...properties}
    />
  );
}

export { NativeSelect, NativeSelectOptionGroup, NativeSelectOption };
