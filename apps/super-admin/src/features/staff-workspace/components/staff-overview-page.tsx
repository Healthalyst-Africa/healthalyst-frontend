"use client";

import { MetricSummary } from "@healthalyst/ui/components/metric-summary";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { useStaffSession } from "~/infrastructure/auth/staff-session-provider";
import { useStaffOverview } from "~/features/staff-workspace/hooks/use-staff-overview";
import { WORKSPACE_OVERVIEW_CONFIGURATION } from "~/features/staff-workspace/config/workspace-overview";
import { OrganizationApplicationsTable } from "~/features/organization-oversight/components/organization-applications-table";

import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

export function StaffOverviewPage() {
  const { staffIdentity } = useStaffSession();
  if (!staffIdentity) return null;
  return <DashboardOverview staffIdentity={staffIdentity} />;
}

function DashboardOverview({
  staffIdentity,
}: {
  staffIdentity: StaffIdentity;
}) {
  const { organizationsQuery, applications, metrics } =
    useStaffOverview(staffIdentity);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-4 text-xs text-muted-foreground">
            Workspace / Overview
          </p>
          <h1 className="font-serif text-3xl font-normal tracking-tight">
            Company overview
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Organisation registration and review activity.
          </p>
        </div>
      </div>
      {!organizationsQuery.isError && (
        <MetricSummary
          isLoading={organizationsQuery.isPending}
          items={metrics.map((metric) => {
            const MetricIcon = metric.icon;
            return {
              label: metric.label,
              value: metric.value,
              icon: <MetricIcon />,
            };
          })}
        />
      )}
      <section
        aria-labelledby="overview-organizations-heading"
        className="flex flex-col gap-4"
      >
        <SectionHeading
          heading="Organisations"
          description="Latest registrations and their current status."
          headingIdentifier="overview-organizations-heading"
        />
        <OrganizationApplicationsTable
          applications={applications}
          isLoading={organizationsQuery.isPending}
          errorMessage={organizationsQuery.error?.message}
          onRetry={() => void organizationsQuery.refetch()}
          recentApplicationLimit={
            WORKSPACE_OVERVIEW_CONFIGURATION.recentApplicationLimit
          }
        />
      </section>
    </>
  );
}
