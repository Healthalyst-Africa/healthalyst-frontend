"use client";

import { useState } from "react";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { ResultSheet } from "~/features/orders/components/result-sheet";
import { ORDER_PERMISSIONS } from "~/features/orders/config/orders";
import { useResultsInbox } from "~/features/orders/hooks/use-orders";
import type { ResultsInboxItem } from "~/features/orders/schemas/order-response-schemas";
import { describeResultFlags } from "~/features/orders/utilities/order-rules";
import { describeBranchDateTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

function describePatientName(item: ResultsInboxItem): string {
  return `${item.patient.firstName} ${item.patient.lastName}`;
}

const COLUMNS: readonly DataTableColumn<ResultsInboxItem>[] = [
  {
    key: "patient",
    label: "Patient",
    size: "wide",
    getCell: (item) => ({
      kind: "text",
      primary: describePatientName(item),
      secondary: item.patient.patientNumber,
    }),
  },
  {
    key: "test",
    label: "Test or scan",
    getCell: (item) => ({
      kind: "text",
      primary: item.serviceName,
      secondary: item.result?.amended ? "Amended after release" : undefined,
    }),
  },
  {
    key: "released",
    label: "Released",
    size: "compact",
    getCell: (item) =>
      item.result?.releasedAt
        ? {
            kind: "date",
            label: describeBranchDateTime(item.result.releasedAt),
            dateTime: item.result.releasedAt,
          }
        : { kind: "text", primary: "Not recorded" },
  },
  {
    key: "result",
    label: "Result",
    size: "compact",
    getCell: (item) => ({ kind: "status", ...describeResultFlags(item) }),
  },
];

/**
 * The doctor's released results not yet marked as seen, critical first, as
 * the API sends them. Opening one shows the values; marking it as seen
 * takes it off the list. Amended results come back until seen again.
 */
export function ResultsInboxPage() {
  const { permissions } = useWorkspace();
  const canOrder = permissions.includes(ORDER_PERMISSIONS.create);
  const inboxQuery = useResultsInbox(canOrder);
  const [openItemIdentifier, setOpenItemIdentifier] = useState<string | null>(
    null
  );
  const openItem =
    inboxQuery.data?.find((item) => item.id === openItemIdentifier) ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="font-serif text-title font-normal tracking-tight">
          Results to review
        </h1>
        <p className="text-body text-muted-foreground">
          Results of the tests and scans you ordered, once the department
          releases them. Critical results come first. Mark each one as seen
          after you act on it.
        </p>
      </div>
      {!canOrder ? (
        <StateNotice tone="information" title="Your role cannot order tests">
          <p>
            Results come back to the doctor who ordered them. Ask an
            organisation administrator to add the “Order tests and scans”
            permission to your role if you need it.
          </p>
        </StateNotice>
      ) : (
        <DataTable
          accessibleLabel="Results to review"
          columns={COLUMNS}
          state={
            inboxQuery.isPending
              ? { status: "loading", label: "Loading your results" }
              : inboxQuery.isError
                ? {
                    status: "error",
                    title: "We could not load your results",
                    description: inboxQuery.error.message,
                    retryLabel: "Try again",
                    onRetry: () => void inboxQuery.refetch(),
                  }
                : { status: "ready", rows: inboxQuery.data }
          }
          getRowIdentifier={(item) => item.id}
          getRowEmphasis={(item) => (item.critical ? "critical" : "none")}
          maximumVisibleRows={10}
          rowAction={{
            label: (item) =>
              `Review ${item.serviceName} for ${describePatientName(item)}`,
            visibleLabel: "Review",
            onSelect: (item) => setOpenItemIdentifier(item.id),
          }}
          emptyState={{
            illustration: <EmptyReviewQueueIllustration />,
            title: "No results waiting",
            description:
              "Results of tests and scans you order appear here once the department releases them.",
          }}
        />
      )}
      <ResultSheet
        order={openItem}
        patient={
          openItem
            ? {
                id: openItem.patient.id,
                name: describePatientName(openItem),
                patientNumber: openItem.patient.patientNumber,
              }
            : undefined
        }
        canAcknowledge={canOrder}
        onOpenChange={(open) => {
          if (!open) setOpenItemIdentifier(null);
        }}
      />
    </div>
  );
}
