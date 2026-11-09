export class EnvironmentConfigurationError extends Error {
  constructor(environmentVariableName: string, expectedValue: string);
}

export function parsePlatformApiAddress(
  configuredAddress: string | undefined
): string;

export function getPlatformApiBrowserAddress(): string;

export const PRODUCT_API_ENVIRONMENT_VARIABLES: {
  readonly healthScheduleBrowserAddress: "NEXT_PUBLIC_HEALTHALYST_HEALTH_SCHEDULE_API_URL";
  readonly healthScheduleProxyTarget: "HEALTHALYST_HEALTH_SCHEDULE_API_URL";
};

export function parseProductApiAddress(
  configuredAddress: string | undefined,
  environmentVariableName: string
): string;

export function getHealthScheduleApiBrowserAddress(): string;
