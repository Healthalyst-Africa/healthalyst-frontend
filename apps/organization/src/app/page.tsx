import type { Metadata } from "next";
import OrganizationRegistrationLayout from "~/components/ui/organization-registration-layout";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { OrganizationRegistrationForm } from "~/features/organization-registration";
import { readProductsFromQuery } from "~/shared/organization/utilities/read-products-from-query";
import Link from "next/link";

// The layout template only reaches nested routes, so this title is written in full.
export const metadata: Metadata = {
  title: { absolute: "Register your organisation | HealthAlyst" },
};

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
    <OrganizationRegistrationLayout
      pageTitle="Register your organisation on HealthAlyst"
      showcaseLabel="About organisation registration"
      showcaseLede="Register your facility and create the first administrator account. HealthAlyst reviews the application before access opens."
      footerContent={
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
    >
      <OrganizationRegistrationForm
        initialProducts={readProductsFromQuery(product)}
      />
    </OrganizationRegistrationLayout>
  );
}
