"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getHealthScheduleOrganization,
  PRODUCT_AVAILABILITY_QUERY_KEYS,
} from "~/features/product-access/services/product-availability-service";

/** HealthSchedule's own confirmation that the organisation can open it. */
export function useProductAvailability(organizationId: string) {
  return useQuery({
    queryKey: PRODUCT_AVAILABILITY_QUERY_KEYS.organization(organizationId),
    queryFn: getHealthScheduleOrganization,
  });
}
