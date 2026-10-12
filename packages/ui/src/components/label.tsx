"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import {
  cva as createClassVariants,
  type VariantProps as VariantProperties,
} from "class-variance-authority";

import { cn } from "@healthalyst/ui/lib/utilities";

const labelVariants = createClassVariants(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProperties<typeof labelVariants>
>(({ className, ...properties }, elementReference) => (
  <LabelPrimitive.Root
    ref={elementReference}
    className={cn(labelVariants(), className)}
    {...properties}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
