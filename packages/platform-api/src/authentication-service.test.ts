import { afterEach, describe, expect, it, vi as mockUtilities } from "vitest";
import { restorePlatformSession } from "./authentication-service";
import { getPlatformHttpClient } from "./http-client";

const BRANCH_IDENTIFIER = "00000000-0000-4000-8000-000000000004";

function createProfileResponse(branchIdentifiers: string[]) {
  return {
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      firstName: "Example",
      lastName: "Administrator",
      email: "administrator@example.test",
      emailVerifiedAt: "2026-01-01T00:00:00.000Z",
      phone: null,
      phoneVerifiedAt: null,
      mfa: { totp: true },
    },
    memberships: [
      {
        membershipId: "00000000-0000-4000-8000-000000000003",
        organization: {
          id: "00000000-0000-4000-8000-000000000002",
          name: "Example organisation",
          status: "DRAFT",
          type: null,
        },
        roles: [],
        products: ["HEALTHSCHEDULE"],
      },
    ],
    platformRoles: [],
    activeContext: {
      realm: "TENANT",
      organizationId: "00000000-0000-4000-8000-000000000002",
      organizationStatus: "DRAFT",
      roles: [],
      permissions: [],
      branchIds: branchIdentifiers,
    },
  };
}

afterEach(() => {
  mockUtilities.restoreAllMocks();
});

describe("session restoration from the current profile", () => {
  it.each([
    { description: "all branches", branchIdentifiers: ["*"] },
    {
      description: "a specific branch",
      branchIdentifiers: [BRANCH_IDENTIFIER],
    },
    { description: "no branches", branchIdentifiers: [] },
  ])(
    "accepts a successful profile scoped to $description",
    async ({ branchIdentifiers }) => {
      const profileResponse = createProfileResponse(branchIdentifiers);
      const profileRequest = mockUtilities
        .spyOn(getPlatformHttpClient(), "get")
        .mockResolvedValueOnce({ status: 200, data: profileResponse });

      await expect(restorePlatformSession()).resolves.toEqual(profileResponse);
      expect(profileRequest).toHaveBeenCalledWith("/v1/me");
    }
  );

  it("reports invalid profile data without treating the session as unauthenticated", async () => {
    const profileResponse = createProfileResponse(["*"]);
    profileResponse.user.id = "invalid-user-identifier";
    mockUtilities
      .spyOn(getPlatformHttpClient(), "get")
      .mockResolvedValueOnce({ status: 200, data: profileResponse });

    await expect(restorePlatformSession()).rejects.toMatchObject({
      code: "INVALID_PLATFORM_RESPONSE",
      status: 200,
      cause: {
        issues: expect.arrayContaining([
          expect.objectContaining({ path: ["user", "id"] }),
        ]),
      },
    });
  });
});
