import type { z } from "zod";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";

/** Validates a HealthSchedule or Platform response before a screen uses it. */
export function parseScheduleResponse<ResponseSchema extends z.ZodType>(
  schema: ResponseSchema,
  data: unknown,
  status: number
): z.infer<ResponseSchema> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new PlatformApiError(
      "HealthSchedule sent a response we did not recognise. Try again.",
      "INVALID_HEALTH_SCHEDULE_RESPONSE",
      null,
      status,
      {},
      parsed.error
    );
  }
  return parsed.data;
}
