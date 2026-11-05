import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import {
  STAFF_MANAGEMENT_ENDPOINTS,
  type GrantablePlatformRole,
} from "~/features/staff-management/config/staff-management";
import {
  addedPlatformStaffMemberSchema,
  platformStaffListSchema,
  platformStaffMemberSchema,
} from "~/features/staff-management/schemas/staff-management-schemas";
import type {
  AddedPlatformStaffMember,
  NewPlatformStaffMember,
  PlatformStaffMember,
  SuperAdminRemoval,
} from "~/features/staff-management/types/staff-management";

async function runPlatformRequest<ResponseType>(
  fallbackMessage: string,
  request: () => Promise<ResponseType>
): Promise<ResponseType> {
  try {
    return await request();
  } catch (error) {
    throw toPlatformApiError(error, fallbackMessage);
  }
}

export function listPlatformStaff(): Promise<PlatformStaffMember[]> {
  return runPlatformRequest(
    "We could not load HealthAlyst staff. Try again.",
    async () => {
      const response = await getPlatformHttpClient().get<unknown>(
        STAFF_MANAGEMENT_ENDPOINTS.staff
      );
      return platformStaffListSchema.parse(response.data).data;
    }
  );
}

export function addPlatformStaff(
  newStaffMember: NewPlatformStaffMember
): Promise<AddedPlatformStaffMember> {
  return runPlatformRequest(
    "We could not add this staff member. Try again.",
    async () => {
      const response = await getPlatformHttpClient().post<unknown>(
        STAFF_MANAGEMENT_ENDPOINTS.staff,
        newStaffMember
      );
      return addedPlatformStaffMemberSchema.parse(response.data);
    }
  );
}

export function replacePlatformStaffRoles(
  userId: string,
  roles: readonly GrantablePlatformRole[]
): Promise<PlatformStaffMember> {
  return runPlatformRequest(
    "We could not save these roles. Try again.",
    async () => {
      const response = await getPlatformHttpClient().put<unknown>(
        STAFF_MANAGEMENT_ENDPOINTS.roles(userId),
        { roles }
      );
      return platformStaffMemberSchema.parse(response.data);
    }
  );
}

export function removeSuperAdmin(
  userId: string,
  removal: SuperAdminRemoval
): Promise<PlatformStaffMember> {
  return runPlatformRequest(
    "We could not remove this super admin. Try again.",
    async () => {
      const response = await getPlatformHttpClient().post<unknown>(
        STAFF_MANAGEMENT_ENDPOINTS.removeSuperAdmin(userId),
        removal
      );
      return platformStaffMemberSchema.parse(response.data);
    }
  );
}
