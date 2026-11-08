import { z } from "zod";

/** The fields HealthSchedule needs from `GET /v1/organization/branches`. */
export const workspaceBranchSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
});

export const workspaceBranchListSchema = z.object({
  data: z.array(workspaceBranchSchema),
});

export type WorkspaceBranch = z.infer<typeof workspaceBranchSchema>;
