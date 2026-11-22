import { z } from "zod";

const workspaceDepartmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
});

/** The fields HealthSchedule needs from `GET /v1/organization/branches`. */
export const workspaceBranchSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  /** Where patients can be sent within the branch, such as the laboratory. */
  departments: z.array(workspaceDepartmentSchema).default([]),
});

export const workspaceBranchListSchema = z.object({
  data: z.array(workspaceBranchSchema),
});

export type WorkspaceBranch = z.infer<typeof workspaceBranchSchema>;
export type WorkspaceDepartment = z.infer<typeof workspaceDepartmentSchema>;
