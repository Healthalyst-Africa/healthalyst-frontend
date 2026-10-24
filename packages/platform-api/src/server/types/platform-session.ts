import type { z as schema } from "zod";
import type {
  ACCESS_TOKEN_RESPONSE_SCHEMA,
  ENCRYPTED_SESSION_SCHEMA,
} from "../schemas/platform-session-schema";

export type PlatformBackendSession = schema.infer<
  typeof ENCRYPTED_SESSION_SCHEMA
>;
export type PlatformSessionApplication = "organization" | "super-admin";
export type PlatformRouteConfiguration = {
  application: PlatformSessionApplication;
  localOrigin: string;
  sessionCookieName: string;
  challengeCookieName: string;
};
export type PlatformAuthenticationChallenge = {
  kind: "mfa" | "enrolment";
  token: string;
  expiresIn: number;
};
export type UpstreamRefreshCookie =
  | { kind: "rotated"; token: string; expiresAt: number }
  | { kind: "cleared" }
  | { kind: "missing" };
export type ParsedPlatformResponse = {
  body: Buffer;
  accessTokenResponse: schema.infer<typeof ACCESS_TOKEN_RESPONSE_SCHEMA> | null;
  authenticationChallenge: PlatformAuthenticationChallenge | null;
};
export type PlatformSessionStore = {
  readSession: (
    sessionIdentifier: string
  ) => Promise<PlatformBackendSession | null>;
  writeSession: (
    sessionIdentifier: string,
    session: PlatformBackendSession
  ) => Promise<void>;
  deleteSession: (sessionIdentifier: string) => Promise<void>;
  acquireRefreshLock: (
    sessionIdentifier: string,
    lockIdentifier: string
  ) => Promise<boolean>;
  releaseRefreshLock: (
    sessionIdentifier: string,
    lockIdentifier: string
  ) => Promise<void>;
};

export type PlatformRequestSession = {
  cookieSessionIdentifier: string | null;
  responseSession: PlatformBackendSession | null;
  sessionStore: PlatformSessionStore | null;
  hasStaleSessionCookie: boolean;
};
