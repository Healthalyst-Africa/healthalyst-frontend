"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPlatformBranch,
  createPlatformDepartment,
  getPlatformBranches,
  getPlatformOrganization,
  replacePlatformBranchCapabilities,
  updatePlatformBranch,
  updatePlatformDepartment,
  updatePlatformOrganization,
  type PlatformBranchCapability,
} from "../api/platform-organization-service";

const ORGANIZATION_PROFILE_QUERY_KEY = "platform-organization-profile";
const ORGANIZATION_BRANCHES_QUERY_KEY = "platform-organization-branches";

export function usePlatformOrganizationQuery({
  organizationId,
  userId,
}: {
  organizationId: string | null;
  userId: string;
}) {
  return useQuery({
    queryKey: [ORGANIZATION_PROFILE_QUERY_KEY, userId, organizationId],
    queryFn: getPlatformOrganization,
    enabled: organizationId !== null,
    retry: false,
  });
}

export function usePlatformOrganizationUpdateMutation({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityTag,
      changes,
    }: {
      entityTag: string;
      changes: Parameters<typeof updatePlatformOrganization>[1];
    }) => updatePlatformOrganization(entityTag, changes),
    onSuccess: (profile) => {
      queryClient.setQueryData(
        [ORGANIZATION_PROFILE_QUERY_KEY, userId, organizationId],
        profile
      );
    },
  });
}

export function usePlatformBranchesQuery({
  organizationId,
  userId,
}: {
  organizationId: string | null;
  userId: string;
}) {
  return useQuery({
    queryKey: [ORGANIZATION_BRANCHES_QUERY_KEY, userId, organizationId],
    queryFn: getPlatformBranches,
    enabled: organizationId !== null,
    retry: false,
  });
}

function useRefreshPlatformBranches(userId: string, organizationId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: [ORGANIZATION_BRANCHES_QUERY_KEY, userId, organizationId],
    });
}

export function usePlatformBranchCreateMutation({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const refreshBranches = useRefreshPlatformBranches(userId, organizationId);
  return useMutation({
    mutationFn: (branch: { name: string; slug?: string }) =>
      createPlatformBranch(branch),
    onSuccess: refreshBranches,
  });
}

export function usePlatformBranchUpdateMutation({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const refreshBranches = useRefreshPlatformBranches(userId, organizationId);
  return useMutation({
    mutationFn: ({
      branchId,
      changes,
    }: {
      branchId: string;
      changes: Parameters<typeof updatePlatformBranch>[1];
    }) => updatePlatformBranch(branchId, changes),
    onSuccess: refreshBranches,
  });
}

export function usePlatformBranchCapabilitiesMutation({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const refreshBranches = useRefreshPlatformBranches(userId, organizationId);
  return useMutation({
    mutationFn: ({
      branchId,
      capabilities,
    }: {
      branchId: string;
      capabilities: PlatformBranchCapability[];
    }) => replacePlatformBranchCapabilities(branchId, capabilities),
    onSuccess: refreshBranches,
  });
}

export function usePlatformDepartmentCreateMutation({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const refreshBranches = useRefreshPlatformBranches(userId, organizationId);
  return useMutation({
    mutationFn: ({
      branchId,
      department,
    }: {
      branchId: string;
      department: { name: string; code: string };
    }) => createPlatformDepartment(branchId, department),
    onSuccess: refreshBranches,
  });
}

export function usePlatformDepartmentUpdateMutation({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const refreshBranches = useRefreshPlatformBranches(userId, organizationId);
  return useMutation({
    mutationFn: ({
      departmentId,
      changes,
    }: {
      departmentId: string;
      changes: Parameters<typeof updatePlatformDepartment>[1];
    }) => updatePlatformDepartment(departmentId, changes),
    onSuccess: refreshBranches,
  });
}
