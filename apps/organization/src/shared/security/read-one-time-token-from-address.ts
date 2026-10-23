/** Read a one-time token from the query or fragment, then remove it from the address bar. */
export function readOneTimeTokenFromAddress(): string | null {
  const address = new URL(window.location.href);
  const queryToken = address.searchParams.get("token");
  address.searchParams.delete("token");

  const originalHashParameters = address.hash.slice(1);
  const hasHashParameters = originalHashParameters.includes("=");
  const hashParameters = new URLSearchParams(
    hasHashParameters ? originalHashParameters : ""
  );
  const hashToken = hasHashParameters ? hashParameters.get("token") : null;
  hashParameters.delete("token");

  const remainingHashParameters = hashParameters.toString();
  const remainingHash = hasHashParameters
    ? remainingHashParameters
      ? `#${remainingHashParameters}`
      : ""
    : address.hash;
  const token = queryToken ?? hashToken;

  if (queryToken !== null || hashToken !== null) {
    window.history.replaceState(
      null,
      "",
      `${address.pathname}${address.search}${remainingHash}`
    );
  }

  return token;
}
