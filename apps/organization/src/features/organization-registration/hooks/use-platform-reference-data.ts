"use client";

import { REGISTRATION_REFERENCE_CONFIGURATION } from "~/features/organization-registration/config/platform-registration";
import { useQuery } from "@tanstack/react-query";
import {
  getPlatformNigerianStates,
  getPlatformOrganizationTypes,
} from "~/features/organization-registration/services/organization-registration-service";

export function usePlatformOrganizationTypesQuery() {
  return useQuery({
    queryKey: [
      REGISTRATION_REFERENCE_CONFIGURATION.queryNamespace,
      "organization-types",
    ],
    queryFn: getPlatformOrganizationTypes,
    staleTime:
      REGISTRATION_REFERENCE_CONFIGURATION.organizationTypesStaleTimeMilliseconds,
    retry: false,
  });
}

export function usePlatformNigerianStatesQuery() {
  return useQuery({
    queryKey: [
      REGISTRATION_REFERENCE_CONFIGURATION.queryNamespace,
      "nigerian-states",
    ],
    queryFn: getPlatformNigerianStates,
    staleTime: REGISTRATION_REFERENCE_CONFIGURATION.statesStaleTimeMilliseconds,
    retry: false,
  });
}
