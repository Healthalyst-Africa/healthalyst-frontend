import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRightIcon } from "@healthalyst/icons";

import { cn } from "@healthalyst/ui/lib/utilities";

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav">
>(({ ...properties }, elementReference) => (
  <nav ref={elementReference} aria-label="Breadcrumb" {...properties} />
));
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...properties }, elementReference) => (
  <ol
    ref={elementReference}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...properties}
  />
));
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...properties }, elementReference) => (
  <li
    ref={elementReference}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...properties}
  />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean;
  }
>(({ asChild, className, ...properties }, elementReference) => {
  const Component = asChild ? Slot : "a";

  return (
    <Component
      ref={elementReference}
      className={cn("transition-colors hover:text-foreground", className)}
      {...properties}
    />
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...properties }, elementReference) => (
  <span
    ref={elementReference}
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...properties}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = ({
  children,
  className,
  ...properties
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3.5", className)}
    {...properties}
  >
    {children ?? <ChevronRightIcon />}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
