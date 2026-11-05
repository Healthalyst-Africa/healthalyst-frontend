import { WORKSPACE_NAVIGATION } from "~/features/staff-workspace/config/workspace-navigation";

/** The staff app pages this person's platform roles let them open. */
export function filterWorkspaceNavigation(platformRoles: readonly string[]) {
  return WORKSPACE_NAVIGATION.filter(
    (navigationItem) =>
      !("roles" in navigationItem) ||
      navigationItem.roles.some((role) => platformRoles.includes(role))
  ).map(({ label, href, icon }) => ({ label, href, icon }));
}
