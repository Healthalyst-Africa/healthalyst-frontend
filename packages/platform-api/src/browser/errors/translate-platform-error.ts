import { isAxiosError } from "axios";
import { getPlatformApiAddress } from "../http-client";
import {
  platformErrorBodySchema,
  fieldIssueSchema,
} from "../schemas/error-response";
import { PlatformApiError } from "./platform-api-error";

function toDottedPath(path: string | (string | number)[]): string {
  return Array.isArray(path) ? path.join(".") : path;
}

/**
 * Field errors keyed by form field name. `fieldNamesByPath` maps request
 * paths such as `organization.legalName` to form fields; a path is matched
 * exactly, then by its longest mapped prefix.
 */
function readFieldErrors(
  details: unknown,
  fieldNamesByPath: Readonly<Record<string, string>>
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!Array.isArray(details)) {
    return fieldErrors;
  }

  const mappedPaths = Object.keys(fieldNamesByPath).sort(
    (firstPath, secondPath) => secondPath.length - firstPath.length
  );

  for (const detail of details) {
    const issue = fieldIssueSchema.safeParse(detail);
    if (!issue.success) continue;

    const dottedPath = toDottedPath(issue.data.path);
    const matchedPath = mappedPaths.find(
      (mappedPath) =>
        dottedPath === mappedPath || dottedPath.startsWith(`${mappedPath}.`)
    );
    const fieldName = matchedPath ? fieldNamesByPath[matchedPath] : undefined;
    if (fieldName && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = issue.data.message;
    }
  }

  return fieldErrors;
}

function readRetryAfterSeconds(headerValue: unknown): number | null {
  const seconds = Number(headerValue);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
}

/**
 * Translates any failed Platform API call into a `PlatformApiError` whose
 * message can be shown to the user. Connection failures, including a request
 * the browser blocked under CORS, name the API address so the cause is clear.
 */
export function toPlatformApiError(
  error: unknown,
  fallbackMessage: string,
  fieldNamesByPath: Readonly<Record<string, string>> = {}
): PlatformApiError {
  if (error instanceof PlatformApiError) {
    return error;
  }

  if (!isAxiosError(error)) {
    return new PlatformApiError(fallbackMessage, null, null, null, {}, error);
  }

  if (!error.response) {
    const isTimeout =
      error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
    const address = getPlatformApiAddress() ?? "the Platform API";
    const message = isTimeout
      ? `The HealthAlyst Platform API (${address}) took too long to respond. Try again.`
      : `We could not reach the HealthAlyst Platform API (${address}). If the browser console shows a CORS error, the API has not allowed this site yet.`;

    return new PlatformApiError(message, null, null, null, {}, error);
  }

  const status = error.response.status;
  const body = platformErrorBodySchema.safeParse(error.response.data);

  if (status === 429) {
    const retryAfterSeconds = readRetryAfterSeconds(
      error.response.headers?.["retry-after"]
    );
    return new PlatformApiError(
      retryAfterSeconds
        ? `Too many attempts. Wait ${retryAfterSeconds} seconds and try again.`
        : "Too many attempts. Wait a moment and try again.",
      body.success ? body.data.error.code : "RATE_LIMITED",
      body.success ? body.data.error.requestId : null,
      status,
      {},
      error
    );
  }

  if (!body.success) {
    return new PlatformApiError(fallbackMessage, null, null, status, {}, error);
  }

  return new PlatformApiError(
    body.data.error.message,
    body.data.error.code,
    body.data.error.requestId,
    status,
    status === 422
      ? readFieldErrors(body.data.error.details, fieldNamesByPath)
      : {},
    error
  );
}
