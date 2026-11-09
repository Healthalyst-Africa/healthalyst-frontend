import { describe, expect, it } from "vitest";
import { decideCaching, type CachingRequest } from "./caching-rules";

const APP_ORIGIN = "https://healthschedule.example.test";

function request(
  path: string,
  overrides: Partial<Omit<CachingRequest, "url">> & { origin?: string } = {}
): CachingRequest {
  const { origin = APP_ORIGIN, ...rest } = overrides;
  return {
    url: new URL(path, origin),
    appOrigin: APP_ORIGIN,
    method: "GET",
    mode: "cors",
    destination: "",
    isServerComponentPayload: false,
    ...rest,
  };
}

const OFFLINE_PRODUCT = { keepPagesForOffline: true };
const ONLINE_PRODUCT = { keepPagesForOffline: false };

describe("service worker caching rules", () => {
  it("never stores API responses, through a proxy or directly", () => {
    for (const path of [
      "/v1/me",
      "/v1/patients?search=ada",
      "/health-schedule-api/v1/appointments",
    ]) {
      expect(decideCaching(request(path), OFFLINE_PRODUCT)).toBe(
        "network-only"
      );
    }
    expect(
      decideCaching(
        request("/v1/patients", {
          origin: "https://healthschedule-api.example.test",
        }),
        OFFLINE_PRODUCT
      )
    ).toBe("network-only");
  });

  it("never stores writes", () => {
    expect(
      decideCaching(request("/patients", { method: "POST" }), OFFLINE_PRODUCT)
    ).toBe("network-only");
  });

  it("keeps hashed build files and images", () => {
    expect(
      decideCaching(
        request("/_next/static/chunks/main-abc123.js"),
        ONLINE_PRODUCT
      )
    ).toBe("immutable-asset");
    expect(
      decideCaching(
        request("/logo-mark.png", { destination: "image" }),
        ONLINE_PRODUCT
      )
    ).toBe("static-asset");
  });

  it("keeps pages only for products built to work offline", () => {
    const page = request("/queue", {
      mode: "navigate",
      destination: "document",
    });
    expect(decideCaching(page, OFFLINE_PRODUCT)).toBe("page");
    expect(decideCaching(page, ONLINE_PRODUCT)).toBe("network-only");
    const payload = request("/queue?_rsc=1", {
      isServerComponentPayload: true,
    });
    expect(decideCaching(payload, OFFLINE_PRODUCT)).toBe("page");
  });

  it("does not serve the service worker from storage", () => {
    expect(decideCaching(request("/serwist/sw.js"), OFFLINE_PRODUCT)).toBe(
      "network-only"
    );
  });
});
