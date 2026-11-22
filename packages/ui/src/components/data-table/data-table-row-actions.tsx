"use client";

import {
  ActionMenu,
  type ActionMenuItem,
} from "@healthalyst/ui/components/action-menu";

/** A row's actions, kept from also triggering a click on the row. */
export function DataTableRowActions({
  items,
  accessibleLabel,
}: {
  items: readonly ActionMenuItem[];
  accessibleLabel: string;
}) {
  if (items.length === 0) return null;
  return (
    <span
      className="inline-flex"
      onClick={(clickEvent) => clickEvent.stopPropagation()}
    >
      <ActionMenu accessibleLabel={accessibleLabel} items={items} />
    </span>
  );
}
