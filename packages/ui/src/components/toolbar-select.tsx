"use client";

import { ChevronDownIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@healthalyst/ui/primitives/dropdown-menu";
import { cn } from "@healthalyst/ui/lib/utilities";

type ToolbarSelectOption = {
  value: string;
  label: string;
};

type ToolbarSelectProperties = {
  /** What is being chosen, such as "Branch". */
  label: string;
  /** Shown while nothing is chosen, such as "Choose a branch". */
  placeholder: string;
  value: string | null;
  options: readonly ToolbarSelectOption[];
  onValueChange: (value: string) => void;
  /** Where the menu lines up with the control. */
  align?: "start" | "end";
  className?: string;
};

/**
 * A compact choice for a dashboard toolbar, such as the branch someone is
 * working at. With a single option there is nothing to choose, so it shows
 * the option as text.
 */
export function ToolbarSelect({
  label,
  placeholder,
  value,
  options,
  onValueChange,
  align = "start",
  className,
}: ToolbarSelectProperties) {
  const selectedOption = options.find((option) => option.value === value);

  if (selectedOption && options.length === 1) {
    return (
      <p className={cn("flex min-w-0 items-baseline gap-2 text-sm", className)}>
        <span className="shrink-0 text-muted-foreground">{label}</span>
        <span className="truncate font-medium">{selectedOption.label}</span>
      </p>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ActionButton
          type="button"
          variant="ghost"
          className={cn(
            "h-10 min-w-0 max-w-full justify-start gap-2 rounded-md px-3 font-normal",
            className
          )}
          aria-label={`${label}: ${selectedOption?.label ?? "none chosen"}. Change ${label.toLowerCase()}`}
        >
          <span className="shrink-0 text-muted-foreground">{label}</span>
          <span className="truncate font-medium">
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 opacity-60"
          />
        </ActionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value ?? ""}
          onValueChange={onValueChange}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="min-h-10 cursor-pointer"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { ToolbarSelectOption };
