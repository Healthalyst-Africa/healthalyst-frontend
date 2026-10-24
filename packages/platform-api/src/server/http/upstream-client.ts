import { PLATFORM_HTTP_CONFIGURATION } from "../../config/browser-config";
import axios, { type AxiosResponse } from "axios";
import { API_REFRESH_COOKIE_NAME } from "../config/runtime-configuration";
import { REQUEST_BODY_LIMIT_BYTES } from "../config/request-policy";
import type { PlatformBackendSession } from "../types/platform-session";

export const platformApiClient = axios.create({
  timeout: PLATFORM_HTTP_CONFIGURATION.timeoutMilliseconds,
  maxRedirects: 0,
  maxBodyLength: REQUEST_BODY_LIMIT_BYTES,
  maxContentLength: REQUEST_BODY_LIMIT_BYTES,
  decompress: true,
  validateStatus: () => true,
});

export async function sendPlatformRequest(properties: {
  request: Request;
  method: string;
  upstreamUrl: URL;
  requestBody: Buffer | undefined;
  session: PlatformBackendSession | null;
  expectedOrigin: string;
}): Promise<AxiosResponse<Buffer>> {
  const headers: Record<string, string | null> = {
    Accept: properties.request.headers.get("accept") ?? "application/json",
    "X-Requested-With": PLATFORM_HTTP_CONFIGURATION.requestedWith,
    Origin: properties.expectedOrigin,
  };
  const contentType = properties.request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const ifMatchHeader = properties.request.headers.get("if-match");
  if (ifMatchHeader) headers["If-Match"] = ifMatchHeader;
  const ifNoneMatchHeader = properties.request.headers.get("if-none-match");
  if (ifNoneMatchHeader) headers["If-None-Match"] = ifNoneMatchHeader;
  if (properties.session) {
    headers.Authorization = `Bearer ${properties.session.accessToken}`;
  }
  if (
    properties.session &&
    properties.upstreamUrl.pathname.startsWith("/v1/auth/")
  ) {
    headers.Cookie = `${API_REFRESH_COOKIE_NAME}=${properties.session.refreshToken}`;
  }

  return platformApiClient.request<Buffer>({
    url: properties.upstreamUrl.toString(),
    method: properties.method,
    data: properties.requestBody,
    headers,
    responseType: "arraybuffer",
    transformResponse: [(responseBody: Buffer) => responseBody],
  });
}
