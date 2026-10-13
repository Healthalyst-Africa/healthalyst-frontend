export const applicationStatusQueryKeys = {
  application: (sessionIdentifier: string) =>
    ["organization-registration", "mine", sessionIdentifier] as const,
};
