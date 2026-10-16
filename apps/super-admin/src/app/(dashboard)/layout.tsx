"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  DashboardIcon,
  OrganizationIcon,
  NotificationIcon,
  ReviewIcon,
  SignOutIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Avatar, AvatarFallback } from "@healthalyst/ui/components/avatar";
import { DashboardShell } from "@healthalyst/ui/components/dashboard-shell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@healthalyst/ui/components/dropdown-menu";
import { SearchField } from "@healthalyst/ui/components/search-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@healthalyst/ui/components/popover";
import {
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@healthalyst/ui/components/sidebar";
import { endStaffSession } from "~/features/staff-auth/api/staff-service";
import { useStaffSession } from "~/features/staff-auth/context/staff-session-provider";

const navigationItems = [
  { label: "Overview", href: "/dashboard", icon: DashboardIcon },
  { label: "Organisations", href: "/organizations", icon: OrganizationIcon },
  { label: "Application reviews", href: "/review", icon: ReviewIcon },
] as const;

export default function StaffDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { staffIdentity, status, sessionError, clearSession, restoreSession } =
    useStaffSession();
  const [signOutError, setSignOutError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [organizationSearch, setOrganizationSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/sign-in");
  }, [router, status]);

  if (status === "loading") {
    return (
      <main
        className="flex min-h-screen items-center justify-center text-sm text-muted-foreground"
        role="status"
      >
        Checking your staff session…
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-destructive" role="alert">
          {sessionError}
        </p>
        <ActionButton
          type="button"
          variant="outline"
          onClick={() => void restoreSession()}
        >
          Retry session check
        </ActionButton>
      </main>
    );
  }

  if (status !== "authenticated" || !staffIdentity) {
    return (
      <main
        className="flex min-h-screen items-center justify-center text-sm text-muted-foreground"
        role="status"
      >
        Opening staff sign in…
      </main>
    );
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError("");
    try {
      await endStaffSession();
      clearSession();
      router.replace("/sign-in");
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : "Sign out failed. Try again."
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleOrganizationSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchTerm = organizationSearch.trim();
    router.push(
      searchTerm
        ? `/organizations?search=${encodeURIComponent(searchTerm)}`
        : "/organizations"
    );
  }

  const navigation = (
    <>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
        Workspace
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          {navigationItems.map((item) => {
            const NavigationIcon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className="min-h-10 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
                >
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    <NavigationIcon aria-hidden="true" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </>
  );
  return (
    <DashboardShell
      className="super-admin-dashboard"
      contentClassName="md:shadow-none"
      brand={
        <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Image
            src="/logo.jpg"
            alt="HealthAlyst"
            width={32}
            height={32}
            className="shrink-0 rounded-md"
          />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">HealthAlyst</p>
            <p className="truncate text-xs text-muted-foreground">
              Super Admin
            </p>
          </div>
        </div>
      }
      navigation={navigation}
      navigationLocation={pathname}
      toolbar={
        <form
          role="search"
          onSubmit={handleOrganizationSearch}
          className="w-full max-w-xl"
        >
          <SearchField
            id="dashboard-organization-search"
            aria-label="Search organisations"
            value={organizationSearch}
            onChange={(event) => setOrganizationSearch(event.target.value)}
            placeholder="Search organisations by name"
          />
        </form>
      }
      actions={
        <div className="flex shrink-0 items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <ActionButton
                type="button"
                size="icon"
                variant="ghost"
                className="size-9 border border-border/40 bg-background/40 shadow-none hover:bg-muted/60"
                aria-label="Notifications"
              >
                <NotificationIcon aria-hidden="true" className="size-4" />
              </ActionButton>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Staff notifications are not available yet.
              </p>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ActionButton
                type="button"
                size="icon"
                variant="ghost"
                className="size-9 rounded-full p-0"
                aria-label={`Account menu for ${staffIdentity.fullName}`}
              >
                <Avatar className="size-9 border border-border">
                  <AvatarFallback className="text-xs font-semibold">
                    {staffIdentity.fullName.trim().slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </ActionButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <span className="block truncate font-semibold">
                  {staffIdentity.fullName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {staffIdentity.emailAddress}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {signOutError && (
                <p className="px-2 py-1 text-xs text-destructive" role="alert">
                  {signOutError}
                </p>
              )}
              <DropdownMenuItem
                disabled={isSigningOut}
                onSelect={() => void handleSignOut()}
                className="text-destructive focus:text-destructive"
              >
                <SignOutIcon aria-hidden="true" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
