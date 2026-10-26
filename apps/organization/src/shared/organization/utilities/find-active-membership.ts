import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";

type Membership = PlatformSession["memberships"][number];

/** The membership for the organisation the person is signed into. */
export function findActiveMembership(
  platformSession: PlatformSession
): Membership | undefined {
  return (
    platformSession.memberships.find(
      (candidateMembership) =>
        candidateMembership.organization.id ===
        platformSession.activeContext.organizationId
    ) ?? platformSession.memberships[0]
  );
}
