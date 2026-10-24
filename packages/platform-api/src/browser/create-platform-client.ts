import axios, { type AxiosInstance } from "axios";
import { validatePlatformApiAddress } from "./config/api-address";
import { createAccessCredentialStore } from "./session/create-access-credential-store";
import { createSessionRefresh } from "./session/create-session-refresh";
import { installBearerAuthentication } from "./interceptors/install-bearer-authentication";

/** An isolated browser transport. The backend remains the session and token authority. */
export function createPlatformClient(properties: {
  address: string;
  onSessionExpired?: () => void;
  onContextChanged?: () => void;
  httpClient?: AxiosInstance;
}) {
  const address = validatePlatformApiAddress(properties.address);
  const httpClient = properties.httpClient ?? axios.create();
  const credentialStore = createAccessCredentialStore(
    properties.onSessionExpired,
    properties.onContextChanged
  );
  const refresh = createSessionRefresh(httpClient, credentialStore);
  installBearerAuthentication({
    httpClient,
    address,
    credentialStore,
    refresh,
    platformBoundary: true,
  });

  return {
    httpClient,
    replaceAccessCredential: credentialStore.replace,
    clearSession: credentialStore.clear,
    beginSessionRestoration: credentialStore.allowRestoration,
    refreshAccessCredential: async () => {
      await refresh();
    },
    getActiveContext: () => credentialStore.read()?.activeContext ?? null,
    getIdentityEpoch: credentialStore.getIdentityEpoch,
    createProductHttpClient(
      productAddress: string,
      productClient: AxiosInstance = axios.create()
    ) {
      const validatedAddress = validatePlatformApiAddress(productAddress);
      if (validatedAddress === "/")
        throw new Error("A product API requires its own configured origin.");
      installBearerAuthentication({
        httpClient: productClient,
        address: validatedAddress,
        credentialStore,
        refresh,
        platformBoundary: false,
      });
      return productClient;
    },
  };
}

export type PlatformClient = ReturnType<typeof createPlatformClient>;
