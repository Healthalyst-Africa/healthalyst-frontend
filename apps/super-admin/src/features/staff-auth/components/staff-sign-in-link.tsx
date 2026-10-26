import Link from "next/link";
import { APPLICATION_ROUTES } from "~/config/application-routes";

/** Footer prompt that returns staff from account recovery to sign-in. */
export function StaffSignInLink() {
  return (
    <p className="text-sm text-muted-foreground">
      Remember your password?{" "}
      <Link
        className="font-semibold text-primary underline underline-offset-4"
        href={APPLICATION_ROUTES.signIn}
      >
        Sign in
      </Link>
    </p>
  );
}
