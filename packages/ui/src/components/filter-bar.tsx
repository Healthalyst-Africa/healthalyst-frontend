"use client";

import { useState } from "react";
import { FilterIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { SearchField } from "@healthalyst/ui/components/search-field";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { Label } from "@healthalyst/ui/primitives/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@healthalyst/ui/primitives/sheet";
import { cn } from "@healthalyst/ui/lib/utilities";
import type {
  FilterBarProperties,
  FilterBarSelectFilter,
} from "@healthalyst/ui/types/filter-bar";

/** The listbox cannot hold an empty value, so "all options" uses this one. */
const ALL_OPTIONS_VALUE = "__all__";

function FilterSelect({
  filter,
  identifier,
  disabled,
  hideLabel,
  className,
}: {
  filter: FilterBarSelectFilter;
  identifier: string;
  disabled: boolean;
  hideLabel: boolean;
  className?: string;
}) {
  return (
    <SelectField
      id={identifier}
      className={className}
      label={filter.label}
      hideLabel={hideLabel}
      controlSize="compact"
      placeholder={filter.allOptionsLabel}
      options={[
        { value: ALL_OPTIONS_VALUE, label: filter.allOptionsLabel },
        ...filter.options,
      ]}
      value={filter.value || ALL_OPTIONS_VALUE}
      disabled={disabled}
      onValueChange={(value) =>
        filter.onValueChange(value === ALL_OPTIONS_VALUE ? "" : value)
      }
    />
  );
}

/**
 * Controls that narrow a list or table: an optional text search and
 * single-choice filters. On phones the filters sit behind a "Filters" button
 * that opens a panel from the bottom; wider screens show them inline with
 * visually hidden labels, so placeholders must make each control's purpose
 * clear. Applications own the filter values and apply them to their own data.
 */
export function FilterBar({
  accessibleLabel,
  identifier,
  search,
  filters,
  disabled = false,
  className,
}: FilterBarProperties) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const searchIdentifier = `${identifier}-search`;
  const appliedCount = filters.filter((filter) => filter.value).length;

  function clearFilters() {
    for (const filter of filters) filter.onValueChange("");
  }

  return (
    <div
      role="group"
      aria-label={accessibleLabel}
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2 sm:contents">
        {search && (
          <div className="flex min-w-0 flex-1 flex-col sm:min-w-64">
            <Label className="sr-only" htmlFor={searchIdentifier}>
              {search.label}
            </Label>
            <SearchField
              id={searchIdentifier}
              placeholder={search.placeholder}
              value={search.value}
              disabled={disabled}
              autoComplete="off"
              onChange={(changeEvent) =>
                search.onValueChange(changeEvent.currentTarget.value)
              }
            />
          </div>
        )}
        {filters.length > 0 && (
          <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
            <SheetTrigger asChild>
              <ActionButton
                type="button"
                variant="outline"
                className="h-10 shrink-0 sm:hidden"
                disabled={disabled}
                leadingIcon={<FilterIcon className="size-4" />}
                aria-label={
                  appliedCount > 0
                    ? `Filters, ${appliedCount} applied`
                    : "Filters"
                }
              >
                Filters
                {appliedCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="flex size-5 items-center justify-center rounded-full bg-primary text-caption text-primary-foreground"
                  >
                    {appliedCount}
                  </span>
                )}
              </ActionButton>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="flex max-h-[85dvh] flex-col gap-0 rounded-t-2xl p-0"
            >
              <SheetHeader className="gap-1 border-b px-5 pb-4 pt-5 text-left">
                <SheetTitle className="pr-10 font-serif text-xl font-normal leading-tight">
                  Filters
                </SheetTitle>
                <SheetDescription>{accessibleLabel}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
                {filters.map((filter) => (
                  <FilterSelect
                    key={filter.key}
                    filter={filter}
                    identifier={`${identifier}-${filter.key}-panel`}
                    disabled={disabled}
                    hideLabel={false}
                  />
                ))}
              </div>
              <SheetFooter className="flex-row gap-3 border-t px-5 py-4 sm:justify-between">
                <ActionButton
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={appliedCount === 0}
                  onClick={clearFilters}
                >
                  Clear filters
                </ActionButton>
                <ActionButton
                  type="button"
                  className="flex-1"
                  onClick={() => setIsPanelOpen(false)}
                >
                  Show results
                </ActionButton>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        )}
      </div>
      {filters.map((filter) => (
        <FilterSelect
          key={filter.key}
          filter={filter}
          identifier={`${identifier}-${filter.key}`}
          disabled={disabled}
          hideLabel
          className="max-sm:hidden sm:w-52"
        />
      ))}
    </div>
  );
}
