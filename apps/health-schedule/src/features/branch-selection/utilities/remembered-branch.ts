import { REMEMBERED_BRANCH_STORAGE_PREFIX } from "~/features/branch-selection/config/branch-selection";

function storageName(userIdentifier: string, organizationIdentifier: string) {
  return `${REMEMBERED_BRANCH_STORAGE_PREFIX}:${userIdentifier}:${organizationIdentifier}`;
}

/**
 * The branch a person last chose on this device. This is a convenience only:
 * the branch is checked against the person's current branches before use,
 * and storage may be unavailable.
 */
export function readRememberedBranch(
  userIdentifier: string,
  organizationIdentifier: string
): string | null {
  try {
    return window.localStorage.getItem(
      storageName(userIdentifier, organizationIdentifier)
    );
  } catch {
    return null;
  }
}

export function rememberBranch(
  userIdentifier: string,
  organizationIdentifier: string,
  branchIdentifier: string
) {
  try {
    window.localStorage.setItem(
      storageName(userIdentifier, organizationIdentifier),
      branchIdentifier
    );
  } catch {
    // Without storage, the person chooses again next time.
  }
}
