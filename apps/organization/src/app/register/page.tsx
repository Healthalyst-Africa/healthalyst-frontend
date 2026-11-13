import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import OrganizationRegistrationLayout from "~/components/ui/organization-registration-layout";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { PartnerInvitationLanding } from "~/features/partner-network/components/partner-invitation-landing";

export const metadata: Metadata = {
  title: { absolute: "Join a partner on HealthAlyst | HealthAlyst" },
  robots: { index: false, follow: false },
};

/**
 * Partner invitation emails link here with `?partnerInvitation=`. Without
 * one, this is ordinary registration.
 */
export default async function PartnerInvitationRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { partnerInvitation } = await searchParams;
  const invitationToken =
    typeof partnerInvitation === "string" ? partnerInvitation.trim() : "";
  if (!invitationToken) redirect(ORGANIZATION_ROUTES.registration);

  return (
    <OrganizationRegistrationLayout
      pageTitle="You are invited to work together on HealthAlyst"
      showcaseLabel="About partner invitations"
      showcaseLede="Register your facility and create the first administrator account. Once HealthAlyst approves it, the partnership request is waiting for you to accept."
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
      <PartnerInvitationLanding invitationToken={invitationToken} />
    </OrganizationRegistrationLayout>
  );
}
