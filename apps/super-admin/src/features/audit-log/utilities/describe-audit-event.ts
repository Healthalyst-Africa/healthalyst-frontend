import { AUDIT_ACTOR_TYPE_LABELS } from "~/features/audit-log/config/audit-log";
import type { AuditEvent } from "~/features/audit-log/types/audit-log";

export function describeActor(auditEvent: AuditEvent): string {
  return (
    auditEvent.actor?.name || AUDIT_ACTOR_TYPE_LABELS[auditEvent.actorType]
  );
}

export function describeOrganization(auditEvent: AuditEvent): string {
  return auditEvent.organization?.name || "Outside any organisation";
}

/** Shows a metadata value as readable text, keeping nested values as JSON. */
export function describeMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
