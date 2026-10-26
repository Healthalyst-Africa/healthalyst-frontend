"use client";

import type { ReactNode } from "react";
import { NotificationIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@healthalyst/ui/primitives/popover";

type NotificationPanelProperties = {
  heading?: string;
  /** The notifications, or a message explaining why there are none. */
  children: ReactNode;
};

/** A toolbar button that opens the signed-in person's notifications. */
export function NotificationPanel({
  heading = "Notifications",
  children,
}: NotificationPanelProperties) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <ActionButton
          type="button"
          size="icon"
          variant="ghost"
          className="size-9 border border-border/40 bg-card/40 shadow-none hover:bg-muted/60"
          aria-label={heading}
        >
          <NotificationIcon aria-hidden="true" className="size-4" />
        </ActionButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <h2 className="font-serif text-base font-normal">{heading}</h2>
        <div className="mt-2 text-sm text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
