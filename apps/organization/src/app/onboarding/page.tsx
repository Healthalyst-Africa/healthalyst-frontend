import type { Metadata } from "next";
import OrganizationOnboardingPage from "~/features/organization-application/components/organization-onboarding-page";

export const metadata: Metadata = {
  title: "Your organisation",
  robots: { index: false, follow: false },
};

export default function OnboardingRoute() {
  return <OrganizationOnboardingPage />;
}
