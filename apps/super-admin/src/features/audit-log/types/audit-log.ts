import type { z as schemaLibrary } from "zod";
import type {
  auditChainReportSchema,
  auditEventPageSchema,
  auditEventSchema,
} from "~/features/audit-log/schemas/audit-log-schemas";

export type AuditEvent = schemaLibrary.infer<typeof auditEventSchema>;
export type AuditEventPage = schemaLibrary.infer<typeof auditEventPageSchema>;
export type AuditChainReport = schemaLibrary.infer<
  typeof auditChainReportSchema
>;

/** A validated search, ready for the API. Absent values are not filtered. */
export type AuditSearch = {
  organizationId?: string;
  actorUserId?: string;
  action?: string;
  from?: string;
  to?: string;
};
