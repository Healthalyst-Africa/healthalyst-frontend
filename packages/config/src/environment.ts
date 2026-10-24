import { z as schemaLibrary } from "zod";
import { EnvironmentConfigurationError } from "./platform-api-environment.mjs";

export const FRONTEND_ENVIRONMENT_VARIABLES = {
  organizationApplicationAddress:
    "NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL",
  superAdminApplicationAddress: "NEXT_PUBLIC_HEALTHALYST_SUPER_ADMIN_APP_URL",
  turnstileSiteKey: "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
} as const;

const applicationOriginSchema = schemaLibrary
  .string()
  .url()
  .superRefine((configuredAddress, validationContext) => {
    const parsedAddress = new URL(configuredAddress);
    const isLocalAddress = ["localhost", "127.0.0.1", "[::1]"].includes(
      parsedAddress.hostname
    );
    const isAllowedProtocol =
      parsedAddress.protocol === "https:" ||
      (isLocalAddress && parsedAddress.protocol === "http:");

    if (
      !isAllowedProtocol ||
      parsedAddress.username ||
      parsedAddress.password ||
      parsedAddress.pathname !== "/" ||
      parsedAddress.search ||
      parsedAddress.hash
    ) {
      validationContext.addIssue({
        code: "custom",
        message:
          "Use an HTTPS application origin, or an HTTP localhost origin, without a path or credentials.",
      });
    }
  })
  .transform((configuredAddress) => new URL(configuredAddress).origin);

const turnstileSiteKeySchema = schemaLibrary.string().trim().min(1);

function parseOptionalApplicationOrigin(
  configuredAddress: string | undefined,
  environmentVariableName: string
): string | undefined {
  const normalizedAddress = configuredAddress?.trim();
  if (!normalizedAddress) return undefined;

  const parsedAddress = applicationOriginSchema.safeParse(normalizedAddress);
  if (!parsedAddress.success) {
    throw new EnvironmentConfigurationError(
      environmentVariableName,
      "must be an HTTPS application origin, or an HTTP localhost origin, without a path or credentials."
    );
  }

  return parsedAddress.data;
}

export function getOrganizationHubAddress(): string | undefined {
  return parseOptionalApplicationOrigin(
    process.env.NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL,
    FRONTEND_ENVIRONMENT_VARIABLES.organizationApplicationAddress
  );
}

export function getSuperAdminApplicationAddress(): string | undefined {
  return parseOptionalApplicationOrigin(
    process.env.NEXT_PUBLIC_HEALTHALYST_SUPER_ADMIN_APP_URL,
    FRONTEND_ENVIRONMENT_VARIABLES.superAdminApplicationAddress
  );
}

export function getOrganizationRegistrationSiteKey(): string | undefined {
  const configuredSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!configuredSiteKey) return undefined;

  const parsedSiteKey = turnstileSiteKeySchema.safeParse(configuredSiteKey);
  if (!parsedSiteKey.success) {
    throw new EnvironmentConfigurationError(
      FRONTEND_ENVIRONMENT_VARIABLES.turnstileSiteKey,
      "must be a non-empty public Turnstile site key."
    );
  }

  return parsedSiteKey.data;
}
