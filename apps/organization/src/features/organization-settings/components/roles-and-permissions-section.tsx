import Link from "next/link";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { ORGANIZATION_ROUTES } from "~/config/routes";

/** Where roles and their permissions are managed, from organisation settings. */
export function RolesAndPermissionsSection() {
  return (
    <ContentPanel
      heading="Roles and permissions"
      headingLevel={2}
      description="A role is a set of permissions, such as Doctor or Front desk. Change what each role can do, or add a role for your organisation."
    >
      <Link
        href={ORGANIZATION_ROUTES.teamRoles}
        className="w-fit rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Manage roles and permissions
      </Link>
    </ContentPanel>
  );
}
