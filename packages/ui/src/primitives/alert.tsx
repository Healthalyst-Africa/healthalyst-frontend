import * as React from "react";
import {
  cva as createClassVariants,
  type VariantProps as VariantProperties,
} from "class-variance-authority";

import { cn } from "@healthalyst/ui/lib/utilities";

const alertVariants = createClassVariants(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        information:
          "border-alert-information-border bg-alert-information-surface text-foreground [&>svg]:text-status-information",
        success:
          "border-alert-success-border bg-alert-success-surface text-foreground [&>svg]:text-status-positive",
        warning:
          "border-alert-warning-border bg-alert-warning-surface text-foreground [&>svg]:text-status-warning",
        destructive:
          "border-alert-error-border bg-alert-error-surface text-foreground [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProperties<typeof alertVariants>
>(({ className, variant, ...properties }, elementReference) => (
  <div
    ref={elementReference}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...properties}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...properties }, elementReference) => (
  <div
    ref={elementReference}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...properties}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...properties }, elementReference) => (
  <div
    ref={elementReference}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...properties}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
