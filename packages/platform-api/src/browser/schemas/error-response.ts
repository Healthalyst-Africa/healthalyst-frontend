import { z } from "zod";

/*
 * Every Platform API error has the body
 * `{ error: { code, message, requestId, details? } }`. A `422 VALIDATION_FAILED`
 * lists the rejected fields in `details` as `{ path, issue, message }`.
 */
export const platformErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    details: z.unknown().optional(),
  }),
});

export const fieldIssueSchema = z.object({
  path: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
  message: z.string(),
});
