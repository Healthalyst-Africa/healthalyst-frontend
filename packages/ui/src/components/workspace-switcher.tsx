"use client";

import type {
  AnchorHTMLAttributes,
  ComponentType,
  ElementType,
  ReactNode,
} from "react";
import { CheckIcon, ChevronDownIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@healthalyst/ui/primitives/dropdown-menu";

type WorkspaceSwitcherItemBase = {
  label: string;
  /** A decorative icon component, rendered hidden from assistive technology. */
  icon: ComponentType<{ "aria-hidden"?: boolean | "true"; className?: string }>;
  /** Marks the app, page or organisation the person is in now. */
  isCurrent?: boolean;
};

/**
 * An item either opens a page (`href`) or runs an action, such as switching
 * organisation (`onSelect`).
 */
type WorkspaceSwitcherItem = WorkspaceSwitcherItemBase &
  (
    | {
        href: string;
        /** The page belongs to another app, so it opens with a full page load. */
        opensAnotherApp?: boolean;
        onSelect?: never;
      }
    | { onSelect: () => void; href?: never; opensAnotherApp?: never }
  );

type WorkspaceSwitcherSection = {
  label: string;
  items: readonly WorkspaceSwitcherItem[];
};

type WorkspaceSwitcherLinkProperties =
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type WorkspaceSwitcherProperties = {
  /** A decorative mark, such as the HealthAlyst logo. */
  logo: ReactNode;
  /** The app the person is in, such as "HealthSchedule". */
  title: string;
  /** Usually the organisation's name. */
  subtitle: string;
  sections: readonly WorkspaceSwitcherSection[];
  /** The app's client-side link, used for its own pages. */
  linkComponent?: ElementType<WorkspaceSwitcherLinkProperties>;
};

/**
 * The sidebar header: the current app and organisation, opening a menu to
 * move to another product, open the organisation's pages or switch to another
 * organisation. It keeps those secondary destinations out of the app's own
 * navigation.
 */
export function WorkspaceSwitcher({
  logo,
  title,
  subtitle,
  sections,
  linkComponent: AppLink = "a",
}: WorkspaceSwitcherProperties) {
  const visibleSections = sections.filter(
    (section) => section.items.length > 0
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ActionButton
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start gap-3 rounded-md px-2 py-1.5 text-left font-normal group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          aria-label={`${title}, ${subtitle}. Switch product or open organisation pages`}
        >
          <span className="shrink-0" aria-hidden="true">
            {logo}
          </span>
          <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-semibold">
              {title}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {subtitle}
            </span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden"
          />
        </ActionButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {visibleSections.map((section, sectionIndex) => (
          <DropdownMenuGroup key={section.label}>
            {sectionIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              {section.label}
            </DropdownMenuLabel>
            {section.items.map((item) => {
              const ItemIcon = item.icon;
              const content = (
                <>
                  <ItemIcon aria-hidden="true" className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.isCurrent && (
                    <CheckIcon
                      aria-hidden="true"
                      className="size-4 text-primary"
                    />
                  )}
                </>
              );

              if (item.onSelect) {
                return (
                  <DropdownMenuItem
                    key={`${section.label}-${item.label}`}
                    // Choosing where you already are does nothing.
                    onSelect={item.isCurrent ? undefined : item.onSelect}
                    aria-current={item.isCurrent ? "true" : undefined}
                    className="flex min-h-10 cursor-pointer items-center gap-2"
                  >
                    {content}
                  </DropdownMenuItem>
                );
              }

              const ItemLink = item.opensAnotherApp ? "a" : AppLink;
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <ItemLink
                    href={item.href}
                    aria-current={item.isCurrent ? "page" : undefined}
                    className="flex min-h-10 cursor-pointer items-center gap-2"
                  >
                    {content}
                  </ItemLink>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { WorkspaceSwitcherItem, WorkspaceSwitcherSection };
