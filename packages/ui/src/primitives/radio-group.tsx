"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "@healthalyst/ui/lib/utilities";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...properties }, elementReference) => (
  <RadioGroupPrimitive.Root
    ref={elementReference}
    className={cn("grid gap-2", className)}
    {...properties}
  />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...properties }, elementReference) => (
  <RadioGroupPrimitive.Item
    ref={elementReference}
    className={cn(
      "peer grid aspect-square size-4 shrink-0 place-content-center rounded-full border border-border text-primary focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=checked]:border-primary",
      className
    )}
    {...properties}
  >
    <RadioGroupPrimitive.Indicator className="grid place-content-center">
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
