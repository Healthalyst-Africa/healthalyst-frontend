import { describe, expect, it } from "vitest";
import { createPlatformApiRewrites } from "../../../next-config.mjs";
import { validatePlatformApiAddress } from "../config/api-address";

const API_ORIGIN = "https://healthalyst-platform-api-dev.onrender.com";

describe("API addresses and transparent /v1 proxy", () => {
  it.each(["/", API_ORIGIN, "http://localhost:3000"])(
    "accepts a configured browser origin: %s",
    (address) => {
      expect(validatePlatformApiAddress(address)).toBe(address);
    }
  );

  it.each([
    undefined,
    "",
    "/api/platform",
    "//api.example.test",
    "https://api.example.test/v1",
    "http://api.example.test",
    "https://user:password@api.example.test",
    "https://api.example.test?token=value",
    "https://api.example.test#fragment",
  ])("rejects an invalid browser address: %s", (address) => {
    expect(() => validatePlatformApiAddress(address)).toThrow();
  });

  it("preserves the API paths and cookie path with a fixed upstream origin", () => {
    expect(
      createPlatformApiRewrites({
        browserAddress: "/",
        upstreamAddress: API_ORIGIN,
      })
    ).toEqual([
      { source: "/v1/:path*", destination: `${API_ORIGIN}/v1/:path*` },
    ]);
  });

  it("does not add a proxy when a same-site API is called directly", () => {
    expect(
      createPlatformApiRewrites({
        browserAddress: "https://platform-api.dev.healthalystafrica.com",
      })
    ).toEqual([]);
  });

  it("rejects a missing proxy target instead of selecting a different backend", () => {
    expect(() => createPlatformApiRewrites({ browserAddress: "/" })).toThrow(
      "HEALTHALYST_PLATFORM_API_URL"
    );
  });

  it.each([
    "http://untrusted.example.test",
    "https://api.example.test/v1",
    "https://user:password@api.example.test",
  ])("rejects an invalid proxy target: %s", (upstreamAddress) => {
    expect(() =>
      createPlatformApiRewrites({ browserAddress: "/", upstreamAddress })
    ).toThrow();
  });
});
