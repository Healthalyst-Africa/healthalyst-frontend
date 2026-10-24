import type { AxiosResponse } from "axios";
import { API_REFRESH_COOKIE_NAME } from "../config/runtime-configuration";
import { REFRESHABLE_AUTHENTICATION_CODES } from "../config/request-policy";
import { isRecord } from "./response-values";
import type { UpstreamRefreshCookie } from "../types/platform-session";

export function copyResponseHeaders(
  upstreamResponse: AxiosResponse<Buffer>
): Headers {
  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  const responseHeaderNames = [
    "content-type",
    "etag",
    "retry-after",
    "x-request-id",
    "x-correlation-id",
  ];
  for (const responseHeaderName of responseHeaderNames) {
    const responseHeaderValue = upstreamResponse.headers[responseHeaderName];
    if (typeof responseHeaderValue === "string") {
      responseHeaders.set(responseHeaderName, responseHeaderValue);
    }
  }
  return responseHeaders;
}

export function readUpstreamRefreshCookie(
  upstreamResponse: AxiosResponse<Buffer>
): UpstreamRefreshCookie {
  const cookieHeaders = upstreamResponse.headers["set-cookie"];
  if (!Array.isArray(cookieHeaders)) return { kind: "missing" };
  const expectedCookiePrefix = `${API_REFRESH_COOKIE_NAME}=`;
  const refreshCookieHeader = cookieHeaders.find((cookieHeader) =>
    cookieHeader.startsWith(expectedCookiePrefix)
  );
  if (!refreshCookieHeader) return { kind: "missing" };

  const cookieAttributes = refreshCookieHeader
    .split(";")
    .map((attribute) => attribute.trim());
  const cookieValue =
    cookieAttributes[0]?.slice(expectedCookiePrefix.length) ?? "";
  const maxAgeAttribute = cookieAttributes.find((attribute) =>
    attribute.toLowerCase().startsWith("max-age=")
  );
  const expiresAttribute = cookieAttributes.find((attribute) =>
    attribute.toLowerCase().startsWith("expires=")
  );
  const maxAgeSeconds = maxAgeAttribute
    ? Number(maxAgeAttribute.slice("max-age=".length))
    : null;
  const expiresAt =
    maxAgeSeconds !== null && Number.isFinite(maxAgeSeconds)
      ? Date.now() + maxAgeSeconds * 1000
      : expiresAttribute
        ? Date.parse(expiresAttribute.slice("expires=".length))
        : Number.NaN;

  if (maxAgeSeconds === 0 || !cookieValue) return { kind: "cleared" };
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return { kind: "missing" };
  }
  return { kind: "rotated", token: cookieValue, expiresAt };
}

export function isRefreshableUnauthorized(
  upstreamResponse: AxiosResponse<Buffer>
): boolean {
  if (upstreamResponse.status !== 401) return false;
  try {
    const errorResponse: unknown = JSON.parse(
      Buffer.from(upstreamResponse.data ?? Buffer.alloc(0)).toString("utf8")
    );
    return (
      isRecord(errorResponse) &&
      isRecord(errorResponse.error) &&
      typeof errorResponse.error.code === "string" &&
      REFRESHABLE_AUTHENTICATION_CODES.has(errorResponse.error.code)
    );
  } catch {
    return false;
  }
}
