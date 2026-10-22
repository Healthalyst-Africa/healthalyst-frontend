"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@healthalyst/icons";

import { cn } from "@healthalyst/ui/lib/utilities";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...properties }, elementReference) => (
  <CheckboxPrimitive.Root
    ref={elementReference}
    className={cn(
      "peer grid size-4 shrink-0 place-content-center rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...properties}
  >
    <CheckboxPrimitive.Indicator className="grid place-content-center text-current">
      <CheckIcon className="size-3.5" aria-hidden="true" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
