"use client";

import {
  ORGANIZATION_STATUS_LABELS,
  ORGANIZATION_STATUS_DESCRIPTIONS,
} from "~/features/organization-application/config/application-presentation";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Badge } from "@healthalyst/ui/components/badge";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";
import { useOrganizationApplicationQuery } from "~/features/organization-application/hooks/use-organization-application";
import { ApplicationReadiness } from "~/features/organization-application/components/application-readiness";

function ApplicationContent({
  application,
}: {
  application: OrganizationApplication;
}) {
  const statusLabel =
    ORGANIZATION_STATUS_LABELS[application.status] ?? application.status;
  const statusDescription =
    ORGANIZATION_STATUS_DESCRIPTIONS[application.status] ??
    "Check the application details below for the latest information.";

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="flex flex-col gap-6 px-5 py-6 sm:px-6 md:px-8 md:py-8">
        <section aria-labelledby="application-status-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3
              id="application-status-heading"
              className="text-base font-semibold"
            >
              Application status
            </h3>
            <Badge variant="secondary">{statusLabel}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {statusDescription}
          </p>
          <p className="mt-2 text-sm font-medium">
            {application.profile.legalName}
          </p>
          {application.submittedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted on{" "}
              <time dateTime={application.submittedAt}>
                {new Date(application.submittedAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </time>
            </p>
          )}
        </section>
        <ApplicationReadiness application={application} />
      </CardContent>
    </Card>
  );
}

function ApplicationLoadError({
  error,
  isRetrying,
  onRetry,
}: {
  error: Error;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const platformError = error instanceof PlatformApiError ? error : null;
  const message =
    platformError?.code === "APPLICATION_NOT_FOUND"
      ? "We could not find an organisation application for this account. Contact HealthAlyst for help."
      : platformError?.status === 401
        ? "Your sign-in has expired. Sign out and sign in again to reload your application."
        : error.message;

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="flex flex-col gap-4 px-5 py-6 sm:px-6 md:px-8 md:py-8">
        <div role="alert" className="flex flex-col gap-2">
          <h3 className="font-semibold">We could not load your application</h3>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
          {platformError?.requestId && (
            <p className="text-xs text-muted-foreground">
              Reference for HealthAlyst support: {platformError.requestId}
            </p>
          )}
        </div>
        {platformError?.status !== 401 && (
          <ActionButton
            type="button"
            variant="outline"
            isLoading={isRetrying}
            loadingText="Trying again"
            onClick={onRetry}
          >
            Try again
          </ActionButton>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrganizationApplicationWorkspace({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const applicationQuery = useOrganizationApplicationQuery({
    organizationId,
    userId,
  });

  if (applicationQuery.isPending) {
    return (
      <Card className="border-border bg-card shadow-sm" aria-busy="true">
        <CardContent className="px-5 py-6 sm:px-6 md:px-8 md:py-8">
          <p className="text-sm text-muted-foreground" role="status">
            Loading your organisation application…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (applicationQuery.error) {
    return (
      <ApplicationLoadError
        error={applicationQuery.error}
        isRetrying={applicationQuery.isRefetching}
        onRetry={() => void applicationQuery.refetch()}
      />
    );
  }

  return <ApplicationContent application={applicationQuery.data} />;
}
