"use client";

import { describeOrganizationStatus } from "~/features/organization-application/utilities/describe-organization-status";
import { useEffect, useRef } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Badge } from "@healthalyst/ui/components/badge";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import OrganizationApplicationWorkspace from "~/features/organization-application/components/organization-application-workspace";
import { useSignOutMutation } from "~/features/authentication/hooks/use-sign-in";

/**
 * Who is signed in and the organisations they belong to, from the session
 * returned by sign-in or authenticator set-up. Signing out calls
 * `POST /v1/auth/logout`; the API clears its refresh cookie and the transport clears its access token.
 */
export default function OrganizationApplicationSummary({
  session,
  onSignedOut,
}: {
  session: PlatformSession;
  onSignedOut: () => void;
}) {
  const headingReference = useRef<HTMLHeadingElement>(null);
  const signOutMutation = useSignOutMutation();

  useEffect(() => {
    headingReference.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2
          ref={headingReference}
          className="font-serif text-3xl font-normal leading-tight outline-none"
          tabIndex={-1}
        >
          Welcome, {session.user.firstName}
        </h2>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Track your organisation application and complete the remaining steps.
        </p>
      </div>
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-5 px-6 py-7 md:px-8 md:py-8">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              {session.user.firstName} {session.user.lastName}
            </p>
            {session.user.email && (
              <p className="break-all text-sm text-muted-foreground">
                {session.user.email}
              </p>
            )}
          </div>
          {session.memberships.length === 1 && session.memberships[0] ? (
            <OrganizationApplicationWorkspace
              organizationId={session.memberships[0].organization.id}
              userId={session.user.id}
            />
          ) : session.memberships.length > 1 ? (
            <section aria-labelledby="signed-in-organizations-heading">
              <h3
                id="signed-in-organizations-heading"
                className="text-sm font-semibold"
              >
                Your organisations
              </h3>
              <ul className="mt-3 flex flex-col divide-y divide-border rounded-lg border border-border">
                {session.memberships.map((membership) => (
                  <li
                    key={membership.membershipId}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="text-sm font-medium">
                      {membership.organization.name}
                    </span>
                    <Badge className="shrink-0" variant="secondary">
                      {describeOrganizationStatus(
                        membership.organization.status
                      )}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Contact HealthAlyst to open an application for a specific
                organisation.
              </p>
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              This account is not linked to an organisation application yet.
            </p>
          )}
          <ActionButton
            className="w-full"
            size="large"
            type="button"
            variant="outline"
            isLoading={signOutMutation.isPending}
            loadingText="Signing out"
            onClick={() =>
              signOutMutation.mutate(undefined, {
                onSettled: onSignedOut,
              })
            }
          >
            Sign out
          </ActionButton>
        </CardContent>
      </Card>
    </div>
  );
}
