export const REQUEST_BODY_LIMIT_BYTES = 2 * 1024 * 1024;
export const ALLOWED_REQUEST_METHODS = [
  "GET",
  "POST",
  "PATCH",
  "PUT",
  "DELETE",
];
export const REFRESHABLE_AUTHENTICATION_CODES = new Set([
  "AUTH_TOKEN_MISSING",
  "AUTH_TOKEN_INVALID",
  "AUTH_TOKEN_EXPIRED",
  "AUTH_SESSION_REVOKED",
]);
export const SENSITIVE_TOKEN_PROPERTY_NAMES = new Set([
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "mfatoken",
  "enrolmenttoken",
]);
