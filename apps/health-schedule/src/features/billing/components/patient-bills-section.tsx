"use client";

import { useState } from "react";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { BillSheet } from "~/features/billing/components/bill-sheet";
import { BILLING_PERMISSIONS } from "~/features/billing/config/billing";
import { usePatientAccounts } from "~/features/billing/hooks/use-billing";
import type { AccountSummary } from "~/features/billing/schemas/billing-response-schemas";
import {
  describeBillTag,
  describeWhoPays,
} from "~/features/billing/utilities/bill-presentation";
import { formatNaira } from "~/shared/money/naira-amount";
import { describeBranchDate } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const BILL_COLUMNS: readonly DataTableColumn<AccountSummary>[] = [
  {
    key: "visit",
    label: "Visit",
    getCell: (account) => ({
      kind: "text",
      primary: describeBranchDate(account.createdAt),
      secondary: account.visitId ? undefined : "Not part of a visit",
    }),
  },
  {
    key: "total",
    label: "Charged",
    getCell: (account) => ({
      kind: "text",
      primary: formatNaira(account.totals.totalKobo),
      secondary: describeWhoPays(account),
    }),
  },
  {
    key: "status",
    label: "Status",
    size: "compact",
    getCell: (account) => ({ kind: "status", ...describeBillTag(account) }),
  },
];

/** The patient's bills, one per visit, newest first, each opened in full. */
export function PatientBillsSection({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const { permissions } = useWorkspace();
  const canRead = permissions.includes(BILLING_PERMISSIONS.read);
  const accountsQuery = usePatientAccounts(patientId, canRead);
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);

  if (!canRead) {
    return (
      <StateNotice tone="information" title="Your role cannot see bills">
        <p>
          Ask an organisation administrator to add the “View bills” permission
          to your role.
        </p>
      </StateNotice>
    );
  }

  const owedKobo = (accountsQuery.data ?? [])
    .filter((account) => account.status === "OPEN")
    .reduce((total, account) => total + account.totals.balanceKobo, 0);

  return (
    <ContentPanel
      heading="Bills"
      headingLevel={2}
      description={
        accountsQuery.isSuccess && owedKobo > 0
          ? `${formatNaira(owedKobo)} still owed across all visits.`
          : "One bill for each visit. Open one to see its charges and receipts."
      }
    >
      <DataTable
        accessibleLabel={`${patientName}'s bills`}
        columns={BILL_COLUMNS}
        state={
          accountsQuery.isPending
            ? { status: "loading", label: "Loading the bills" }
            : accountsQuery.isError
              ? {
                  status: "error",
                  title: "We could not load the bills",
                  description: accountsQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void accountsQuery.refetch(),
                }
              : {
                  status: "ready",
                  rows: [...accountsQuery.data].sort((first, second) =>
                    second.createdAt.localeCompare(first.createdAt)
                  ),
                }
        }
        getRowIdentifier={(account) => account.id}
        rowAction={{
          label: (account) =>
            `Open the bill from ${describeBranchDate(account.createdAt)}`,
          onSelect: (account) => setOpenAccountId(account.id),
        }}
        emptyState={{
          title: "No bills yet",
          description:
            "A bill starts when the first charge of a visit is made, such as a consultation or a test.",
        }}
      />
      <BillSheet
        accountId={openAccountId}
        patientName={patientName}
        onOpenChange={(open) => !open && setOpenAccountId(null)}
      />
    </ContentPanel>
  );
}
