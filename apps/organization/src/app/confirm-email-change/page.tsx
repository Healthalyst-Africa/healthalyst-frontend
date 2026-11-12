import type { Metadata } from "next";
import ConfirmEmailChange from "~/features/authentication/components/confirm-email-change";

export const metadata: Metadata = { title: "Confirm your new email address" };

export default function ConfirmEmailChangePage() {
  return <ConfirmEmailChange />;
}
