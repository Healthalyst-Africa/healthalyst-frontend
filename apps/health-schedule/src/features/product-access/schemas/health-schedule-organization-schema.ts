import { z } from "zod";

/** `GET /v1/organization` on the HealthSchedule API. */
export const healthScheduleOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  stateCode: z.string(),
  products: z.array(z.string()),
});

export type HealthScheduleOrganization = z.infer<
  typeof healthScheduleOrganizationSchema
>;
