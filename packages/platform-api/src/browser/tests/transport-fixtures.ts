import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { createPlatformClient } from "../create-platform-client";

export const ORGANIZATION_IDENTIFIER = "00000000-0000-4000-8000-000000000002";

export function createCredential(accessToken = "test-access-credential") {
  return {
    accessToken,
    tokenType: "Bearer" as const,
    expiresIn: 600,
    activeContext: {
      realm: "TENANT" as const,
      organizationId: ORGANIZATION_IDENTIFIER,
      branchId: null,
    },
  };
}

export function respond(
  requestConfiguration: InternalAxiosRequestConfig,
  data: unknown,
  status = 200
) {
  const response = {
    data,
    status,
    statusText: String(status),
    headers: new AxiosHeaders(),
    config: requestConfiguration,
  };
  if (status >= 400)
    throw new AxiosError(
      "Request failed",
      "ERR_BAD_RESPONSE",
      requestConfiguration,
      undefined,
      response
    );
  return response;
}

export function errorBody(code: string) {
  return {
    error: {
      code,
      message: "Request could not be completed.",
      requestId: "test-request",
    },
  };
}

export function createTransportFixture(
  handler: (
    requestConfiguration: InternalAxiosRequestConfig
  ) => unknown | Promise<unknown>,
  properties: {
    onSessionExpired?: () => void;
    onContextChanged?: () => void;
  } = {}
) {
  const requests: InternalAxiosRequestConfig[] = [];
  const httpClient: AxiosInstance = axios.create({
    adapter: async (requestConfiguration) => {
      requests.push(requestConfiguration);
      return respond(requestConfiguration, await handler(requestConfiguration));
    },
  });
  const transport = createPlatformClient({
    address: "https://platform.example.test",
    httpClient,
    ...properties,
  });
  return { ...transport, requests };
}
