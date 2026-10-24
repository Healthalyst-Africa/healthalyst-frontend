export class PlatformApiConfigurationError extends Error {
  constructor() {
    super(
      "Set NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL to the Platform API origin, or / when using the configured /v1 proxy."
    );
    this.name = "PlatformApiConfigurationError";
  }
}
