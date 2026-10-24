import type { AxiosResponse } from "axios";
import { ACCESS_TOKEN_RESPONSE_SCHEMA } from "../schemas/platform-session-schema";
import { readAuthenticationChallenge } from "../authentication/challenge";
import { isRecord, sanitizeSensitiveResponseValue } from "./response-values";
import type { ParsedPlatformResponse } from "../types/platform-session";

export function parsePlatformResponse(
  upstreamResponse: AxiosResponse<Buffer>,
  platformPath: string
): ParsedPlatformResponse {
  const responseBody = Buffer.from(upstreamResponse.data ?? Buffer.alloc(0));
  const contentType = String(upstreamResponse.headers["content-type"] ?? "");
  const responseText = responseBody.toString("utf8").trimStart();
  if (
    responseBody.byteLength === 0 ||
    (!contentType.toLowerCase().includes("json") &&
      !responseText.startsWith("{") &&
      !responseText.startsWith("["))
  ) {
    return {
      body: responseBody,
      accessTokenResponse: null,
      authenticationChallenge: null,
    };
  }

  try {
    const parsedBody: unknown = JSON.parse(responseText);
    const tokenResponse = isRecord(parsedBody)
      ? ACCESS_TOKEN_RESPONSE_SCHEMA.safeParse(parsedBody)
      : null;
    const safeResponseBody = sanitizeSensitiveResponseValue(parsedBody);
    return {
      body: Buffer.from(JSON.stringify(safeResponseBody)),
      accessTokenResponse:
        tokenResponse?.success === true ? tokenResponse.data : null,
      authenticationChallenge: readAuthenticationChallenge(
        parsedBody,
        platformPath
      ),
    };
  } catch {
    return {
      body: responseBody,
      accessTokenResponse: null,
      authenticationChallenge: null,
    };
  }
}
