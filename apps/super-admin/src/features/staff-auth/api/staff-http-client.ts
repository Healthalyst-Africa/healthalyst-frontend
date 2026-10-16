import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

let staffHttpClient: AxiosInstance | undefined;
let staffCsrfToken: string | undefined;
let staffCsrfTokenRequest: Promise<string> | undefined;

const staffCsrfResponseSchema = z.object({
  headerName: z.literal("X-XSRF-TOKEN"),
  token: z.string().min(1),
});

export function getStaffHttpClient(): AxiosInstance {
  if (staffHttpClient) return staffHttpClient;
  const baseURL = process.env.NEXT_PUBLIC_HEALTHALYST_API_URL;
  if (!baseURL) {
    throw new Error(
      "Super Admin API is not configured. Set NEXT_PUBLIC_HEALTHALYST_API_URL."
    );
  }
  staffHttpClient = axios.create({
    baseURL,
    timeout: 15000,
    withCredentials: true,
  });
  staffHttpClient.interceptors.request.use(async (requestConfiguration) => {
    const requestMethod = requestConfiguration.method?.toLowerCase();
    if (["post", "put", "patch", "delete"].includes(requestMethod ?? "")) {
      const csrfToken = await getStaffCsrfToken();
      requestConfiguration.headers.set("X-XSRF-TOKEN", csrfToken);
    }
    return requestConfiguration;
  });
  staffHttpClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        !error.config?.url?.endsWith("/api/v1/staff/auth/session") &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(new Event("healthalyst-staff-session-expired"));
      }
      return Promise.reject(error);
    }
  );
  return staffHttpClient;
}

async function getStaffCsrfToken(): Promise<string> {
  if (staffCsrfToken) return staffCsrfToken;
  if (staffCsrfTokenRequest) return staffCsrfTokenRequest;
  staffCsrfTokenRequest = getStaffHttpClient()
    .get<unknown>("/api/v1/staff/auth/csrf")
    .then((response) => {
      staffCsrfToken = staffCsrfResponseSchema.parse(response.data).token;
      return staffCsrfToken;
    })
    .finally(() => {
      staffCsrfTokenRequest = undefined;
    });
  return staffCsrfTokenRequest;
}
