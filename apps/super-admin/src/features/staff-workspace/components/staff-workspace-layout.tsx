"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutIcon } from "@healthalyst/icons";
import { AccountMenu } from "@healthalyst/ui/components/account-menu";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DashboardShell } from "@healthalyst/ui/components/dashboard-shell";
import { NotificationPanel } from "@healthalyst/ui/components/notification-panel";
import { SearchField } from "@healthalyst/ui/components/search-field";
import { useStaffWorkspace } from "~/features/staff-workspace/hooks/use-staff-workspace";
import { WORKSPACE_NAVIGATION } from "~/features/staff-workspace/config/workspace-navigation";

export function StaffWorkspaceLayout({ children }: { children: ReactNode }) {
  const {
    pathname,
    staffIdentity,
    status,
    sessionError,
    restoreSession,
    signOutError,
    isSigningOut,
    organizationSearch,
    setOrganizationSearch,
    handleSignOut,
    handleOrganizationSearch,
  } = useStaffWorkspace();

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

  return (
    <DashboardShell
      className="super-admin-dashboard"
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
      navigationLabel="Workspace"
      navigationItems={WORKSPACE_NAVIGATION}
      navigationLocation={pathname}
      linkComponent={Link}
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
          <NotificationPanel>
            Staff notifications are not available yet.
          </NotificationPanel>
          <AccountMenu
            fullName={staffIdentity.fullName}
            emailAddress={staffIdentity.emailAddress}
            error={signOutError || undefined}
            actions={[
              {
                label: "Sign out",
                pendingLabel: "Signing out…",
                isPending: isSigningOut,
                icon: <SignOutIcon aria-hidden="true" />,
                tone: "destructive",
                onSelect: () => void handleSignOut(),
              },
            ]}
          />
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
