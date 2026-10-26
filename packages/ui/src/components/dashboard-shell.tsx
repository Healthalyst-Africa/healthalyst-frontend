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
};

type DashboardNavigationLinkProperties =
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type DashboardShellProperties = {
  brand: ReactNode;
  navigationLabel: string;
  navigationItems: readonly DashboardNavigationItem[];
  /** The current location; the matching item is marked as the current page. */
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

function DashboardNavigation({
  navigationLabel,
  navigationItems,
  navigationLocation,
  linkComponent: NavigationLink = "a",
}: Pick<
  DashboardShellProperties,
  "navigationLabel" | "navigationItems" | "navigationLocation" | "linkComponent"
>) {
  return (
    <>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
        {navigationLabel}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          {navigationItems.map((navigationItem) => {
            const NavigationIcon = navigationItem.icon;
            const isCurrentPage = navigationLocation === navigationItem.href;

            return (
              <SidebarMenuItem key={navigationItem.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isCurrentPage}
                  tooltip={navigationItem.label}
                  className="min-h-10 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
                >
                  <NavigationLink
                    href={navigationItem.href}
                    aria-current={isCurrentPage ? "page" : undefined}
                  >
                    <NavigationIcon aria-hidden="true" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {navigationItem.label}
                    </span>
                  </NavigationLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </>
  );
}

function DashboardShellContent({
  brand,
  navigationLabel,
  navigationItems,
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
          <SidebarGroup className="p-0 group-data-[collapsible=icon]:items-center">
            <DashboardNavigation
              navigationLabel={navigationLabel}
              navigationItems={navigationItems}
              navigationLocation={navigationLocation}
              linkComponent={linkComponent}
            />
          </SidebarGroup>
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

export type { DashboardNavigationItem };
