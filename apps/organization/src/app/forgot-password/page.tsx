import type { Metadata } from "next";
import ForgotPassword from "~/features/authentication/components/forgot-password";

export const metadata: Metadata = { title: "Forgot your password" };

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
