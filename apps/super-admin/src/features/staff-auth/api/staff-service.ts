import { isAxiosError } from "axios";
import { z } from "zod";
import { getStaffHttpClient } from "~/features/staff-auth/api/staff-http-client";

const staffIdentitySchema = z.object({
  staffAccountId: z.uuid(),
  fullName: z.string(),
  emailAddress: z.email(),
  role: z.literal("SUPER_ADMIN"),
});

const staffSignInResponseSchema = z.object({
  expiresInSeconds: z.number().positive(),
  staff: staffIdentitySchema,
});

export type StaffIdentity = z.infer<typeof staffIdentitySchema>;

export function explainStaffApiError(error: unknown, fallback: string): Error {
  if (!isAxiosError(error))
    return error instanceof Error ? error : new Error(fallback);
  if (error.response?.status === 401)
    return new Error("Your staff session has expired. Sign in again.");
  if (error.response?.status === 403)
    return new Error("Your account cannot perform this action.");
  if (error.response?.status === 409)
    return new Error("This application changed. Refresh and try again.");
  if (!error.response)
    return new Error(
      "HealthAlyst could not be reached. Check the connection and try again."
    );
  const responseMessage = error.response.data as unknown;
  if (
    typeof responseMessage === "object" &&
    responseMessage !== null &&
    "message" in responseMessage &&
    typeof responseMessage.message === "string"
  ) {
    return new Error(responseMessage.message);
  }
  return new Error(fallback);
}

export async function createStaffSession(
  emailAddress: string,
  password: string
): Promise<StaffIdentity> {
  try {
    const response = await getStaffHttpClient().post<unknown>(
      "/api/v1/staff/auth/session",
      { emailAddress, password }
    );
    return staffSignInResponseSchema.parse(response.data).staff;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      throw new Error("Email or password is incorrect.", { cause: error });
    }
    throw explainStaffApiError(error, "We could not sign you in. Try again.");
  }
}

export async function getCurrentStaffIdentity(): Promise<StaffIdentity> {
  try {
    const response = await getStaffHttpClient().get<unknown>(
      "/api/v1/staff/auth/me"
    );
    return staffIdentitySchema.parse(response.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      throw error;
    }
    throw explainStaffApiError(
      error,
      "We could not restore your staff session."
    );
  }
}

export async function endStaffSession(): Promise<void> {
  try {
    await getStaffHttpClient().post("/api/v1/staff/auth/sign-out");
  } catch (error) {
    throw explainStaffApiError(
      error,
      "We could not end this session. Try again."
    );
  }
}
