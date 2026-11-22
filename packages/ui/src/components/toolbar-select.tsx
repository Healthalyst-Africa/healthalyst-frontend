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
  /** Options sharing a group are listed together under its name. */
  group?: string;
};

/** Consecutive options of the same group, keeping their order. */
function groupOptions(options: readonly ToolbarSelectOption[]) {
  const groups: { name: string | undefined; options: ToolbarSelectOption[] }[] =
    [];
  for (const option of options) {
    const lastGroup = groups.at(-1);
    if (lastGroup && lastGroup.name === option.group) {
      lastGroup.options.push(option);
    } else {
      groups.push({ name: option.group, options: [option] });
    }
  }
  return groups;
}

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
  const hasGroups = options.some((option) => option.group !== undefined);

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
      <DropdownMenuContent
        align={align}
        className="max-h-[min(28rem,var(--radix-dropdown-menu-content-available-height))] w-64 overflow-y-auto"
      >
        {!hasGroups && (
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            {label}
          </DropdownMenuLabel>
        )}
        <DropdownMenuRadioGroup
          value={value ?? ""}
          onValueChange={onValueChange}
        >
          {groupOptions(options).map((group, groupIndex) => (
            <div
              key={group.name ?? `group-${groupIndex}`}
              role="group"
              aria-label={group.name}
              className={cn(
                groupIndex > 0 && hasGroups && "mt-1 border-t pt-1"
              )}
            >
              {group.name && (
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  {group.name}
                </DropdownMenuLabel>
              )}
              {group.options.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  className="min-h-10 cursor-pointer"
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </div>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { ToolbarSelectOption };
