"use client";

import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProperties = ComponentProps<typeof Sonner>;

// Adapted from the shadcn toast. The apps have one light theme, so the theme
// is fixed instead of read from a theme provider.
function Toaster(properties: ToasterProperties) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...properties}
    />
  );
}

export { Toaster };
