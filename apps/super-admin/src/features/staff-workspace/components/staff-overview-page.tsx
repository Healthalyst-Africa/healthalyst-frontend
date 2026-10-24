"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@healthalyst/ui/components/card";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { useStaffSession } from "~/infrastructure/auth/staff-session-provider";
import { useStaffOverview } from "~/features/staff-workspace/hooks/use-staff-overview";
import { WORKSPACE_OVERVIEW_CONFIGURATION } from "~/features/staff-workspace/config/workspace-overview";
import { APPLICATION_ROUTES } from "~/config/application-routes";

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
  const {
    organizationsQuery,
    reviewQueue,
    applications,
    metrics,
    actionableReviewCount,
  } = useStaffOverview(staffIdentity);
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
      {organizationsQuery.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading organisation activity…
        </p>
      )}
      {organizationsQuery.isError && (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <p role="alert" className="text-sm text-destructive">
              {organizationsQuery.error.message}
            </p>
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void organizationsQuery.refetch()}
            >
              Retry
            </ActionButton>
          </CardContent>
        </Card>
      )}
      {organizationsQuery.isSuccess && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const MetricIcon = metric.icon;
              return (
                <Card key={metric.label} className="shadow-none">
                  <CardHeader className="flex-row items-center gap-3 pb-2">
                    <span className="flex size-8 items-center justify-center rounded-md bg-muted">
                      <MetricIcon className="size-4" aria-hidden="true" />
                    </span>
                    <CardDescription>{metric.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tabular-nums">
                      {metric.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="bg-muted/60 shadow-none">
            <CardHeader>
              <p className="text-xs font-semibold">Next step</p>
              <CardTitle className="pt-2 text-lg">
                {reviewQueue.isPending
                  ? "Checking the review queue"
                  : reviewQueue.isError
                    ? "Review queue unavailable"
                    : actionableReviewCount > 0
                      ? `Review ${actionableReviewCount} ${actionableReviewCount === 1 ? "application" : "applications"}`
                      : "Review queue is clear"}
              </CardTitle>
              <CardDescription className="pt-1">
                {reviewQueue.isPending
                  ? "Loading applications ready for a decision…"
                  : reviewQueue.isError
                    ? "We could not check which applications are ready for review."
                    : actionableReviewCount > 0
                      ? "Open the review queue to assess the applications ready for a decision."
                      : "There are no verified applications awaiting a decision."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewQueue.isError && (
                <ActionButton
                  type="button"
                  variant="outline"
                  onClick={() => void reviewQueue.refetch()}
                >
                  Retry review queue
                </ActionButton>
              )}
              {reviewQueue.isSuccess && actionableReviewCount > 0 && (
                <Link
                  href={APPLICATION_ROUTES.review}
                  className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Open review queue
                </Link>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Recent applications</CardTitle>
              <CardDescription>
                The latest organisation registration activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No organisations have registered yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {applications
                    .slice(
                      0,
                      WORKSPACE_OVERVIEW_CONFIGURATION.recentApplicationLimit
                    )
                    .map((application) => (
                      <li
                        key={application.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                      >
                        <span className="font-medium">
                          {application.displayName || application.legalName}
                        </span>
                        <span className="text-muted-foreground">
                          {application.status
                            .replaceAll("_", " ")
                            .toLowerCase()}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
