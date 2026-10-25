"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@healthalyst/ui/primitives/sheet";

type DetailSheetProperties = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** A short line under the title, such as when a record was submitted. */
  description?: ReactNode;
  /** Content beside the title, such as a status label. */
  titleAccessory?: ReactNode;
  children: ReactNode;
  /** Actions that stay visible at the bottom while the body scrolls. */
  footer?: ReactNode;
};

/**
 * A wide panel that slides in from the right to show and act on one record,
 * with a scrolling body and an optional fixed footer for actions.
 */
export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  titleAccessory,
  children,
  footer,
}: DetailSheetProperties) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="gap-2 border-b px-6 pb-5 pt-6 text-left sm:px-8">
          <div className="flex flex-wrap items-center gap-3 pr-10">
            <SheetTitle className="font-serif text-2xl font-normal leading-tight">
              {title}
            </SheetTitle>
            {titleAccessory}
          </div>
          {description && (
            <SheetDescription className="text-sm text-muted-foreground">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-3 border-t bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export type { DetailSheetProperties };
