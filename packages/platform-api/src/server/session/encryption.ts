import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { ENCRYPTED_SESSION_SCHEMA } from "../schemas/platform-session-schema";
import { getSessionStoreConfiguration } from "../config/runtime-configuration";
import { jsonResponse } from "../errors/platform-request-failure";
import type {
  PlatformBackendSession,
  PlatformSessionApplication,
} from "../types/platform-session";

export function getSessionEncryptionKey(): Buffer | Response {
  const configuredSecret = getSessionStoreConfiguration().encryptionSecret;
  if (Buffer.byteLength(configuredSecret, "utf8") < 32) {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_SESSION_CONFIGURATION_MISSING",
          message:
            "The server-side session encryption secret is not configured.",
        },
      },
      503
    );
  }
  return createHash("sha256").update(configuredSecret, "utf8").digest();
}

export function encryptSession(
  session: PlatformBackendSession,
  encryptionKey: Buffer,
  sessionIdentifier: string,
  application: PlatformSessionApplication
): string {
  const nonce = randomBytes(12);
  const encryptionCipher = createHmac("sha256", encryptionKey)
    .update("healthalyst-platform-bff-session-key")
    .digest();
  const cipher = createCipheriv("aes-256-gcm", encryptionCipher, nonce);
  cipher.setAAD(Buffer.from(`${application}:${sessionIdentifier}`, "utf8"));
  const encryptedBody = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  const authenticationTag = cipher.getAuthTag();
  return [
    nonce.toString("base64url"),
    authenticationTag.toString("base64url"),
    encryptedBody.toString("base64url"),
  ].join(".");
}

export function decryptSession(
  encryptedSession: string,
  encryptionKey: Buffer,
  sessionIdentifier: string,
  application: PlatformSessionApplication
): PlatformBackendSession | null {
  try {
    const [nonceValue, authenticationTagValue, encryptedBodyValue] =
      encryptedSession.split(".");
    if (!nonceValue || !authenticationTagValue || !encryptedBodyValue)
      return null;
    const nonce = Buffer.from(nonceValue, "base64url");
    const authenticationTag = Buffer.from(authenticationTagValue, "base64url");
    const encryptedBody = Buffer.from(encryptedBodyValue, "base64url");
    if (nonce.byteLength !== 12 || authenticationTag.byteLength !== 16)
      return null;
    const encryptionCipher = createHmac("sha256", encryptionKey)
      .update("healthalyst-platform-bff-session-key")
      .digest();
    const decipher = createDecipheriv("aes-256-gcm", encryptionCipher, nonce);
    decipher.setAAD(Buffer.from(`${application}:${sessionIdentifier}`, "utf8"));
    decipher.setAuthTag(authenticationTag);
    const serializedSession = Buffer.concat([
      decipher.update(encryptedBody),
      decipher.final(),
    ]).toString("utf8");
    const session = ENCRYPTED_SESSION_SCHEMA.safeParse(
      JSON.parse(serializedSession)
    );
    return session.success && session.data.refreshTokenExpiresAt > Date.now()
      ? session.data
      : null;
  } catch {
    return null;
  }
}

export function hashSessionIdentifier(sessionIdentifier: string): string {
  return createHash("sha256").update(sessionIdentifier, "utf8").digest("hex");
}
