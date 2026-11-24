"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CancelOrderIcon } from "@healthalyst/icons";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { TestTubesIllustration } from "@healthalyst/ui/illustrations/test-tubes-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { ResultSheet } from "~/features/orders/components/result-sheet";
import {
  ORDER_KIND_LABELS,
  ORDER_LIMITS,
  ORDER_PAYMENT_PRESENTATION,
  ORDER_PERMISSIONS,
  ORDER_PRIORITY_PRESENTATION,
} from "~/features/orders/config/orders";
import {
  useOrderActions,
  usePatientOrders,
} from "~/features/orders/hooks/use-orders";
import {
  cancelOrderFormSchema,
  type CancelOrderFormValues,
} from "~/features/orders/schemas/order-form-schemas";
import type { Order } from "~/features/orders/schemas/order-response-schemas";
import {
  canCancelOrder,
  describeOrderProgress,
} from "~/features/orders/utilities/order-rules";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { formatNaira } from "~/shared/money/naira-amount";
import { describeBranchDateTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

function describeOrderDetails(order: Order): string {
  const payment = ORDER_PAYMENT_PRESENTATION[order.payment.status];
  return [
    ORDER_KIND_LABELS[order.kind],
    order.priority === "ROUTINE"
      ? null
      : ORDER_PRIORITY_PRESENTATION[order.priority].label,
    describeBranchDateTime(order.orderedAt),
    payment && order.payment.status === "AWAITING_PAYMENT"
      ? `${payment.label}, ${formatNaira(order.payment.patientKobo)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const COLUMNS: readonly DataTableColumn<Order>[] = [
  {
    key: "test",
    label: "Test or scan",
    size: "wide",
    getCell: (order) => ({
      kind: "text",
      primary: order.serviceName,
      secondary: describeOrderDetails(order),
    }),
  },
  {
    key: "status",
    label: "Status",
    size: "compact",
    getCell: (order) => ({ kind: "status", ...describeOrderProgress(order) }),
  },
];

/**
 * A patient's tests and scans, newest first: where each one is, and its
 * result once released. The doctor can cancel an order until work starts.
 */
export function PatientOrdersSection({ patientId }: { patientId: string }) {
  const { permissions } = useWorkspace();
  const canOrder = permissions.includes(ORDER_PERMISSIONS.create);
  const ordersQuery = usePatientOrders(patientId);
  const { cancel } = useOrderActions();
  const [openOrderIdentifier, setOpenOrderIdentifier] = useState<string | null>(
    null
  );
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const orders = ordersQuery.data ?? [];
  const openOrder =
    orders.find((order) => order.id === openOrderIdentifier) ?? null;

  return (
    <ContentPanel
      heading="Tests and results"
      headingLevel={2}
      description="Newest first, from every visit. Results show once the department releases them."
    >
      <DataTable
        accessibleLabel="Tests and results"
        columns={COLUMNS}
        state={
          ordersQuery.isPending
            ? { status: "loading", label: "Loading tests and results" }
            : ordersQuery.isError
              ? {
                  status: "error",
                  title: "We could not load the tests and results",
                  description: ordersQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void ordersQuery.refetch(),
                }
              : { status: "ready", rows: orders }
        }
        getRowIdentifier={(order) => order.id}
        getRowEmphasis={(order) =>
          order.status === "RELEASED" && order.critical
            ? "critical"
            : order.status === "RELEASED" && order.acknowledgedAt === null
              ? "attention"
              : "none"
        }
        rowAction={{
          label: (order) => `Open ${order.serviceName}`,
          onSelect: (order) => setOpenOrderIdentifier(order.id),
        }}
        getRowActions={(order) =>
          canOrder && canCancelOrder(order)
            ? [
                {
                  label: "Cancel order",
                  icon: <CancelOrderIcon />,
                  tone: "destructive",
                  onSelect: () => {
                    cancel.reset();
                    setCancellingOrder(order);
                  },
                },
              ]
            : []
        }
        getRowActionsLabel={(order) => `Actions for ${order.serviceName}`}
        emptyState={{
          illustration: <TestTubesIllustration />,
          title: "No tests or scans yet",
          description: canOrder
            ? "Tests and scans ordered for this patient appear here with their results."
            : "Tests and scans ordered by a doctor appear here with their results.",
        }}
      />
      <ResultSheet
        order={openOrder}
        canAcknowledge={canOrder}
        onOpenChange={(open) => {
          if (!open) setOpenOrderIdentifier(null);
        }}
      />
      <CancelOrderDialog
        order={cancellingOrder}
        onOpenChange={(open) => {
          if (!open) setCancellingOrder(null);
        }}
        mutation={cancel}
      />
    </ContentPanel>
  );
}

const EMPTY_CANCEL: CancelOrderFormValues = { reason: "" };

function CancelOrderDialog({
  order,
  onOpenChange,
  mutation,
}: {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
  mutation: ReturnType<typeof useOrderActions>["cancel"];
}) {
  const form = useForm<CancelOrderFormValues>({
    resolver: zodResolver(cancelOrderFormSchema),
    defaultValues: EMPTY_CANCEL,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (order) form.reset(EMPTY_CANCEL);
    // Reset only when a different order is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const submit = form.handleSubmit(
    (values) => {
      if (!order) return;
      mutation.mutate(
        { orderId: order.id, reason: values.reason.trim() },
        {
          onSuccess: () => {
            announceSuccess(`${order.serviceName} cancelled`);
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, ["reason"]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, { reason: "cancel-order-reason" })
  );

  return (
    <FormDialog
      open={order !== null}
      onOpenChange={onOpenChange}
      title={order ? `Cancel ${order.serviceName}?` : "Cancel order"}
      description="The department takes it off their list. It stays in the patient's record as cancelled."
      submitLabel="Cancel order"
      submittingLabel="Cancelling"
      dismissLabel="Keep order"
      tone="destructive"
      isSubmitting={mutation.isPending}
      error={
        mutation.isError && Object.keys(errors).length === 0
          ? mutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <TextAreaField
        id="cancel-order-reason"
        label="Reason"
        required
        description="Such as “ordered for the wrong patient” or “no longer needed”."
        rows={2}
        maxLength={ORDER_LIMITS.cancelReason.maximum}
        error={errors.reason?.message}
        {...form.register("reason")}
      />
    </FormDialog>
  );
}
