import type { Metadata } from "next";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import Link from "next/link";
import OrganizationCenteredLayout from "~/components/ui/organization-centered-layout";
import { EmailVerification } from "~/features/authentication";

export const metadata: Metadata = { title: "Confirm your email address" };

export default function VerifyEmailRoute() {
  return (
    <OrganizationCenteredLayout
      pageTitle="Confirm your administrator email address"
      footerContent={
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
    </OrganizationCenteredLayout>
  );
}
