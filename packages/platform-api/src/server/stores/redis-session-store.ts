import Redis from "ioredis";
import {
  REDIS_SESSION_PREFIX,
  REDIS_LOCK_PREFIX,
  SESSION_LOCK_LEASE_MILLISECONDS,
  REDIS_CONNECTION_CONFIGURATION,
} from "../config/session-policy";
import {
  decryptSession,
  encryptSession,
  hashSessionIdentifier,
} from "../session/encryption";
import { authenticationFailure } from "../errors/platform-request-failure";
import type {
  PlatformSessionStore,
  PlatformSessionApplication,
} from "../types/platform-session";

let redisClient: Redis | null = null;
let redisConnection: Promise<Redis> | null = null;

export async function getRedisConnection(redisAddress: string): Promise<Redis> {
  if (redisClient && redisConnection) return redisConnection;
  const nextRedisClient = new Redis(redisAddress, {
    lazyConnect: true,
    maxRetriesPerRequest: REDIS_CONNECTION_CONFIGURATION.retriesPerRequest,
    connectTimeout:
      REDIS_CONNECTION_CONFIGURATION.connectionTimeoutMilliseconds,
    retryStrategy: (attemptNumber) =>
      Math.min(
        attemptNumber * REDIS_CONNECTION_CONFIGURATION.retryDelayMilliseconds,
        REDIS_CONNECTION_CONFIGURATION.maximumRetryDelayMilliseconds
      ),
  });
  nextRedisClient.on("error", () => undefined);
  redisClient = nextRedisClient;
  redisConnection = nextRedisClient
    .connect()
    .then(() => nextRedisClient)
    .catch((error: unknown) => {
      if (redisClient === nextRedisClient) {
        redisClient = null;
        redisConnection = null;
      }
      throw error;
    });
  return redisConnection;
}

export function createRedisStore(
  redisConnection: Redis,
  application: PlatformSessionApplication,
  encryptionKey: Buffer
): PlatformSessionStore {
  const sessionKey = (sessionIdentifier: string) =>
    `${REDIS_SESSION_PREFIX}:${application}:${hashSessionIdentifier(sessionIdentifier)}`;
  const lockKey = (sessionIdentifier: string) =>
    `${REDIS_LOCK_PREFIX}:${application}:${hashSessionIdentifier(sessionIdentifier)}`;

  return {
    async readSession(sessionIdentifier) {
      const encryptedSession = await redisConnection.get(
        sessionKey(sessionIdentifier)
      );
      return encryptedSession
        ? decryptSession(
            encryptedSession,
            encryptionKey,
            sessionIdentifier,
            application
          )
        : null;
    },
    async writeSession(sessionIdentifier, session) {
      const sessionTimeToLiveSeconds = Math.floor(
        (session.refreshTokenExpiresAt - Date.now()) / 1000
      );
      if (sessionTimeToLiveSeconds <= 0) throw authenticationFailure();
      await redisConnection.set(
        sessionKey(sessionIdentifier),
        encryptSession(session, encryptionKey, sessionIdentifier, application),
        "EX",
        sessionTimeToLiveSeconds
      );
    },
    async deleteSession(sessionIdentifier) {
      await redisConnection.del(sessionKey(sessionIdentifier));
    },
    async acquireRefreshLock(sessionIdentifier, lockIdentifier) {
      const result = await redisConnection.set(
        lockKey(sessionIdentifier),
        lockIdentifier,
        "PX",
        SESSION_LOCK_LEASE_MILLISECONDS,
        "NX"
      );
      return result === "OK";
    },
    async releaseRefreshLock(sessionIdentifier, lockIdentifier) {
      const releaseLockScript =
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
      await redisConnection.eval(
        releaseLockScript,
        1,
        lockKey(sessionIdentifier),
        lockIdentifier
      );
    },
  };
}
