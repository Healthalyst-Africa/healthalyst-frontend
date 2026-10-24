export class EnvironmentConfigurationError extends Error {
  constructor(environmentVariableName: string, expectedValue: string);
}

export function parsePlatformApiAddress(
  configuredAddress: string | undefined
): string;

export function getPlatformApiBrowserAddress(): string;
