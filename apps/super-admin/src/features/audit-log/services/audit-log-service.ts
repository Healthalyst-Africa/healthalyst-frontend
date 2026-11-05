import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import {
  AUDIT_LOG_ENDPOINTS,
  AUDIT_LOG_LIMITS,
} from "~/features/audit-log/config/audit-log";
import {
  auditChainReportSchema,
  auditEventPageSchema,
} from "~/features/audit-log/schemas/audit-log-schemas";
import type {
  AuditChainReport,
  AuditEventPage,
  AuditSearch,
} from "~/features/audit-log/types/audit-log";

export async function searchAuditEvents(
  search: AuditSearch,
  cursor?: string
): Promise<AuditEventPage> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      AUDIT_LOG_ENDPOINTS.events,
      {
        params: {
          ...search,
          limit: AUDIT_LOG_LIMITS.pageSize,
          ...(cursor ? { cursor } : {}),
        },
      }
    );
    return auditEventPageSchema.parse(response.data);
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the audit log. Try again."
    );
  }
}

/** Recomputes the fingerprints. Without an organisation, checks every chain. */
export async function checkAuditChains(
  organizationId?: string
): Promise<AuditChainReport> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      AUDIT_LOG_ENDPOINTS.chains,
      { params: organizationId ? { organizationId } : {} }
    );
    return auditChainReportSchema.parse(response.data);
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not check the audit log. Try again."
    );
  }
}
