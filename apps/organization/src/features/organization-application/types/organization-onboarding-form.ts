import type { z } from "zod";
import type { organizationOnboardingFormSchema } from "~/features/organization-application/schemas/organization-onboarding-form-schema";

export type OrganizationOnboardingFormValues = z.input<
  typeof organizationOnboardingFormSchema
>;
export type OrganizationOnboardingProfile = z.output<
  typeof organizationOnboardingFormSchema
>;
