import { z } from "zod";

/** `GET /v1/reference/states/{code}/lgas` */
export const localGovernmentAreasResponseSchema = z.object({
  state: z.object({ code: z.string(), name: z.string() }),
  data: z.array(z.string().min(1)),
});
