import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi as mockUtilities,
} from "vitest";
import {
  getPlatformClient,
  getPlatformHttpClient,
} from "../../browser/http-client";
import {
  createCredential,
  ORGANIZATION_IDENTIFIER,
} from "../../browser/tests/transport-fixtures";
import {
  signInWithPassword,
  verifySignInCode,
  startAuthenticatorSetup,
  confirmAuthenticator,
  verifyPlatformEmailAddress,
  verifyStepUpCode,
  switchPlatformContext,
  signOut,
  resetPassword,
} from "../index";

function createSessionResponse() {
  return {
    ...createCredential(),
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      firstName: "Example",
      lastName: "Administrator",
      email: "administrator@example.test",
      mfa: { totp: true },
    },
    memberships: [
      {
        membershipId: "00000000-0000-4000-8000-000000000003",
        organization: {
          id: ORGANIZATION_IDENTIFIER,
          name: "Example clinic",
          status: "ACTIVE",
          type: "HOSPITAL",
        },
        roles: ["OWNER"],
        products: ["HEALTHSCHEDULE"],
      },
    ],
    platformRoles: [],
  };
}

beforeAll(() => {
  mockUtilities.stubGlobal("window", new EventTarget());
  mockUtilities.stubEnv("NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL", "/");
});

afterEach(() => {
  mockUtilities.restoreAllMocks();
});
afterAll(() => {
  mockUtilities.unstubAllGlobals();
  mockUtilities.unstubAllEnvs();
});

