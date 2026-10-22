import {
  OrganizationRegistrationForm,
  OnboardingHeroPanel,
} from "~/features/organization-onboarding";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";
import Link from "next/link";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";

export default function HomePage() {
  return (
    <SplitPanelLayout
      className="bg-card"
      title="Register your organisation on HealthAlyst"
      showcaseClassName="bg-primary text-primary-foreground"
      showcaseLabel="About organisation registration"
      compactHeader={<HealthAlystBrand />}
      footer={
        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-xs leading-5 text-muted-foreground">
            This first release supports HealthSchedule registration. It does not
            request patient records or medical information.
          </p>
          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link
              className="font-semibold text-primary underline underline-offset-4"
              href="/sign-in"
            >
              Sign in
            </Link>
          </p>
        </div>
      }
      showcase={
        <OnboardingHeroPanel lede="Register your facility and create the first administrator account. HealthAlyst reviews the application before access opens." />
      }
    >
      <OrganizationRegistrationForm />
    </SplitPanelLayout>
  );
}
