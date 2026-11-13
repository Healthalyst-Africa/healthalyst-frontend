import type { ReactNode } from "react";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import OnboardingHeroPanel from "~/components/ui/onboarding-hero-panel";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";

type OrganizationSignInLayoutProperties = {
  children: ReactNode;
  footerContent?: ReactNode;
};

/**
 * The sign-in form beside the HealthAlyst showcase. Only sign-in and
 * registration show the showcase; other account pages use
 * `OrganizationCenteredLayout`.
 */
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