describe("backend authentication responses and requests", () => {
  it("retains the backend MFA challenge for the active password workflow", async () => {
    mockUtilities.spyOn(getPlatformHttpClient(), "post").mockResolvedValueOnce({
      status: 200,
      data: {
        status: "MFA_REQUIRED",
        mfaToken: "test-mfa-challenge",
        methods: ["totp"],
        expiresIn: 300,
      },
    });
    await expect(
      signInWithPassword({
        identifier: "administrator@example.test",
        password: "test-password",
      })
    ).resolves.toMatchObject({ mfaToken: "test-mfa-challenge" });
  });

  it("retains the backend enrolment challenge when an authenticator is required", async () => {
    mockUtilities.spyOn(getPlatformHttpClient(), "post").mockResolvedValueOnce({
      status: 200,
      data: {
        status: "MFA_ENROLMENT_REQUIRED",
        enrolmentToken: "test-enrolment-challenge",
        expiresIn: 600,
      },
    });
    await expect(
      signInWithPassword({
        identifier: "administrator@example.test",
        password: "test-password",
      })
    ).resolves.toMatchObject({ enrolmentToken: "test-enrolment-challenge" });
  });

  it("sends mfaToken in the verify request and keeps the access token out of returned identity data", async () => {
    const request = mockUtilities
      .spyOn(getPlatformHttpClient(), "post")
      .mockResolvedValueOnce({ status: 200, data: createSessionResponse() });
    const storeCredential = mockUtilities.spyOn(
      getPlatformClient(),
      "replaceAccessCredential"
    );
    const session = await verifySignInCode({
      mfaToken: "test-mfa-challenge",
      method: "totp",
      code: "123456",
    });
    expect(request).toHaveBeenCalledWith(
      "/v1/auth/mfa/verify",
      { mfaToken: "test-mfa-challenge", method: "totp", code: "123456" },
      { platformAuthentication: "public" }
    );
    expect(storeCredential).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "test-access-credential" }),
      "00000000-0000-4000-8000-000000000001"
    );
    expect(session).not.toHaveProperty("accessToken");
    expect(session.user.email).toBe("administrator@example.test");
  });

  it("uses the optional enrolmentToken returned by email verification", async () => {
    mockUtilities.spyOn(getPlatformHttpClient(), "post").mockResolvedValueOnce({
      status: 200,
      data: {
        verified: true,
        enrolmentToken: "test-enrolment-challenge",
        expiresIn: 600,
      },
    });
    await expect(
      verifyPlatformEmailAddress("test-email-verification-token")
    ).resolves.toEqual({
      verified: true,
      enrolmentToken: "test-enrolment-challenge",
      expiresIn: 600,
    });
  });

  it("accepts email verification without inventing an enrolment flag", async () => {
    mockUtilities
      .spyOn(getPlatformHttpClient(), "post")
      .mockResolvedValueOnce({ status: 200, data: { verified: true } });
    await expect(
      verifyPlatformEmailAddress("test-email-verification-token")
    ).resolves.toEqual({ verified: true });
  });

  it("passes the enrolment challenge to setup and confirmation and captures the issued session", async () => {
    const factorId = "00000000-0000-4000-8000-000000000004";
    const request = mockUtilities
      .spyOn(getPlatformHttpClient(), "post")
      .mockResolvedValueOnce({
        status: 200,
        data: {
          factorId,
          secret: "TEST-SETUP-KEY",
          otpauthUrl: "otpauth://totp/Example",
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          ...createSessionResponse(),
          recoveryCodes: ["TEST-RECOVERY-CODE"],
        },
      });
    await startAuthenticatorSetup("test-enrolment-challenge");
    const confirmation = await confirmAuthenticator({
      enrolmentToken: "test-enrolment-challenge",
      factorId,
      code: "123456",
    });
    expect(request).toHaveBeenNthCalledWith(
      1,
      "/v1/auth/mfa/totp/setup",
      { enrolmentToken: "test-enrolment-challenge" },
      { platformAuthentication: "public" }
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/v1/auth/mfa/totp/confirm",
      { enrolmentToken: "test-enrolment-challenge", factorId, code: "123456" },
      { platformAuthentication: "public" }
    );
    expect(confirmation.session).not.toHaveProperty("accessToken");
    expect(confirmation.recoveryCodes).toEqual(["TEST-RECOVERY-CODE"]);
  });

  it("supports adding a factor to an existing bearer session without an enrolment challenge", async () => {
    mockUtilities.spyOn(getPlatformHttpClient(), "post").mockResolvedValueOnce({
      status: 200,
      data: { recoveryCodes: ["TEST-RECOVERY-CODE"] },
    });
    await expect(
      confirmAuthenticator({
        factorId: "00000000-0000-4000-8000-000000000004",
        code: "123456",
      })
    ).resolves.toEqual({
      session: null,
      recoveryCodes: ["TEST-RECOVERY-CODE"],
    });
  });

  it("rejects a malformed issued session instead of silently downgrading it to recovery codes", async () => {
    mockUtilities.spyOn(getPlatformHttpClient(), "post").mockResolvedValueOnce({
      status: 200,
      data: {
        accessToken: "malformed-issued-session",
        recoveryCodes: ["TEST-RECOVERY-CODE"],
      },
    });
    await expect(
      confirmAuthenticator({
        factorId: "00000000-0000-4000-8000-000000000004",
        code: "123456",
      })
    ).rejects.toThrow();
  });

  it("replaces the access token after step-up and organisation context changes", async () => {
    const storeCredential = mockUtilities.spyOn(
      getPlatformClient(),
      "replaceAccessCredential"
    );
    mockUtilities
      .spyOn(getPlatformHttpClient(), "post")
      .mockResolvedValueOnce({
        status: 200,
        data: createCredential("step-up-credential"),
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          ...createCredential("platform-context-credential"),
          activeContext: {
            realm: "PLATFORM",
            organizationId: null,
            branchId: null,
          },
        },
      });
    const stepUp = await verifyStepUpCode({ code: "123456" });
    const context = await switchPlatformContext({ realm: "PLATFORM" });
    expect(storeCredential).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ accessToken: "step-up-credential" })
    );
    expect(storeCredential).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ accessToken: "platform-context-credential" })
    );
    expect(stepUp).not.toHaveProperty("accessToken");
    expect(context).not.toHaveProperty("accessToken");
  });

  it.each(["logout", "password-reset"])(
    "clears local credentials after a successful %s",
    async (operation) => {
      mockUtilities
        .spyOn(getPlatformHttpClient(), "post")
        .mockResolvedValueOnce({ status: 204 });
      const clearSession = mockUtilities.spyOn(
        getPlatformClient(),
        "clearSession"
      );
      if (operation === "logout") await signOut();
      else
        await resetPassword({
          token: "test-reset-token",
          password: "test-password",
        });
      expect(clearSession).toHaveBeenCalledTimes(1);
    }
  );
});
