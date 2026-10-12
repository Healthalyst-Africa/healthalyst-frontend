"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  cva as createClassVariants,
  type VariantProps as VariantProperties,
} from "class-variance-authority";
import { cn } from "@healthalyst/ui/lib/utilities";

const buttonVariants = createClassVariants(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        unstyled: "",
        default: "bg-primary text-primary-foreground hover:opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        unstyled: "",
        default: "h-10 px-4 py-2",
        small: "h-9 rounded-md px-3",
        large: "h-11 rounded-md px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProperties
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProperties<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProperties>(
  (
    { asChild = false, className, variant, size, ...properties },
    elementReference
  ) => {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={elementReference}
        className={cn(buttonVariants({ variant, size }), className)}
        {...properties}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
