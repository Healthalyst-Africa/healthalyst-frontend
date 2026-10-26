"use client";

import { SearchField } from "@healthalyst/ui/components/search-field";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { Label } from "@healthalyst/ui/primitives/label";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { FilterBarProperties } from "@healthalyst/ui/types/filter-bar";

/** The listbox cannot hold an empty value, so "all options" uses this one. */
const ALL_OPTIONS_VALUE = "__all__";

/**
 * Controls that narrow a list or table: an optional text search and
 * single-choice filters. Labels are visually hidden but name each control for
 * assistive technology, so placeholders must make each control's purpose clear. Applications own the filter values and apply them to
 * their own data.
 */
export function FilterBar({
  accessibleLabel,
  identifier,
  search,
  filters,
  disabled = false,
  className,
}: FilterBarProperties) {
  const searchIdentifier = `${identifier}-search`;

  return (
    <div
      role="group"
      aria-label={accessibleLabel}
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end",
        className
      )}
    >
      {search && (
        <div className="flex min-w-0 flex-col sm:min-w-64 sm:flex-1">
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
      {filters.map((filter) => (
        <SelectField
          key={filter.key}
          id={`${identifier}-${filter.key}`}
          className="sm:w-52"
          label={filter.label}
          hideLabel
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
      ))}
    </div>
  );
}
