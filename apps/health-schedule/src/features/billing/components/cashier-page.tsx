"use client";

import { useState } from "react";
import {
  CardPaymentIcon,
  CashPaymentIcon,
  PaidIcon,
  ReversedPaymentIcon,
} from "@healthalyst/icons";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { MetricSummary } from "@healthalyst/ui/components/metric-summary";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { BillSheet } from "~/features/billing/components/bill-sheet";
import { BILLING_PERMISSIONS } from "~/features/billing/config/billing";
import {
  useCashierSummary,
  useOwingAccounts,
} from "~/features/billing/hooks/use-billing";
import type { AccountSummary } from "~/features/billing/schemas/billing-response-schemas";
import {
  describeBillTag,
  describeWhoPays,
} from "~/features/billing/utilities/bill-presentation";
import { PatientFlowFrame } from "~/features/patient-flow/components/patient-flow-frame";
import { describePatientName } from "~/features/patient-flow/utilities/front-desk";
import { formatNaira } from "~/shared/money/naira-amount";
import { describeBranchDateTime } from "~/shared/time/branch-time";

function describeBillPatient(account: AccountSummary): string {
  return account.patient ? describePatientName(account.patient) : "Patient";
}

const OWING_COLUMNS: readonly DataTableColumn<AccountSummary>[] = [
  {
    key: "patient",
    label: "Patient",
    size: "wide",
    getCell: (account) => ({
      kind: "text",
      primary: describeBillPatient(account),
      secondary: account.patient?.patientNumber,
    }),
  },
  {
    key: "visit",
    label: "Visit",
    getCell: (account) => ({
      kind: "text",
      primary: describeBranchDateTime(account.createdAt),
      secondary: describeWhoPays(account),
    }),
  },
  {
    key: "owes",
    label: "Still owed",
    size: "compact",
    getCell: (account) => ({ kind: "status", ...describeBillTag(account) }),
  },
];

/**
 * The cashier's page: who still owes money, oldest first, and what this
 * cashier has taken today.
 */
export function CashierPage() {
  return (
    <PatientFlowFrame
      title="Cashier"
      description="Take payments for each visit and give receipts."
      requiredPermission={BILLING_PERMISSIONS.collect}
      missingPermissionName="Take payments"
    >
      {() => <CashierWorkspace />}
    </PatientFlowFrame>
  );
}

function CashierWorkspace() {
  const owingQuery = useOwingAccounts(true);
  const summaryQuery = useCashierSummary(true);
  const [openBill, setOpenBill] = useState<AccountSummary | null>(null);
  const summary = summaryQuery.data;
  const cashTakenKobo =
    summary?.byMethod.find((entry) => entry.method === "CASH")?.amountKobo ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <MetricSummary
        isLoading={summaryQuery.isPending}
        items={[
          {
            label: "You took today",
            value: formatNaira(summary?.totalKobo ?? 0),
            icon: <PaidIcon />,
          },
          {
            label: "Cash",
            value: formatNaira(cashTakenKobo),
            icon: <CashPaymentIcon />,
          },
          {
            label: "Card and transfer",
            value: formatNaira(
              (summary?.byMethod ?? [])
                .filter((entry) => entry.method !== "CASH")
                .reduce((total, entry) => total + entry.amountKobo, 0)
            ),
            icon: <CardPaymentIcon />,
          },
          {
            label: "Reversed",
            value: summary?.reversed.count ?? 0,
            icon: <ReversedPaymentIcon />,
          },
        ]}
      />
      <ContentPanel
        data-tour="cashier-owing"
        heading="Waiting to pay"
        headingLevel={2}
        description="Every bill with something still owed. It updates on its own."
      >
        <DataTable
          accessibleLabel="Bills waiting to be paid"
          columns={OWING_COLUMNS}
          state={
            owingQuery.isPending
              ? { status: "loading", label: "Loading the bills to pay" }
              : owingQuery.isError
                ? {
                    status: "error",
                    title: "We could not load the bills to pay",
                    description: owingQuery.error.message,
                    retryLabel: "Try again",
                    onRetry: () => void owingQuery.refetch(),
                  }
                : { status: "ready", rows: owingQuery.data }
          }
          getRowIdentifier={(account) => account.id}
          rowAction={{
            label: (account) => `Open ${describeBillPatient(account)}'s bill`,
            visibleLabel: "Open bill",
            onSelect: setOpenBill,
          }}
          emptyState={{
            illustration: <EmptyReviewQueueIllustration />,
            title: "Nobody owes anything",
            description:
              "Bills appear here as soon as a visit, test or scan is charged.",
          }}
        />
      </ContentPanel>
      <BillSheet
        accountId={openBill?.id ?? null}
        patientName={openBill ? describeBillPatient(openBill) : ""}
        onOpenChange={(open) => !open && setOpenBill(null)}
      />
    </div>
  );
}
