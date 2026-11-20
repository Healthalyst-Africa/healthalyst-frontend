"use client";

import { Fragment, useRef, type ReactNode } from "react";
import { LoaderIcon, MoreActionsIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@healthalyst/ui/primitives/dropdown-menu";
import { cn } from "@healthalyst/ui/lib/utilities";

type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Destructive actions, such as ending something, show in red. */
  tone?: "default" | "destructive";
  /** Draws a dividing line above the item, to set it apart. */
  separatedAbove?: boolean;
  isPending?: boolean;
  pendingLabel?: string;
};

/**
 * Secondary actions for one item, such as a card, behind an ellipsis button.
 * The button's accessible name says whose actions they are, for example
 * "Actions for Greenfield HMO". Arrow keys move through the list.
 */
export function ActionMenu({
  accessibleLabel,
  items,
  className,
}: {
  accessibleLabel: string;
  items: readonly ActionMenuItem[];
  className?: string;
}) {
  const triggerReference = useRef<HTMLButtonElement>(null);
  const hasChosenItemReference = useRef(false);

  return (
    // Not modal, so a dialog opened from an item takes focus cleanly.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <ActionButton
          ref={triggerReference}
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-8 shrink-0 text-muted-foreground", className)}
          aria-label={accessibleLabel}
        >
          <MoreActionsIcon aria-hidden="true" className="size-4" />
        </ActionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-48"
        onCloseAutoFocus={(focusEvent) => {
          // Focus was already moved when the item was chosen; moving it again
          // would pull it out of a dialog the item opened.
          if (hasChosenItemReference.current) {
            focusEvent.preventDefault();
            hasChosenItemReference.current = false;
          }
        }}
      >
        {items.map((item) => (
          <Fragment key={item.label}>
            {item.separatedAbove && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={item.isPending}
              // Put focus back on the menu button first, so a dialog the
              // action opens returns focus there when it closes.
              onSelect={() => {
                hasChosenItemReference.current = true;
                triggerReference.current?.focus();
                item.onSelect();
              }}
              className={cn(
                "gap-2 [&_svg]:size-4",
                item.tone === "destructive" &&
                  "text-destructive focus:bg-destructive/10 focus:text-destructive"
              )}
            >
              {item.isPending ? (
                <LoaderIcon aria-hidden="true" className="animate-spin" />
              ) : (
                item.icon && <span aria-hidden="true">{item.icon}</span>
              )}
              {item.isPending && item.pendingLabel
                ? item.pendingLabel
                : item.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { ActionMenuItem };
