import type { ReactNode } from "react";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import OnboardingHeroPanel from "~/features/organization-onboarding/components/onboarding-hero-panel";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";

type OrganizationSignInLayoutProperties = {
  children: ReactNode;
  footerContent?: ReactNode;
  pageTitle?: string;
  showcaseLabel?: string;
  showcaseLede?: string;
};

export default function OrganizationSignInLayout({
  children,
  footerContent,
  pageTitle = "Sign in to follow your application",
  showcaseLabel = "About organisation sign-in",
  showcaseLede = "Sign in to follow your organisation’s application.",
}: OrganizationSignInLayoutProperties) {
  return (
    <SplitPanelLayout
      className="bg-card"
      title={pageTitle}
      showcaseClassName="bg-primary text-primary-foreground"
      showcaseLabel={showcaseLabel}
      compactHeader={<HealthAlystBrand />}
      footer={footerContent}
      showcase={<OnboardingHeroPanel lede={showcaseLede} />}
    >
      {children}
    </SplitPanelLayout>
  );
}
