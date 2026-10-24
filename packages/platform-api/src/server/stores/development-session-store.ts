import {
  REDIS_SESSION_PREFIX,
  REDIS_LOCK_PREFIX,
} from "../config/session-policy";
import { decryptSession, encryptSession } from "../session/encryption";
import type {
  PlatformSessionStore,
  PlatformSessionApplication,
} from "../types/platform-session";

const developmentRefreshLocks = new Map<string, string>();
const developmentSessions = new Map<
  string,
  { encryptedSession: string; expiresAt: number }
>();

export function createDevelopmentStore(
  application: PlatformSessionApplication,
  encryptionKey: Buffer
): PlatformSessionStore {
  const redisScope = `${REDIS_SESSION_PREFIX}:${application}:`;
  return {
    async readSession(sessionIdentifier) {
      const memoryKey = `${redisScope}${sessionIdentifier}`;
      const storedSession = developmentSessions.get(memoryKey);
      if (!storedSession || storedSession.expiresAt <= Date.now()) {
        developmentSessions.delete(memoryKey);
        return null;
      }
      return decryptSession(
        storedSession.encryptedSession,
        encryptionKey,
        sessionIdentifier,
        application
      );
    },
    async writeSession(sessionIdentifier, session) {
      const memoryKey = `${redisScope}${sessionIdentifier}`;
      developmentSessions.set(memoryKey, {
        encryptedSession: encryptSession(
          session,
          encryptionKey,
          sessionIdentifier,
          application
        ),
        expiresAt: session.refreshTokenExpiresAt,
      });
    },
    async deleteSession(sessionIdentifier) {
      developmentSessions.delete(`${redisScope}${sessionIdentifier}`);
    },
    async acquireRefreshLock(sessionIdentifier, lockIdentifier) {
      const lockKey = `${REDIS_LOCK_PREFIX}:${redisScope}${sessionIdentifier}`;
      if (developmentRefreshLocks.has(lockKey)) return false;
      developmentRefreshLocks.set(lockKey, lockIdentifier);
      return true;
    },
    async releaseRefreshLock(sessionIdentifier, lockIdentifier) {
      const lockKey = `${REDIS_LOCK_PREFIX}:${redisScope}${sessionIdentifier}`;
      if (developmentRefreshLocks.get(lockKey) === lockIdentifier) {
        developmentRefreshLocks.delete(lockKey);
      }
    },
  };
}
