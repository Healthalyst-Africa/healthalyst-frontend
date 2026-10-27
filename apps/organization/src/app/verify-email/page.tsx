import type { Metadata } from "next";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import Link from "next/link";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";
import { EmailVerification } from "~/features/authentication";
import OnboardingHeroPanel from "~/components/ui/onboarding-hero-panel";

export const metadata: Metadata = { title: "Confirm your email address" };

export default function VerifyEmailRoute() {
  return (
    <SplitPanelLayout
      className="bg-card"
      title="Confirm your administrator email address"
      showcaseClassName="bg-primary text-primary-foreground"
      showcaseLabel="About HealthAlyst"
      compactHeader={<HealthAlystBrand />}
      showcase={
        <OnboardingHeroPanel lede="Confirm your email address to continue setting up your organisation." />
      }
      footer={
        <p className="text-sm text-muted-foreground">
          Already confirmed?{" "}
          <Link
            className="font-semibold text-primary underline underline-offset-4"
            href={ORGANIZATION_ROUTES.signIn}
          >
            Sign in
          </Link>
        </p>
      }
    >
      <EmailVerification />
    </SplitPanelLayout>
  );
}
