export const applicationStatusQueryKeys = {
  application: (sessionIdentifier: string) =>
    ["organization-registration", "mine", sessionIdentifier] as const,
  evidenceRequests: (sessionIdentifier: string) =>
    [
      "organization-registration",
      "evidence-requests",
      sessionIdentifier,
    ] as const,
};
