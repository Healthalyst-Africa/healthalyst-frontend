export const ORGANIZATION_APP_ROUTES = {
  registration: "/",
  signIn: "/sign-in",
  product: "healthschedule",
} as const;

export function getOrganizationAppAddress(): string | undefined {
  return process.env.NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL?.trim().replace(
    /\/$/,
    ""
  );
}
