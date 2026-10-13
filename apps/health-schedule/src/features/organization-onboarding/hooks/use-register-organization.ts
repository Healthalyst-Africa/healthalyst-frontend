"use client";

import { useMutation } from "@tanstack/react-query";
import { registerOrganization } from "../api/accounts-service";

export function useRegisterOrganizationMutation() {
  return useMutation({ mutationFn: registerOrganization });
}
