import { getSessionStoreConfiguration } from "../config/runtime-configuration";
import { jsonResponse } from "../errors/platform-request-failure";
import { getSessionEncryptionKey } from "../session/encryption";
import { createDevelopmentStore } from "./development-session-store";
import { createRedisStore, getRedisConnection } from "./redis-session-store";
import type {
  PlatformSessionStore,
  PlatformSessionApplication,
} from "../types/platform-session";

export async function getPlatformSessionStore(
  application: PlatformSessionApplication
): Promise<PlatformSessionStore | Response> {
  const encryptionKey = getSessionEncryptionKey();
  if (encryptionKey instanceof Response) return encryptionKey;

  const { redisAddress, allowDevelopmentStore } =
    getSessionStoreConfiguration();
  if (!redisAddress && allowDevelopmentStore) {
    return createDevelopmentStore(application, encryptionKey);
  }
  if (!redisAddress) {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_SESSION_CONFIGURATION_MISSING",
          message: "The server-side session store is not configured.",
        },
      },
      503
    );
  }

  try {
    const redisConnection = await getRedisConnection(redisAddress);
    return createRedisStore(redisConnection, application, encryptionKey);
  } catch {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_SESSION_STORE_UNAVAILABLE",
          message: "Sign-in is temporarily unavailable. Please try again.",
        },
      },
      503
    );
  }
}
