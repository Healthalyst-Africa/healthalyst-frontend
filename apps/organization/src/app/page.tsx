import { ORGANIZATION_ROUTES } from "~/config/routes";
import { OrganizationRegistrationForm } from "~/features/organization-registration";
import OnboardingHeroPanel from "~/components/ui/onboarding-hero-panel";
import { readProductsFromQuery } from "~/features/organization-registration/utilities/read-products-from-query";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";
import Link from "next/link";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";

/**
 * Registration. Product apps link here; `?product=` pre-selects the products
 * the visitor came for.
 */
export default async function RegistrationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { product } = await searchParams;

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
            Registration does not ask for patient records or medical
            information.
          </p>
          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link
              className="font-semibold text-primary underline underline-offset-4"
              href={ORGANIZATION_ROUTES.signIn}
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
      <OrganizationRegistrationForm
        initialProducts={readProductsFromQuery(product)}
      />
    </SplitPanelLayout>
  );
}
