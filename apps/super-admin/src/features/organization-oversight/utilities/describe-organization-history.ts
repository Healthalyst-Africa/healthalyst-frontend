import { APPLICATION_STATUS_PRESENTATION } from "~/features/organization-oversight/config/organization-application-table";
import { ORGANIZATION_HISTORY_DATE_FORMATTER } from "~/features/organization-oversight/config/organization-lifecycle";
import type { OrganizationDetail } from "~/features/organization-oversight/types/organization-types";

type HistoryDetail = { label: string; value: string };

/**
 * History entries for display, newest first. The API records an internal
 * note as an entry whose status does not change, and keeps a status change's
 * reason in `message` or `internalNote` depending on the action.
 */
export function describeOrganizationHistory(
  history: OrganizationDetail["history"]
) {
  return [...history]
    .sort((firstEntry, secondEntry) =>
      secondEntry.createdAt.localeCompare(firstEntry.createdAt)
    )
    .map((historyEntry, entryIndex) => {
      const isInternalNote = historyEntry.fromStatus === historyEntry.toStatus;
      const details: HistoryDetail[] = [];
      if (isInternalNote) {
        if (historyEntry.internalNote) {
          details.push({ label: "Note", value: historyEntry.internalNote });
        }
      } else {
        if (historyEntry.message) {
          details.push({ label: "Reason", value: historyEntry.message });
        }
        if (historyEntry.internalNote) {
          details.push({
            label: historyEntry.message ? "Internal note" : "Reason",
            value: historyEntry.internalNote,
          });
        }
      }
      return {
        key: `${historyEntry.createdAt}-${entryIndex}`,
        title: isInternalNote
          ? "Internal note"
          : APPLICATION_STATUS_PRESENTATION[historyEntry.toStatus].label,
        dateTime: historyEntry.createdAt,
        dateLabel: ORGANIZATION_HISTORY_DATE_FORMATTER.format(
          new Date(historyEntry.createdAt)
        ),
        details,
      };
    });
}
