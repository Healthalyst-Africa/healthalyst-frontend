"use client";

import { forwardRef, type ComponentProps } from "react";
import { Input } from "@healthalyst/ui/components/input";
import { cn } from "@healthalyst/ui/lib/utilities";

function InputGroup({ className, ...properties }: ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="input-group"
      className={cn(
        "group/input-group relative flex h-11 w-full min-w-0 items-center rounded-md border border-border bg-card transition-colors hover:border-border",
        "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-1 has-[[data-slot=input-group-control]:focus-visible]:ring-ring",
        "has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive",
        className
      )}
      {...properties}
    />
  );
}

type InputGroupAddonProperties = ComponentProps<"div"> & {
  align?: "inline-start" | "inline-end";
};

function InputGroupAddon({
  className,
  align = "inline-start",
  ...properties
}: InputGroupAddonProperties) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex shrink-0 items-center justify-center text-muted-foreground",
        align === "inline-start" ? "order-first pl-0.5" : "order-last pr-0.5",
        className
      )}
      {...properties}
    />
  );
}

const InputGroupInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, ...properties }, elementReference) => (
    <Input
      ref={elementReference}
      data-slot="input-group-control"
      className={cn(
        "min-w-0 flex-1 rounded-[inherit] border-0 bg-transparent shadow-none focus-visible:ring-0",
        className
      )}
      {...properties}
    />
  )
);

InputGroupInput.displayName = "InputGroupInput";

export { InputGroup, InputGroupAddon, InputGroupInput };
