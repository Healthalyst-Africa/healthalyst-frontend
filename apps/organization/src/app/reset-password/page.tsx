import type { Metadata } from "next";
import ResetPassword from "~/features/authentication/components/reset-password";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
