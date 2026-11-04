import type { Metadata } from "next";
import { AccountSecurityPage } from "~/features/account-security/components/account-security-page";

export const metadata: Metadata = {
  title: "Account security",
  robots: { index: false, follow: false },
};

export default function AccountSecurityRoute() {
  return <AccountSecurityPage />;
}
