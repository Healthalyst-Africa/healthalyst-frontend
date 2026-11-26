"use client";

import { useState } from "react";
import {
  AddIcon,
  BillIcon,
  CashierIcon,
  LockedIcon,
  ReversedPaymentIcon,
  VoidedChargeIcon,
  WaiverIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ActionMenu } from "@healthalyst/ui/components/action-menu";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { DetailList } from "@healthalyst/ui/components/detail-list";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { AddChargeDialog } from "~/features/billing/components/add-charge-dialog";
import { TakePaymentDialog } from "~/features/billing/components/take-payment-dialog";
import { WaiveDialog } from "~/features/billing/components/waive-dialog";
import {
  BILL_TAGS,
  BILLING_PERMISSIONS,
  BILLING_TEXT_LIMITS,
  PAYMENT_MODE_OPTIONS,
} from "~/features/billing/config/billing";
import {
  useAccount,
  useChangeAccountPaymentMode,
  useCloseAccount,
  useReversePayment,
  useVoidCharge,
} from "~/features/billing/hooks/use-billing";
import type {
  Account,
  AccountCharge,
  AccountPayment,
} from "~/features/billing/schemas/billing-response-schemas";
import {
  describeBillingError,
  describeBillTag,
  describePaymentMethod,
  describePriceCategory,
  describeWhoPays,
} from "~/features/billing/utilities/bill-presentation";
import { ReasonDialog } from "~/shared/forms/reason-dialog";
import { formatNaira } from "~/shared/money/naira-amount";
import {
  describeBranchDate,
  describeBranchDateTime,
} from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

type BillAction =
  | { kind: "pay" }
  | { kind: "charge" }
  | { kind: "waive" }
  | { kind: "payment-mode" }
  | { kind: "close" }
  | { kind: "void"; charge: AccountCharge }
  | { kind: "reverse"; payment: AccountPayment };

/**
 * One visit's bill: what was charged, who pays it, what was paid and what is
 * still owed, with the cashier's and manager's actions.
 */
