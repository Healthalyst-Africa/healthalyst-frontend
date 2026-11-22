"use client";

import { Fragment, useRef, type ReactNode } from "react";
import {
  ChevronDownIcon,
  LoaderIcon,
  MoreActionsIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@healthalyst/ui/primitives/dropdown-menu";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { ActionMenuItem } from "@healthalyst/ui/types/action-menu";

/**
 * Secondary actions for one item, such as a card, behind an ellipsis button.
 * The button's accessible name says whose actions they are, for example
 * "Actions for Greenfield HMO". Arrow keys move through the list.
 *
 * With `trigger`, the menu opens from a labelled button instead, for a page
 * whose related actions would otherwise sit as a row of three or more
 * buttons, such as "Register a patient" with its kinds of registration.
 */
export function ActionMenu({
  accessibleLabel,
  items,
  trigger,
  className,
}: {
  accessibleLabel: string;
  items: readonly ActionMenuItem[];
  trigger?: {
    label: string;
    icon?: ReactNode;
    variant?: "default" | "outline";
  };
  className?: string;
}) {
  const triggerReference = useRef<HTMLButtonElement>(null);
  const hasChosenItemReference = useRef(false);

  return (
    // Not modal, so a dialog opened from an item takes focus cleanly.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {trigger ? (
          <ActionButton
            ref={triggerReference}
            type="button"
            variant={trigger.variant ?? "default"}
            className={className}
            leadingIcon={trigger.icon}
            trailingIcon={<ChevronDownIcon className="size-4" />}
          >
            {trigger.label}
          </ActionButton>
        ) : (
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
        )}
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
