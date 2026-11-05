"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  platformStaffQueryKey,
  type GrantablePlatformRole,
} from "~/features/staff-management/config/staff-management";
import {
  addPlatformStaff,
  listPlatformStaff,
  removeSuperAdmin,
  replacePlatformStaffRoles,
} from "~/features/staff-management/services/staff-management-service";
import type { SuperAdminRemoval } from "~/features/staff-management/types/staff-management";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

export function usePlatformStaffQuery(staffIdentity: StaffIdentity) {
  return useQuery({
    queryKey: platformStaffQueryKey(staffIdentity.staffAccountId),
    queryFn: listPlatformStaff,
  });
}

function useRefreshPlatformStaff(staffIdentity: StaffIdentity) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: platformStaffQueryKey(staffIdentity.staffAccountId),
    });
}

export function useAddPlatformStaffMutation(staffIdentity: StaffIdentity) {
  const refreshStaff = useRefreshPlatformStaff(staffIdentity);
  return useMutation({ mutationFn: addPlatformStaff, onSuccess: refreshStaff });
}

export function useReplacePlatformStaffRolesMutation(
  staffIdentity: StaffIdentity
) {
  const refreshStaff = useRefreshPlatformStaff(staffIdentity);
  return useMutation({
    mutationFn: ({
      userId,
      roles,
    }: {
      userId: string;
      roles: readonly GrantablePlatformRole[];
    }) => replacePlatformStaffRoles(userId, roles),
    onSuccess: refreshStaff,
  });
}

export function useRemoveSuperAdminMutation(staffIdentity: StaffIdentity) {
  const refreshStaff = useRefreshPlatformStaff(staffIdentity);
  return useMutation({
    mutationFn: ({
      userId,
      removal,
    }: {
      userId: string;
      removal: SuperAdminRemoval;
    }) => removeSuperAdmin(userId, removal),
    onSuccess: refreshStaff,
  });
}
