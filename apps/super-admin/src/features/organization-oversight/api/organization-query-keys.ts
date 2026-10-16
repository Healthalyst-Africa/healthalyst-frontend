export const organizationQueryKeys = {
  all: (staffAccountId: string) =>
    ["staff", staffAccountId, "organizations"] as const,
  reviewQueue: (staffAccountId: string) =>
    ["staff", staffAccountId, "review-queue"] as const,
  evidence: (staffAccountId: string, applicationId: string) =>
    ["staff", staffAccountId, "evidence", applicationId] as const,
};
