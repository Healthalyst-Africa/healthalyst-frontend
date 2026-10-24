import { SENSITIVE_TOKEN_PROPERTY_NAMES } from "../config/request-policy";

export function sanitizeSensitiveResponseValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeSensitiveResponseValue(entry));
  }
  if (!isRecord(value)) return value;

  const safeValue: Record<string, unknown> = {};
  for (const [propertyName, propertyValue] of Object.entries(value)) {
    const normalizedPropertyName = propertyName
      .toLowerCase()
      .replaceAll("_", "")
      .replaceAll("-", "");
    if (SENSITIVE_TOKEN_PROPERTY_NAMES.has(normalizedPropertyName)) {
      continue;
    }
    safeValue[propertyName] = sanitizeSensitiveResponseValue(propertyValue);
  }
  return safeValue;
}

export function getNestedApiErrorCode(responseBody: Buffer): string | null {
  try {
    const parsedResponse: unknown = JSON.parse(responseBody.toString("utf8"));
    return isRecord(parsedResponse) &&
      isRecord(parsedResponse.error) &&
      typeof parsedResponse.error.code === "string"
      ? parsedResponse.error.code
      : null;
  } catch {
    return null;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
