export class PlatformApiConfigurationError extends Error {
  constructor() {
    super(
      "The same-origin HealthAlyst Platform session service is unavailable."
    );
    this.name = "PlatformApiConfigurationError";
  }
}
