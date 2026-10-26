"use client";

import { useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@healthalyst/icons";
import { Badge } from "@healthalyst/ui/primitives/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@healthalyst/ui/primitives/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@healthalyst/ui/primitives/popover";
import type { FormOption } from "@healthalyst/ui/types/form-definition";
import { cn } from "@healthalyst/ui/lib/utilities";

/** Lists longer than this get a search box. */
const SEARCHABLE_OPTION_COUNT = 7;

type MultiSelectProperties = {
  identifier: string;
  name: string;
  options: readonly FormOption[];
  placeholder: string;
  /** Options chosen when the field first appears. */
  defaultValues?: readonly string[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  maximumSelections?: number;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onValueChange?: (values: string[]) => void;
};

/**
 * A dropdown for choosing several options. Choices show as chips in the
 * field and submit with the surrounding form as one value per choice under
 * `name`, the same shape as a group of checkboxes.
 */
export function MultiSelect({
  identifier,
  name,
  options,
  placeholder,
  defaultValues = [],
  searchPlaceholder = "Search",
  emptyMessage = "No matching options.",
  maximumSelections,
  disabled = false,
  invalid = false,
  describedBy,
  onValueChange,
}: MultiSelectProperties) {
  const [isOpen, setIsOpen] = useState(false);
  const commandReference = useRef<HTMLDivElement>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>(() =>
    options
      .map((option) => option.value)
      .filter((value) => defaultValues.includes(value))
  );
  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value)
  );
  const isAtMaximum =
    maximumSelections !== undefined &&
    selectedValues.length >= maximumSelections;

  function toggleValue(value: string) {
    const updatedValues = selectedValues.includes(value)
      ? selectedValues.filter((selectedValue) => selectedValue !== value)
      : [...selectedValues, value];
    setSelectedValues(updatedValues);
    onValueChange?.(updatedValues);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {selectedValues.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <PopoverTrigger
        id={identifier}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 py-2 text-left text-sm transition-colors hover:border-border focus:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
      >
        {selectedOptions.length > 0 ? (
          <span className="flex flex-wrap gap-1.5">
            {selectedOptions.map((option) => (
              <Badge key={option.value} variant="secondary">
                {option.selectedLabel ?? option.label}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-xs font-light text-muted-foreground/50">
            {placeholder}
          </span>
        )}
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 opacity-50"
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
        onOpenAutoFocus={(focusEvent) => {
          // The list handles arrow keys and Enter, so it takes focus on open
          // instead of the popover container.
          focusEvent.preventDefault();
          commandReference.current?.focus();
        }}
      >
        <Command ref={commandReference} className="outline-none">
          {options.length > SEARCHABLE_OPTION_COUNT && (
            <CommandInput placeholder={searchPlaceholder} />
          )}
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={!isSelected && isAtMaximum}
                    onSelect={() => toggleValue(option.value)}
                    className="py-2.5"
                  >
                    <span className="flex-1">{option.label}</span>
                    <CheckIcon
                      aria-hidden="true"
                      className={cn(
                        "text-primary",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {isSelected && <span className="sr-only">, selected</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
