import type { z as schemaLibrary } from "zod";
import type { tokenResponseSchema } from "../../authentication/schemas/identity";

export type AccessCredential = schemaLibrary.infer<typeof tokenResponseSchema>;
