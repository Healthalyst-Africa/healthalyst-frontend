export const ORGANIZATION_ONBOARDING_STEPS = [
  {
    identifier: "details",
    title: "Organisation details",
    description: "Facility, contact and address details",
  },
  {
    identifier: "verification",
    title: "Account verification",
    description: "Complete remaining account checks",
  },
  {
    identifier: "documents",
    title: "Supporting documents",
    description: "Registration and facility documents",
  },
  {
    identifier: "review",
    title: "Submit for review",
    description: "HealthAlyst reviews your organisation before access opens",
  },
] as const;

export type OrganizationOnboardingStepIdentifier =
  (typeof ORGANIZATION_ONBOARDING_STEPS)[number]["identifier"];
