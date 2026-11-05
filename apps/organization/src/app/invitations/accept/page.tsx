import type { Metadata } from "next";
import { AcceptInvitationPage } from "~/features/invitation-acceptance/components/accept-invitation-page";

export const metadata: Metadata = {
  title: "Accept your invitation",
  robots: { index: false, follow: false },
};

/** Opened from an invitation link: `/invitations/accept?token=…`. */
export default function AcceptInvitationRoute() {
  return <AcceptInvitationPage />;
}
