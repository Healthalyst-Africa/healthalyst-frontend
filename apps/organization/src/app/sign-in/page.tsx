import Link from "next/link";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import {
  OnboardingHeroPanel,
  SignIn,
} from "~/features/organization-onboarding";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";

export default function SignInPage() {
  return (
    <SplitPanelLayout
      className="bg-card"
      title="Sign in to follow your application"
      showcaseClassName="bg-primary text-primary-foreground"
      showcaseLabel="About organisation sign-in"
      compactHeader={<HealthAlystBrand />}
      footer={
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            New to HealthAlyst?{" "}
            <Link
              className="font-semibold text-primary underline underline-offset-4"
              href="/"
            >
              Register your organisation
            </Link>
          </p>
        </div>
      }
      showcase={
        <OnboardingHeroPanel lede="Sign in to follow your organisation’s application." />
      }
    >
      <SignIn />
    </SplitPanelLayout>
  );
}
