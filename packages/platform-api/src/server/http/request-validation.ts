import { AUTHENTICATION_ENDPOINTS } from "../../authentication/config/authentication-requests";
import { ALLOWED_REQUEST_METHODS } from "../config/request-policy";
import {
  getExpectedApplicationOrigin,
  getPlatformApiAddress,
} from "../config/runtime-configuration";
import { isAllowedPlatformPath } from "../config/route-policy";
import { jsonResponse } from "../errors/platform-request-failure";
import {
  hasTokenQueryParameter,
  hasValidBrowserRequest,
  isSafeMethod,
} from "./request-body";
import type { PlatformRouteConfiguration } from "../types/platform-session";

export function validatePlatformRequest(
  request: Request,
  platformPath: string,
  configuration: PlatformRouteConfiguration
):
  | { method: string; expectedOrigin: string; platformApiAddress: string }
  | Response {
  const browserRequestUrl = new URL(request.url);
  if (hasTokenQueryParameter(browserRequestUrl)) {
    return jsonResponse(
      {
        error: {
          code: "TOKEN_IN_QUERY_NOT_ALLOWED",
          message: "Authentication tokens must not be sent in the URL.",
        },
      },
      400
    );
  }

  if (
    platformPath === AUTHENTICATION_ENDPOINTS.refresh ||
    !isAllowedPlatformPath(platformPath)
  ) {
    return jsonResponse(
      { error: { code: "NOT_FOUND", message: "Not found." } },
      404
    );
  }

  const method = request.method.toUpperCase();
  if (!ALLOWED_REQUEST_METHODS.includes(method)) {
    return jsonResponse(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } },
      405,
      { Allow: ALLOWED_REQUEST_METHODS.join(", ") }
    );
  }

  const expectedOrigin = getExpectedApplicationOrigin(configuration);
  if (!expectedOrigin) {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_SESSION_CONFIGURATION_MISSING",
          message:
            "The application server is missing its origin configuration.",
        },
      },
      503
    );
  }

  if (
    !isSafeMethod(method) &&
    !hasValidBrowserRequest(request, expectedOrigin)
  ) {
    return jsonResponse(
      {
        error: {
          code: "CSRF_CHECK_FAILED",
          message: "Request could not be verified.",
        },
      },
      403
    );
  }

  const platformApiAddress = getPlatformApiAddress();
  if (!platformApiAddress) {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_SESSION_CONFIGURATION_MISSING",
          message:
            "The Platform API address is not configured on the application server.",
        },
      },
      503
    );
  }

  return { method, expectedOrigin, platformApiAddress };
}
