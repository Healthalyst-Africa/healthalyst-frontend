"use client";

import Link from "next/link";
import { ReviewResultsIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { DetailList } from "@healthalyst/ui/components/detail-list";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { ExpandableSection } from "@healthalyst/ui/components/expandable-section";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import {
  ORDER_KIND_LABELS,
  ORDER_PAYMENT_PRESENTATION,
  ORDER_PRIORITY_PRESENTATION,
  RESULT_FLAG_PRESENTATION,
  SPECIMEN_LABELS,
} from "~/features/orders/config/orders";
import {
  useOrderActions,
  useResultRevisions,
} from "~/features/orders/hooks/use-orders";
import type {
  Order,
  ResultValue,
} from "~/features/orders/schemas/order-response-schemas";
import {
  describeOrderStatus,
  describeResultFlags,
  describeResultValue,
} from "~/features/orders/utilities/order-rules";
import { formatNaira } from "~/shared/money/naira-amount";
import { describeBranchDateTime } from "~/shared/time/branch-time";

const VALUE_COLUMNS: readonly DataTableColumn<ResultValue>[] = [
  {
    key: "test",
    label: "Test",
    size: "wide",
    getCell: (value) => ({ kind: "text", primary: value.label }),
  },
  {
    key: "result",
    label: "Result",
    getCell: (value) => ({ kind: "text", primary: describeResultValue(value) }),
  },
  {
    key: "flag",
    label: "Flag",
    size: "compact",
    getCell: (value) =>
      value.flag
        ? { kind: "status", ...RESULT_FLAG_PRESENTATION[value.flag] }
        : {
            kind: "text",
            primary: value.range ? "In range" : "No range set",
          },
  },
  {
    key: "range",
    label: "Reference range",
    size: "compact",
    getCell: (value) => ({ kind: "text", primary: value.range ?? "Not set" }),
  },
];

function ResultValuesTable({
  values,
  accessibleLabel,
}: {
  values: readonly ResultValue[];
  accessibleLabel: string;
}) {
  return (
    <DataTable
      accessibleLabel={accessibleLabel}
      columns={VALUE_COLUMNS}
      state={{ status: "ready", rows: values }}
      getRowIdentifier={(value) => value.key}
      maximumVisibleRows={12}
      getRowEmphasis={(value) =>
        value.flag === "CRITICAL_LOW" || value.flag === "CRITICAL_HIGH"
          ? "critical"
          : value.flag
            ? "attention"
            : "none"
      }
      emptyState={{ title: "No values were entered" }}
    />
  );
}

/** Earlier versions of an amended result, loaded when opened. */
function EarlierVersions({ orderId }: { orderId: string }) {
  const revisionsQuery = useResultRevisions(orderId, true);
  if (revisionsQuery.isPending) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading earlier versions
      </p>
    );
  }
  if (revisionsQuery.isError) {
    return (
      <NoticeBanner tone="error" title="The earlier versions did not load">
        {revisionsQuery.error.message}
      </NoticeBanner>
    );
  }
  const earlierVersions = revisionsQuery.data;
  if (earlierVersions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No earlier versions.</p>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {earlierVersions.map((revision) => (
        <div key={revision.version} className="flex flex-col gap-2">
          <p className="text-sm">
            <span className="font-medium">
              Saved {describeBranchDateTime(revision.savedAt)}
            </span>
            {revision.reason ? `: ${revision.reason}` : ""}
          </p>
          <ResultValuesTable
            values={revision.values}
            accessibleLabel={`Result saved ${describeBranchDateTime(revision.savedAt)}`}
          />
          {revision.comment && (
            <p className="whitespace-pre-line text-sm">{revision.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * One order and, once released, its result: each value with its flag and
 * reference range, the department's comment or report, and earlier versions
 * of an amended result. The requester marks a result as seen here.
 */
export function ResultSheet({
  order,
  patient,
  canAcknowledge,
  onOpenChange,
}: {
  order: Order | null;
  /** Shown when the sheet opens outside the patient's record. */
  patient?: { id: string; name: string; patientNumber: string };
  canAcknowledge: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { acknowledge } = useOrderActions();
  if (!order) {
    return (
      <DetailSheet open={false} onOpenChange={onOpenChange} title="Result">
        {null}
      </DetailSheet>
    );
  }

  const result = order.status === "RELEASED" ? order.result : null;
  const status = describeOrderStatus(order);
  const payment = ORDER_PAYMENT_PRESENTATION[order.payment.status];
  const needsAcknowledging =
    canAcknowledge && result !== null && order.acknowledgedAt === null;

  return (
    <DetailSheet
      open
      onOpenChange={onOpenChange}
      title={order.serviceName}
      description={
        patient
          ? `${patient.name}, ${patient.patientNumber}`
          : `Ordered ${describeBranchDateTime(order.orderedAt)}`
      }
      titleAccessory={
        result ? (
          <StatusLabel {...describeResultFlags(order)} />
        ) : (
          <StatusLabel {...status} />
        )
      }
      footer={
        (needsAcknowledging || patient) && (
          <div className="flex flex-wrap items-center gap-3">
            {needsAcknowledging && (
              <ActionButton
                type="button"
                leadingIcon={<ReviewResultsIcon className="size-4" />}
                isLoading={acknowledge.isPending}
                loadingText="Saving"
                onClick={() =>
                  acknowledge.mutate(order.id, {
                    onSuccess: () => {
                      announceSuccess(`${order.serviceName}: marked as seen`);
                      onOpenChange(false);
                    },
                  })
                }
              >
                Mark as seen
              </ActionButton>
            )}
            {patient && (
              <Link
                href={`${HEALTH_SCHEDULE_ROUTES.patient(patient.id)}?section=results`}
                className="text-sm font-medium text-primary underline underline-offset-4"
              >
                Open {patient.name}&apos;s record
              </Link>
            )}
          </div>
        )
      }
    >
      <div className="flex flex-col gap-6">
        {acknowledge.isError && (
          <NoticeBanner tone="error" title="It was not marked as seen">
            {acknowledge.error.message}
          </NoticeBanner>
        )}
        {order.critical && result && (
          <NoticeBanner tone="error" title="Critical result">
            A value is beyond a critical limit. Act on it now and tell the
            patient.
          </NoticeBanner>
        )}
        {result?.amended && (
          <NoticeBanner tone="warning" title="Amended after release">
            The department changed this result after releasing it. Earlier
            versions are kept below.
          </NoticeBanner>
        )}
        {result ? (
          <>
            <ResultValuesTable
              values={result.values}
              accessibleLabel={`${order.serviceName} result`}
            />
            {result.comment && (
              <section className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">
                  {order.kind === "IMAGING" ? "Report" : "Comment"}
                </h3>
                <p className="whitespace-pre-line text-sm">{result.comment}</p>
              </section>
            )}
          </>
        ) : (
          order.status !== "CANCELLED" && (
            <p className="text-sm text-muted-foreground">
              The result shows here once the department releases it.
            </p>
          )
        )}
        <DetailList
          variant="striped"
          items={[
            {
              term: "Kind",
              description: order.specimen
                ? `${ORDER_KIND_LABELS[order.kind]}, ${SPECIMEN_LABELS[order.specimen].toLowerCase()}`
                : ORDER_KIND_LABELS[order.kind],
            },
            {
              term: "Priority",
              description: ORDER_PRIORITY_PRESENTATION[order.priority].label,
            },
            { term: "Clinical question", description: order.indication },
            {
              term: "Ordered",
              description: describeBranchDateTime(order.orderedAt),
            },
            ...(order.collectedAt
              ? [
                  {
                    term:
                      order.kind === "IMAGING"
                        ? "Patient arrived"
                        : "Sample taken",
                    description: describeBranchDateTime(order.collectedAt),
                  },
                ]
              : []),
            ...(result?.releasedAt
              ? [
                  {
                    term: "Released",
                    description: describeBranchDateTime(result.releasedAt),
                  },
                ]
              : []),
            ...(order.acknowledgedAt
              ? [
                  {
                    term: "Seen",
                    description: describeBranchDateTime(order.acknowledgedAt),
                  },
                ]
              : []),
            ...(payment
              ? [
                  {
                    term: "Payment",
                    description:
                      order.payment.status === "AWAITING_PAYMENT"
                        ? `${payment.label}: ${formatNaira(order.payment.patientKobo)}`
                        : payment.label,
                  },
                ]
              : []),
            ...(order.rejectedReason && order.status === "ORDERED"
              ? [
                  {
                    term: "Sample rejected",
                    description: order.rejectedReason,
                  },
                ]
              : []),
            ...(order.cancelReason
              ? [{ term: "Cancelled", description: order.cancelReason }]
              : []),
          ]}
        />
        {result?.amended && (
          <ExpandableSection title="Earlier versions">
            <EarlierVersions orderId={order.id} />
          </ExpandableSection>
        )}
      </div>
    </DetailSheet>
  );
}
