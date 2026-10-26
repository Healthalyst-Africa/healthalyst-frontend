import { z } from "zod";

export const sessionListSchema = z.object({
  data: z.array(
    z.object({
      id: z.string().uuid(),
      current: z.boolean(),
      userAgent: z.string().nullable(),
      createdAt: z.string().datetime(),
      lastUsedAt: z.string().datetime(),
    })
  ),
});
