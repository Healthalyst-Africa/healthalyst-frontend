/**
 * After a transfer the session is restored, which briefly unmounts the
 * settings page. The new owner's name is kept here, in memory only, so the
 * page can still confirm what happened when it returns.
 */
let pendingNewOwnerName: string | null = null;

export function rememberOwnershipTransfer(newOwnerName: string): void {
  pendingNewOwnerName = newOwnerName;
}

/** The name from the last transfer, if the page has not shown it yet. */
export function readOwnershipTransfer(): string | null {
  return pendingNewOwnerName;
}

/** Called once the returning page has shown the name. */
export function clearOwnershipTransfer(): void {
  pendingNewOwnerName = null;
}
