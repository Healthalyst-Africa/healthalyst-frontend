import { describe, expect, it } from "vitest";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { resolveProductAccess } from "~/features/product-access/utilities/resolve-product-access";

const ORGANIZATION_IDENTIFIER = "8a7f1c1e-5b8e-4c6f-9c3a-2f1d0e9b7a61";
const OTHER_ORGANIZATION_IDENTIFIER = "1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d";

function createSession({
  status,
  products = [],
  activeOrganizationIdentifier = ORGANIZATION_IDENTIFIER,
}: {
  status: string;
  products?: string[];
  activeOrganizationIdentifier?: string | null;
}): PlatformSession {
  return {
    activeContext: {
      realm: "TENANT",
      organizationId: activeOrganizationIdentifier,
    },
    user: {
      id: "4f3e2d1c-0b9a-4876-9543-210fedcba987",
      firstName: "Ada",
      lastName: "Okafor",
      email: "ada@example.com",
      mfa: { totp: false },
    },
    memberships: [
      {
        membershipId: "9e8d7c6b-5a49-4382-a716-05f4e3d2c1b0",
        organization: {
          id: ORGANIZATION_IDENTIFIER,
          name: "ABC Clinic",
          status,
          type: "CLINIC",
        },
        roles: ["ORGANIZATION_OWNER"],
        products,
      },
    ],
    platformRoles: [],
  };
}

describe("resolveProductAccess", () => {
  it("opens HealthSchedule for an approved organisation with the product", () => {
    expect(
      resolveProductAccess(
        createSession({ status: "ACTIVE", products: ["HEALTHSCHEDULE"] })
      )
    ).toEqual({
      status: "ready",
      organization: { id: ORGANIZATION_IDENTIFIER, name: "ABC Clinic" },
    });
  });

  it("keeps an approved organisation without the product out", () => {
    expect(
      resolveProductAccess(
        createSession({ status: "ACTIVE", products: ["LABCONNECT"] })
      ).status
    ).toBe("product-not-enabled");
  });

  it.each(["PENDING_VERIFICATION", "UNDER_REVIEW"])(
    "keeps an organisation in %s at its application status",
    (status) => {
      expect(
        resolveProductAccess(
          createSession({ status, products: ["HEALTHSCHEDULE"] })
        ).status
      ).toBe("application-in-review");
    }
  );

  it.each(["DRAFT", "CHANGES_REQUESTED"])(
    "sends an organisation in %s back to its application",
    (status) => {
      expect(resolveProductAccess(createSession({ status })).status).toBe(
        "application-in-progress"
      );
    }
  );

  it.each(["SUSPENDED", "REJECTED", "DEACTIVATED"])(
    "reports that access is unavailable for %s",
    (status) => {
      expect(resolveProductAccess(createSession({ status })).status).toBe(
        "access-unavailable"
      );
    }
  );

  it("falls back to the first membership when no organisation is active", () => {
    expect(
      resolveProductAccess(
        createSession({
          status: "UNDER_REVIEW",
          activeOrganizationIdentifier: OTHER_ORGANIZATION_IDENTIFIER,
        })
      ).status
    ).toBe("application-in-review");
  });

  it("reports an account without an organisation", () => {
    expect(
      resolveProductAccess({
        ...createSession({ status: "ACTIVE" }),
        memberships: [],
      })
    ).toEqual({ status: "no-organization" });
  });
});
