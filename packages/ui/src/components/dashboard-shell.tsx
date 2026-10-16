"use client";

import { useEffect, type ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@healthalyst/ui/components/sidebar";
import { cn } from "@healthalyst/ui/lib/utilities";

type DashboardShellProperties = {
  brand: ReactNode;
  navigation: ReactNode;
  navigationLocation: string;
  footer?: ReactNode;
  toolbar: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

function DashboardShellContent({
  brand,
  navigation,
  navigationLocation,
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
            {navigation}
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
          "min-h-0 min-w-0 overflow-hidden border border-border bg-background",
          contentClassName
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 rounded-t-xl border-b border-border bg-background px-3 sm:px-5">
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
