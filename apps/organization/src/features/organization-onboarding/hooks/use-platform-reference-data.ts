"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPlatformNigerianStates,
  getPlatformOrganizationTypes,
} from "../api/platform-onboarding-service";

export function usePlatformOrganizationTypesQuery() {
  return useQuery({
    queryKey: ["platform-reference", "organization-types"],
    queryFn: getPlatformOrganizationTypes,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function usePlatformNigerianStatesQuery() {
  return useQuery({
    queryKey: ["platform-reference", "nigerian-states"],
    queryFn: getPlatformNigerianStates,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
