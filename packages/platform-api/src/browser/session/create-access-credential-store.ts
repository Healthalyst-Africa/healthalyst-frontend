import type { AccessCredential } from "../types/access-credential";
import { PLATFORM_HTTP_CONFIGURATION } from "../../config/browser-config";
import { readAccessTokenSubject } from "./read-access-token-subject";

/** Private to one app's transport. No browser persistence or cookie writes. */
export function createAccessCredentialStore(
  onSessionExpired?: () => void,
  onContextChanged?: () => void
) {
  let credential: AccessCredential | null = null;
  let expiresAt = 0;
  let revision = 0;
  let identityEpoch = 0;
  let identityIdentifier: string | null = null;
  let ended = false;

  return {
    read: () => credential,
    getRevision: () => revision,
    getIdentityEpoch: () => identityEpoch,
    hasEnded: () => ended,
    allowRestoration() {
      if (ended) {
        ended = false;
        revision += 1;
      }
    },
    isFresh: () =>
      credential !== null &&
      expiresAt >
        Date.now() + PLATFORM_HTTP_CONFIGURATION.expirationMarginMilliseconds,
    replace(nextCredential: AccessCredential, nextIdentityIdentifier?: string) {
      const hadCredential = credential !== null;
      const contextChanged =
        credential !== null &&
        getCredentialContextScope(credential) !==
          getCredentialContextScope(nextCredential);
      const resolvedIdentityIdentifier =
        nextIdentityIdentifier ??
        readAccessTokenSubject(nextCredential.accessToken) ??
        identityIdentifier;
      const identityChanged = resolvedIdentityIdentifier !== identityIdentifier;
      identityIdentifier = resolvedIdentityIdentifier;
      if (identityChanged || contextChanged) identityEpoch += 1;
      credential = nextCredential;
      expiresAt = Date.now() + nextCredential.expiresIn * 1000;
      ended = false;
      revision += 1;
      if (contextChanged || (hadCredential && identityChanged))
        onContextChanged?.();
    },
    clear() {
      credential = null;
      expiresAt = 0;
      ended = true;
      identityIdentifier = null;
      identityEpoch += 1;
      revision += 1;
      onSessionExpired?.();
    },
  };
}

export function getCredentialContextScope(
  credential: AccessCredential
): string {
  const context = credential.activeContext;
  return JSON.stringify([
    context.realm,
    context.organizationId,
    context.branchId ?? null,
  ]);
}

export type AccessCredentialStore = ReturnType<
  typeof createAccessCredentialStore
>;
