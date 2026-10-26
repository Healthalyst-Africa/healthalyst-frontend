"use client";

import { useMutation } from "@tanstack/react-query";
import { registerOrganizationOnPlatform } from "~/features/organization-registration/services/organization-registration-service";
export function useOrganizationRegistrationMutation() {
  return useMutation({ mutationFn: registerOrganizationOnPlatform });
}
