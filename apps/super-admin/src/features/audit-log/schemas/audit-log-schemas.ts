import { z as schemaLibrary } from "zod";
import {
  AUDIT_ACTION_PATTERN,
  AUDIT_LOG_LIMITS,
  AUDIT_TIME_ZONE_OFFSET,
} from "~/features/audit-log/config/audit-log";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const auditEventSchema = schemaLibrary.object({
  id: schemaLibrary.uuid(),
  occurredAt: schemaLibrary.iso.datetime({ offset: true }),
  organization: schemaLibrary
    .object({ id: schemaLibrary.string(), name: schemaLibrary.string() })
    .nullable(),
  actor: schemaLibrary
    .object({
      id: schemaLibrary.string(),
      name: schemaLibrary.string(),
      email: schemaLibrary.string().nullable(),
    })
    .nullable(),
  actorType: schemaLibrary.enum([
    "USER",
    "PLATFORM_STAFF",
    "SERVICE",
    "SYSTEM",
  ]),
  action: schemaLibrary.string(),
  resourceType: schemaLibrary.string(),
  resourceId: schemaLibrary.string().nullable(),
  outcome: schemaLibrary.enum(["SUCCESS", "FAILURE"]),
  requestId: schemaLibrary.string().nullable(),
  ipAddress: schemaLibrary.string().nullable(),
  metadata: schemaLibrary.record(
    schemaLibrary.string(),
    schemaLibrary.unknown()
  ),
});

export const auditEventPageSchema = schemaLibrary.object({
  data: schemaLibrary.array(auditEventSchema),
  page: schemaLibrary.object({
    nextCursor: schemaLibrary.string().nullable(),
    hasMore: schemaLibrary.boolean(),
  }),
});

export const auditChainReportSchema = schemaLibrary.object({
  intact: schemaLibrary.boolean(),
  chains: schemaLibrary.number().int(),
  rows: schemaLibrary.number().int(),
  problems: schemaLibrary.array(
    schemaLibrary.object({
      chain: schemaLibrary.string(),
      problem: schemaLibrary.enum([
        "EDITED",
        "BROKEN_LINK",
        "FORK",
        "EXTRA_START",
        "HEAD",
      ]),
      eventId: schemaLibrary.string().nullable(),
      detail: schemaLibrary.string(),
    })
  ),
});

/** Turns a chosen calendar day into the start or end of that day in Lagos. */
export function toAuditBoundary(day: string, edge: "start" | "end"): string {
  return `${day}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}${AUDIT_TIME_ZONE_OFFSET}`;
}

/** The filters as typed; empty strings mean "not filtered". */
export const auditFilterFormSchema = schemaLibrary
  .object({
    organizationId: schemaLibrary.string(),
    actorUserId: schemaLibrary.string(),
    action: schemaLibrary
      .string()
      .trim()
      .toLowerCase()
      .max(
        AUDIT_LOG_LIMITS.actionMaximumLength,
        `Keep the action to ${AUDIT_LOG_LIMITS.actionMaximumLength} characters or fewer.`
      )
      .refine(
        (action) => action === "" || AUDIT_ACTION_PATTERN.test(action),
        "Use lowercase words joined by dots, such as organization.approved. End with a dot to match every action that starts with it."
      ),
    fromDay: schemaLibrary.string(),
    toDay: schemaLibrary.string(),
  })
  .superRefine((filters, context) => {
    if (!filters.fromDay || !filters.toDay) return;
    const from = Date.parse(toAuditBoundary(filters.fromDay, "start"));
    const to = Date.parse(toAuditBoundary(filters.toDay, "end"));
    if (to < from) {
      context.addIssue({
        code: "custom",
        path: ["toDay"],
        message: "Choose an end date on or after the start date.",
      });
    } else if (
      (to - from) / MILLISECONDS_PER_DAY >
      AUDIT_LOG_LIMITS.maximumRangeDays
    ) {
      context.addIssue({
        code: "custom",
        path: ["toDay"],
        message: `Search at most ${AUDIT_LOG_LIMITS.maximumRangeDays} days at a time.`,
      });
    }
  });
