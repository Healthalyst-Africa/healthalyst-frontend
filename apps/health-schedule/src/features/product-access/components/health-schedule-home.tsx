"use client";

import Image from "next/image";
import Link from "next/link";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { DashboardIcon, SignOutIcon } from "@healthalyst/icons";
import { AccountMenu } from "@healthalyst/ui/components/account-menu";
import { DashboardShell } from "@healthalyst/ui/components/dashboard-shell";
import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { useHealthScheduleSignOut } from "~/features/product-access/hooks/use-health-schedule-sign-out";

const HOME_NAVIGATION = [
  { label: "Overview", href: "/", icon: DashboardIcon },
] as const;

/** The signed-in HealthSchedule workspace for an approved organisation. */
export function HealthScheduleHome({
  platformSession,
  organizationName,
}: {
  platformSession: PlatformSession;
  organizationName: string;
}) {
  const signOutMutation = useHealthScheduleSignOut();
  const { user } = platformSession;

  return (
    <DashboardShell
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
            <p className="truncate text-sm font-semibold">HealthSchedule</p>
            <p className="truncate text-xs text-muted-foreground">
              {organizationName}
            </p>
          </div>
        </div>
      }
      navigationLabel="HealthSchedule"
      navigationItems={HOME_NAVIGATION}
      navigationLocation="/"
      linkComponent={Link}
      toolbar={
        <p className="truncate text-sm font-medium">{organizationName}</p>
      }
      actions={
        <AccountMenu
          fullName={`${user.firstName} ${user.lastName}`}
          emailAddress={user.email ?? ""}
          error={signOutMutation.error?.message}
          actions={[
            {
              label: "Sign out",
              pendingLabel: "Signing out…",
              isPending: signOutMutation.isPending,
              icon: <SignOutIcon aria-hidden="true" />,
              tone: "destructive",
              onSelect: () => signOutMutation.mutate(),
            },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight">
            Welcome, {user.firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {organizationName} is set up for HealthSchedule.
          </p>
        </div>
        <EmptyState
          surface="panel"
          illustration={<DocumentsCompleteIllustration />}
          title="Your workspace is ready"
          description="Scheduling tools will appear here as they become available to your organisation."
        />
      </div>
    </DashboardShell>
  );
}
