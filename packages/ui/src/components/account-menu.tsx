"use client";

import type { ReactNode } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Avatar, AvatarFallback } from "@healthalyst/ui/primitives/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@healthalyst/ui/primitives/dropdown-menu";
import { cn } from "@healthalyst/ui/lib/utilities";

type AccountMenuAction = {
  label: string;
  /** Shown instead of `label` while the action runs. */
  pendingLabel?: string;
  isPending?: boolean;
  /** A decorative icon, hidden from assistive technology by the caller. */
  icon?: ReactNode;
  tone?: "default" | "destructive";
  onSelect: () => void;
};

type AccountMenuProperties = {
  fullName: string;
  emailAddress: string;
  actions: readonly AccountMenuAction[];
  /** A failure from the last action, announced inside the menu. */
  error?: string;
};

/** The signed-in person's avatar, opening their details and account actions. */
export function AccountMenu({
  fullName,
  emailAddress,
  actions,
  error,
}: AccountMenuProperties) {
  const initial = fullName.trim().slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ActionButton
          type="button"
          size="icon"
          variant="ghost"
          className="size-9 rounded-full p-0"
          aria-label={`Account menu for ${fullName}`}
        >
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="text-xs font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
        </ActionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-semibold">{fullName}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {emailAddress}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {error && (
          <p className="px-2 py-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            disabled={action.isPending}
            onSelect={action.onSelect}
            className={cn(
              action.tone === "destructive" &&
                "text-destructive focus:text-destructive"
            )}
          >
            {action.icon}
            {action.isPending && action.pendingLabel
              ? action.pendingLabel
              : action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { AccountMenuAction };
