export const organizationQueryKeys = {
  all: (staffAccountId: string) =>
    ["platform-staff", staffAccountId, "organizations"] as const,
  search: (staffAccountId: string, searchTerm: string) =>
    ["platform-staff", staffAccountId, "organizations", searchTerm] as const,
  reviewQueue: (staffAccountId: string) =>
    ["platform-staff", staffAccountId, "review-queue"] as const,
  detail: (staffAccountId: string, organizationId: string) =>
    ["platform-staff", staffAccountId, "organization", organizationId] as const,
};