export function BillSheet({
  accountId,
  patientName,
  onOpenChange,
}: {
  /** `null` while closed. */
  accountId: string | null;
  patientName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { permissions } = useWorkspace();
  const canCollect = permissions.includes(BILLING_PERMISSIONS.collect);
  const canWaive = permissions.includes(BILLING_PERMISSIONS.waive);
  const accountQuery = useAccount(accountId);
  const account = accountQuery.data ?? null;
  const [action, setAction] = useState<BillAction | null>(null);
  const isOpen = account?.status === "OPEN";
  const owes = (account?.totals.balanceKobo ?? 0) > 0;

  const moreActions = account
    ? [
        ...(canCollect && isOpen
          ? [
              {
                label: "Add a charge",
                icon: <AddIcon />,
                onSelect: () => setAction({ kind: "charge" }),
              },
            ]
          : []),
        ...(canWaive && isOpen && owes
          ? [
              {
                label: "Waive part of the bill",
                icon: <WaiverIcon />,
                onSelect: () => setAction({ kind: "waive" }),
              },
            ]
          : []),
        ...(canWaive && isOpen
          ? [
              {
                label: "Change when it is paid",
                icon: <BillIcon />,
                onSelect: () => setAction({ kind: "payment-mode" }),
              },
            ]
          : []),
        ...(canCollect && isOpen && !owes
          ? [
              {
                label: "Close the bill",
                icon: <LockedIcon />,
                separatedAbove: true,
                onSelect: () => setAction({ kind: "close" }),
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <DetailSheet
        open={accountId !== null}
        onOpenChange={onOpenChange}
        title={`Bill for ${patientName}`}
        titleAccessory={
          account && <StatusLabel {...describeBillTag(account)} />
        }
        description={
          account
            ? `Visit on ${describeBranchDate(account.createdAt)}. Pays ${(
                PAYMENT_MODE_OPTIONS.find(
                  (option) => option.value === account.paymentMode
                )?.label ?? ""
              ).toLowerCase()}.`
            : undefined
        }
        footer={
          account &&
          (canCollect || moreActions.length > 0) && (
            <>
              {moreActions.length > 0 && (
                <ActionMenu
                  accessibleLabel="More bill actions"
                  trigger={{ label: "More", variant: "outline" }}
                  items={moreActions}
                />
              )}
              {canCollect && isOpen && owes && (
                <ActionButton
                  type="button"
                  leadingIcon={<CashierIcon className="size-4" />}
                  onClick={() => setAction({ kind: "pay" })}
                >
                  Take payment
                </ActionButton>
              )}
            </>
          )
        }
      >
        {accountQuery.isPending ? (
          <LoadingPlaceholder
            label="Opening the bill"
            rows={[{ shape: "card" }, { shape: "card" }]}
          />
        ) : accountQuery.isError ? (
          <StateNotice
            tone="error"
            title="We could not open the bill"
            action={
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => void accountQuery.refetch()}
              >
                Try again
              </ActionButton>
            }
          >
            <p>{accountQuery.error.message}</p>
          </StateNotice>
        ) : account ? (
          <BillDetails
            account={account}
            canWaive={canWaive}
            onVoid={(charge) => setAction({ kind: "void", charge })}
            onReverse={(payment) => setAction({ kind: "reverse", payment })}
          />
        ) : null}
      </DetailSheet>

      <TakePaymentDialog
        account={action?.kind === "pay" ? account : null}
        patientName={patientName}
        onOpenChange={(open) => !open && setAction(null)}
      />
      <AddChargeDialog
        account={action?.kind === "charge" ? account : null}
        onOpenChange={(open) => !open && setAction(null)}
      />
      <WaiveDialog
        account={action?.kind === "waive" ? account : null}
        onOpenChange={(open) => !open && setAction(null)}
      />
      <VoidChargeDialog
        account={account}
        charge={action?.kind === "void" ? action.charge : null}
        onOpenChange={(open) => !open && setAction(null)}
      />
      <ReversePaymentDialog
        payment={action?.kind === "reverse" ? action.payment : null}
        onOpenChange={(open) => !open && setAction(null)}
      />
      <PaymentModeDialog
        account={action?.kind === "payment-mode" ? account : null}
        onOpenChange={(open) => !open && setAction(null)}
      />
      <CloseBillDialog
        account={action?.kind === "close" ? account : null}
        onOpenChange={(open) => !open && setAction(null)}
      />
    </>
  );
}

function BillDetails({
  account,
  canWaive,
  onVoid,
  onReverse,
}: {
  account: Account;
  canWaive: boolean;
  onVoid: (charge: AccountCharge) => void;
  onReverse: (payment: AccountPayment) => void;
}) {
  const totals = account.totals;
  const chargeColumns: readonly DataTableColumn<AccountCharge>[] = [
    {
      key: "item",
      label: "Item",
      size: "wide",
      getCell: (charge) => ({
        kind: "text",
        primary:
          charge.quantity > 1
            ? `${charge.description} × ${charge.quantity}`
            : charge.description,
        secondary:
          charge.status === "VOIDED"
            ? `Removed: ${charge.voidReason ?? "no reason given"}`
            : describePriceCategory(charge.category),
      }),
    },
    {
      key: "patient",
      label: "Patient pays",
      size: "compact",
      getCell: (charge) => ({
        kind: "text",
        primary: formatNaira(charge.patientKobo),
        secondary:
          charge.payerKobo > 0
            ? `${charge.payerName ?? "Insurer"} pays ${formatNaira(charge.payerKobo)}`
            : undefined,
      }),
    },
    {
      key: "status",
      label: "Status",
      size: "compact",
      getCell: (charge) =>
        charge.status === "VOIDED"
          ? { kind: "status", ...BILL_TAGS.voided }
          : charge.paidKobo >= charge.patientKobo
            ? { kind: "status", ...BILL_TAGS.settled }
            : {
                kind: "status",
                ...BILL_TAGS.owing,
                label: `Owes ${formatNaira(charge.patientKobo - charge.paidKobo)}`,
              },
    },
  ];
  const paymentColumns: readonly DataTableColumn<AccountPayment>[] = [
    {
      key: "receipt",
      label: "Receipt",
      getCell: (payment) => ({
        kind: "text",
        primary: payment.receiptNumber,
        secondary: describeBranchDateTime(payment.receivedAt),
      }),
    },
    {
      key: "amount",
      label: "Amount",
      getCell: (payment) => ({
        kind: "text",
        primary: formatNaira(payment.amountKobo),
        secondary: payment.reference
          ? `${describePaymentMethod(payment.method)}, ${payment.reference}`
          : describePaymentMethod(payment.method),
      }),
    },
    {
      key: "status",
      label: "Status",
      size: "compact",
      getCell: (payment) =>
        payment.status === "REVERSED"
          ? { kind: "status", ...BILL_TAGS.reversed }
          : { kind: "status", ...BILL_TAGS.settled, label: "Received" },
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <DetailList
        variant="striped"
        items={[
          { term: "Total charged", description: formatNaira(totals.totalKobo) },
          { term: "Who pays", description: describeWhoPays(account) },
          { term: "Paid", description: formatNaira(totals.paidKobo) },
          ...(totals.waivedKobo > 0
            ? [{ term: "Waived", description: formatNaira(totals.waivedKobo) }]
            : []),
          ...(totals.creditKobo > 0
            ? [
                {
                  term: "Paid too much",
                  description: `${formatNaira(totals.creditKobo)} to give back`,
                },
              ]
            : []),
          {
            term: "Still owed",
            description: (
              <span className="font-semibold">
                {formatNaira(totals.balanceKobo)}
              </span>
            ),
          },
        ]}
      />
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">Charges</h3>
        <DataTable
          accessibleLabel="Charges on this bill"
          columns={chargeColumns}
          state={{ status: "ready", rows: account.charges }}
          getRowIdentifier={(charge) => charge.id}
          getRowActions={(charge) =>
            canWaive && charge.status === "ACTIVE" && account.status === "OPEN"
              ? [
                  {
                    label: "Remove this charge",
                    icon: <VoidedChargeIcon />,
                    tone: "destructive",
                    onSelect: () => onVoid(charge),
                  },
                ]
              : []
          }
          getRowActionsLabel={(charge) => `Actions for ${charge.description}`}
          emptyState={{
            title: "Nothing charged yet",
            description:
              "Tests, scans and visits add their charges as they happen.",
          }}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">Payments</h3>
        <DataTable
          accessibleLabel="Payments on this bill"
          columns={paymentColumns}
          state={{ status: "ready", rows: account.payments }}
          getRowIdentifier={(payment) => payment.id}
          getRowActions={(payment) =>
            canWaive && payment.status === "RECORDED"
              ? [
                  {
                    label: "Reverse this payment",
                    icon: <ReversedPaymentIcon />,
                    tone: "destructive",
                    onSelect: () => onReverse(payment),
                  },
                ]
              : []
          }
          getRowActionsLabel={(payment) =>
            `Actions for receipt ${payment.receiptNumber}`
          }
          emptyState={{ title: "No payments yet" }}
        />
      </section>
      {account.waivers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">Waived</h3>
          <DetailList
            items={account.waivers.map((waiver) => ({
              term: `${formatNaira(waiver.amountKobo)} on ${describeBranchDate(waiver.createdAt)}`,
              description: waiver.reason,
            }))}
          />
        </section>
      )}
    </div>
  );
}

function VoidChargeDialog({
  account,
  charge,
  onOpenChange,
}: {
  account: Account | null;
  charge: AccountCharge | null;
  onOpenChange: (open: boolean) => void;
}) {
  const voidMutation = useVoidCharge();
  return (
    <ReasonDialog
      open={charge !== null}
      onOpenChange={(open) => {
        if (!open) voidMutation.reset();
        onOpenChange(open);
      }}
      identifier="void-charge"
      title={charge ? `Remove ${charge.description}?` : "Remove the charge"}
      description="It stays on the bill, struck through, with your reason."
      reasonLabel="Reason"
      reasonHint="For example: charged twice, or not given."
      minimumLength={BILLING_TEXT_LIMITS.reasonMinimum}
      maximumLength={BILLING_TEXT_LIMITS.reasonMaximum}
      submitLabel="Remove charge"
      submittingLabel="Removing"
      tone="destructive"
      isSubmitting={voidMutation.isPending}
      error={
        voidMutation.isError
          ? describeBillingError(voidMutation.error)
          : undefined
      }
      onSubmit={(reason) => {
        if (!account || !charge) return;
        voidMutation.mutate(
          { accountId: account.id, chargeId: charge.id, reason },
          {
            onSuccess: () => {
              announceSuccess("Charge removed");
              onOpenChange(false);
            },
          }
        );
      }}
    />
  );
}

function ReversePaymentDialog({
  payment,
  onOpenChange,
}: {
  payment: AccountPayment | null;
  onOpenChange: (open: boolean) => void;
}) {
  const reverseMutation = useReversePayment();
  return (
    <ReasonDialog
      open={payment !== null}
      onOpenChange={(open) => {
        if (!open) reverseMutation.reset();
        onOpenChange(open);
      }}
      identifier="reverse-payment"
      title={
        payment
          ? `Reverse receipt ${payment.receiptNumber}?`
          : "Reverse the payment"
      }
      description={
        payment
          ? `${formatNaira(payment.amountKobo)} goes back onto what the patient owes. Give the money back separately.`
          : undefined
      }
      reasonLabel="Reason"
      reasonHint="For example: recorded twice, or the transfer failed."
      minimumLength={BILLING_TEXT_LIMITS.reasonMinimum}
      maximumLength={BILLING_TEXT_LIMITS.reasonMaximum}
      submitLabel="Reverse payment"
      submittingLabel="Reversing"
      tone="destructive"
      isSubmitting={reverseMutation.isPending}
      error={
        reverseMutation.isError
          ? describeBillingError(reverseMutation.error)
          : undefined
      }
      onSubmit={(reason) => {
        if (!payment) return;
        reverseMutation.mutate(
          { paymentId: payment.id, reason },
          {
            onSuccess: () => {
              announceSuccess(`Receipt ${payment.receiptNumber} reversed`);
              onOpenChange(false);
            },
          }
        );
      }}
    />
  );
}

function PaymentModeDialog({
  account,
  onOpenChange,
}: {
  account: Account | null;
  onOpenChange: (open: boolean) => void;
}) {
  const modeMutation = useChangeAccountPaymentMode();
  const nextMode =
    account?.paymentMode === "PAY_BEFORE" ? "PAY_AT_END" : "PAY_BEFORE";
  const nextOption = PAYMENT_MODE_OPTIONS.find(
    (option) => option.value === nextMode
  );
  return (
    <FormDialog
      open={account !== null}
      onOpenChange={(open) => {
        if (!open) modeMutation.reset();
        onOpenChange(open);
      }}
      title={`Let this patient pay ${nextOption?.label.toLowerCase() ?? ""}?`}
      description={nextOption?.description}
      submitLabel="Change"
      submittingLabel="Changing"
      isSubmitting={modeMutation.isPending}
      error={
        modeMutation.isError
          ? describeBillingError(modeMutation.error)
          : undefined
      }
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        if (!account) return;
        modeMutation.mutate(
          { accountId: account.id, paymentMode: nextMode },
          {
            onSuccess: () => {
              announceSuccess("Changed when this bill is paid");
              onOpenChange(false);
            },
          }
        );
      }}
    >
      <p className="text-sm leading-6 text-muted-foreground">
        This changes only this visit's bill. The rest of the facility keeps its
        usual setting.
      </p>
    </FormDialog>
  );
}

function CloseBillDialog({
  account,
  onOpenChange,
}: {
  account: Account | null;
  onOpenChange: (open: boolean) => void;
}) {
  const closeMutation = useCloseAccount();
  return (
    <FormDialog
      open={account !== null}
      onOpenChange={(open) => {
        if (!open) closeMutation.reset();
        onOpenChange(open);
      }}
      title="Close the bill?"
      description="Nothing is owed. A later charge on this visit opens it again."
      submitLabel="Close bill"
      submittingLabel="Closing"
      dismissLabel="Keep it open"
      isSubmitting={closeMutation.isPending}
      error={
        closeMutation.isError
          ? describeBillingError(closeMutation.error)
          : undefined
      }
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        if (!account) return;
        closeMutation.mutate(account.id, {
          onSuccess: () => {
            announceSuccess("Bill closed");
            onOpenChange(false);
          },
        });
      }}
    >
      <p className="text-sm leading-6 text-muted-foreground">
        The bill moves out of the cashier's list.
      </p>
    </FormDialog>
  );
}
