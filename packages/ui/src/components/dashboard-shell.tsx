"use client";

import {
  useEffect,
  type AnchorHTMLAttributes,
  type ComponentType,
  type ElementType,
  type ReactNode,
} from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@healthalyst/ui/primitives/sidebar";
import { cn } from "@healthalyst/ui/lib/utilities";

type DashboardNavigationItem = {
  label: string;
  href: string;
  /** A decorative icon component, rendered hidden from assistive technology. */
  icon: ComponentType<{ "aria-hidden"?: boolean | "true" }>;
  /**
   * The page belongs to another HealthAlyst app, so it opens with a full page
   * load instead of the app's client-side link, and is never the current page.
   */
  opensAnotherApp?: boolean;
};

/** A labelled group of links, such as an app's own pages or its organisation. */
type DashboardNavigationSection = {
  label: string;
  items: readonly DashboardNavigationItem[];
};

type DashboardNavigationLinkProperties =
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type DashboardShellProperties = {
  brand: ReactNode;
  /** Names the navigation landmark for assistive technology. */
  navigationLabel: string;
  navigationSections: readonly DashboardNavigationSection[];
  /**
   * The current path. The item whose address matches it most closely is
   * marked as the current page, so `/team/roles` marks "Roles", not "Team".
   */
  navigationLocation: string;
  /** The application's link component, such as the framework's client-side link. */
  linkComponent?: ElementType<DashboardNavigationLinkProperties>;
  footer?: ReactNode;
  toolbar: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** The in-app item whose address is the longest prefix of the location. */
function findCurrentHref(
  sections: readonly DashboardNavigationSection[],
  location: string
): string | undefined {
  return sections
    .flatMap((section) => section.items)
    .filter(
      (navigationItem) =>
        !navigationItem.opensAnotherApp &&
        (location === navigationItem.href ||
          location.startsWith(`${navigationItem.href.replace(/\/$/, "")}/`))
    )
    .sort((first, second) => second.href.length - first.href.length)[0]?.href;
}

function DashboardNavigation({
  navigationSections,
  navigationLocation,
  linkComponent: NavigationLink = "a",
}: Pick<
  DashboardShellProperties,
  "navigationSections" | "navigationLocation" | "linkComponent"
>) {
  const currentHref = findCurrentHref(navigationSections, navigationLocation);

  return navigationSections
    .filter((section) => section.items.length > 0)
    .map((section) => (
      <SidebarGroup
        key={section.label}
        className="p-0 group-data-[collapsible=icon]:items-center"
      >
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
          {section.label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            {section.items.map((navigationItem) => {
              const NavigationIcon = navigationItem.icon;
              const isCurrentPage = navigationItem.href === currentHref;
              // Another app's page needs a full page load, not a client route.
              const ItemLink = navigationItem.opensAnotherApp
                ? "a"
                : NavigationLink;

              return (
                <SidebarMenuItem key={navigationItem.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isCurrentPage}
                    tooltip={navigationItem.label}
                    className="min-h-10 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
                  >
                    <ItemLink
                      href={navigationItem.href}
                      aria-current={isCurrentPage ? "page" : undefined}
                    >
                      <NavigationIcon aria-hidden="true" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {navigationItem.label}
                      </span>
                    </ItemLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    ));
}

function DashboardShellContent({
  brand,
  navigationLabel,
  navigationSections,
  navigationLocation,
  linkComponent,
  footer,
  toolbar,
  actions,
  children,
  contentClassName,
}: Omit<DashboardShellProperties, "className">) {
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [navigationLocation, setOpenMobile]);

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="px-4 pt-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
          {brand}
        </SidebarHeader>
        <SidebarContent className="px-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
          <nav
            aria-label={navigationLabel}
            className="flex flex-col gap-4 group-data-[collapsible=icon]:items-center"
          >
            <DashboardNavigation
              navigationSections={navigationSections}
              navigationLocation={navigationLocation}
              linkComponent={linkComponent}
            />
          </nav>
        </SidebarContent>
        {footer && (
          <SidebarFooter className="border-t border-sidebar-border px-4 py-5 group-data-[collapsible=icon]:hidden">
            {footer}
          </SidebarFooter>
        )}
        <SidebarRail />
      </Sidebar>
      <SidebarInset
        className={cn(
          "min-h-0 min-w-0 overflow-hidden border border-border bg-card md:peer-data-[variant=inset]:shadow-none",
          contentClassName
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 rounded-t-xl border-b border-border bg-card px-3 sm:px-5">
          <SidebarTrigger />
          <div className="min-w-0 flex-1">{toolbar}</div>
          {actions}
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-7 p-4 sm:p-6 lg:px-10 lg:py-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

export function DashboardShell({
  className,
  contentClassName,
  ...properties
}: DashboardShellProperties) {
  return (
    <SidebarProvider
      className={cn(
        "h-svh overflow-hidden bg-sidebar text-foreground",
        className
      )}
    >
      <DashboardShellContent
        {...properties}
        contentClassName={contentClassName}
      />
    </SidebarProvider>
  );
}

export type { DashboardNavigationItem, DashboardNavigationSection };
