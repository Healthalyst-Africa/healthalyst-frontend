import * as React from "react";
import {
  cva as createClassVariants,
  type VariantProps as VariantProperties,
} from "class-variance-authority";

import { cn } from "@healthalyst/ui/lib/utilities";

const badgeVariants = createClassVariants(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        subtle: "border-transparent bg-gold-subtle text-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// A span rather than shadcn's default div, so a badge is valid phrasing
// content inside buttons, such as a multi-select trigger.
export interface BadgeProperties
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProperties<typeof badgeVariants> {}

function Badge({ className, variant, ...properties }: BadgeProperties) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...properties}
    />
  );
}

export { Badge, badgeVariants };
