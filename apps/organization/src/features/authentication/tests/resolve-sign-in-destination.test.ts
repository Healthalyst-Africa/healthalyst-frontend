import { describe, expect, it } from "vitest";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { resolveSignInDestination } from "~/features/authentication/utilities/resolve-sign-in-destination";
import { readProductsFromQuery } from "~/shared/organization/utilities/read-products-from-query";

const ORGANIZATION_IDENTIFIER = "8a7f1c1e-5b8e-4c6f-9c3a-2f1d0e9b7a61";
const HEALTH_SCHEDULE_ADDRESS = "https://healthschedule.example.test";
const LABORATORY_ADDRESS = "https://labconnect.example.test";

function createSession({
  status = "ACTIVE",
  products = [],
  platformRoles = [],
}: {
  status?: string;
  products?: string[];
  platformRoles?: string[];
}): PlatformSession {
  return {
    activeContext: { realm: "TENANT", organizationId: ORGANIZATION_IDENTIFIER },
    user: {
      id: "4f3e2d1c-0b9a-4876-9543-210fedcba987",
      firstName: "Ada",
      lastName: "Okafor",
      email: "ada@example.test",
      mfa: { totp: true },
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
    platformRoles,
  };
}

const HEALTH_SCHEDULE_DESTINATION = {
  kind: "product",
  productCode: "HEALTHSCHEDULE",
  productName: "HealthSchedule",
  address: HEALTH_SCHEDULE_ADDRESS,
};

describe("resolveSignInDestination", () => {
  it("sends platform staff to Super Admin", () => {
    expect(
      resolveSignInDestination({
        platformSession: createSession({ platformRoles: ["SUPER_ADMIN"] }),
        requestedProductCodes: [],
        productAddresses: { HEALTHSCHEDULE: HEALTH_SCHEDULE_ADDRESS },
        recentlyOpenedProductCode: null,
      })
    ).toEqual({ kind: "super-admin" });
  });

  it.each(["DRAFT", "PENDING_VERIFICATION", "UNDER_REVIEW", "SUSPENDED"])(
    "keeps a %s organisation in onboarding, even with products",
    (status) => {
      expect(
        resolveSignInDestination({
          platformSession: createSession({
            status,
            products: ["HEALTHSCHEDULE"],
          }),
          requestedProductCodes: ["HEALTHSCHEDULE"],
          productAddresses: { HEALTHSCHEDULE: HEALTH_SCHEDULE_ADDRESS },
          recentlyOpenedProductCode: null,
        })
      ).toEqual({ kind: "onboarding" });
    }
  );

  it("opens the only enabled product that has an app", () => {
    expect(
      resolveSignInDestination({
        platformSession: createSession({
          products: ["HEALTHSCHEDULE", "PHARMADESK"],
        }),
        requestedProductCodes: [],
        productAddresses: { HEALTHSCHEDULE: HEALTH_SCHEDULE_ADDRESS },
        recentlyOpenedProductCode: null,
      })
    ).toEqual(HEALTH_SCHEDULE_DESTINATION);
  });

  it("returns to the product that sent the person to sign in", () => {
    expect(
      resolveSignInDestination({
        platformSession: createSession({
          products: ["HEALTHSCHEDULE", "LABCONNECT"],
        }),
        requestedProductCodes: ["HEALTHSCHEDULE"],
        productAddresses: {
          HEALTHSCHEDULE: HEALTH_SCHEDULE_ADDRESS,
          LABCONNECT: LABORATORY_ADDRESS,
        },
        recentlyOpenedProductCode: null,
      })
    ).toEqual(HEALTH_SCHEDULE_DESTINATION);
  });

  it("offers the products page when several products can open", () => {
    expect(
      resolveSignInDestination({
        platformSession: createSession({
          products: ["HEALTHSCHEDULE", "LABCONNECT"],
        }),
        requestedProductCodes: [],
        productAddresses: {
          HEALTHSCHEDULE: HEALTH_SCHEDULE_ADDRESS,
          LABCONNECT: LABORATORY_ADDRESS,
        },
        recentlyOpenedProductCode: null,
      })
    ).toEqual({ kind: "products" });
  });

  it("ignores a requested product the organisation does not have", () => {
    expect(
      resolveSignInDestination({
        platformSession: createSession({ products: [] }),
        requestedProductCodes: ["HEALTHSCHEDULE"],
        productAddresses: { HEALTHSCHEDULE: HEALTH_SCHEDULE_ADDRESS },
        recentlyOpenedProductCode: null,
      })
    ).toEqual({ kind: "products" });
  });

  it("does not reopen a product that just sent the person back", () => {
    expect(
      resolveSignInDestination({
        platformSession: createSession({ products: ["HEALTHSCHEDULE"] }),
        requestedProductCodes: ["HEALTHSCHEDULE"],
        productAddresses: { HEALTHSCHEDULE: HEALTH_SCHEDULE_ADDRESS },
        recentlyOpenedProductCode: "HEALTHSCHEDULE",
      })
    ).toEqual({ kind: "products" });
  });
});

describe("readProductsFromQuery", () => {
  it("reads known product names in any case and ignores the rest", () => {
    expect(readProductsFromQuery("healthschedule,unknown")).toEqual([
      "HEALTHSCHEDULE",
    ]);
    expect(readProductsFromQuery(["LabConnect", " pharmadesk "])).toEqual([
      "LABCONNECT",
      "PHARMADESK",
    ]);
    expect(readProductsFromQuery(undefined)).toEqual([]);
  });
});
