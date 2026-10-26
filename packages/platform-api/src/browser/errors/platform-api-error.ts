export class PlatformApiError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
    readonly requestId: string | null,
    readonly status: number | null,
    readonly fieldErrors: Readonly<Record<string, string>>,
    cause: unknown
  ) {
    super(message, { cause });
    this.name = "PlatformApiError";
  }
}
