"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrganizationApplication } from "../api/platform-application-service";

export function useOrganizationApplicationQuery({
  accessToken,
  organizationId,
  userId,
}: {
  accessToken: string;
  organizationId: string | null;
  userId: string;
}) {
  return useQuery({
    queryKey: ["organization-application", userId, organizationId],
    queryFn: () => getOrganizationApplication(accessToken),
    enabled: organizationId !== null,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
