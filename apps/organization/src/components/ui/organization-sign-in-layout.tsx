import type { ReactNode } from "react";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import OnboardingHeroPanel from "~/features/organization-onboarding/components/onboarding-hero-panel";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";

type OrganizationSignInLayoutProperties = {
  children: ReactNode;
  footerContent?: ReactNode;
};

export default function OrganizationSignInLayout({
  children,
  footerContent,
}: OrganizationSignInLayoutProperties) {
  return (
    <SplitPanelLayout
      className="bg-card"
      title="Sign in to follow your application"
      showcaseClassName="bg-primary text-primary-foreground"
      showcaseLabel="About organisation sign-in"
      compactHeader={<HealthAlystBrand />}
      footer={footerContent}
      showcase={
        <OnboardingHeroPanel lede="Sign in to follow your organisation’s application." />
      }
    >
      {children}
    </SplitPanelLayout>
  );
}
