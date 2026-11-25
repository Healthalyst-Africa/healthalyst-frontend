"use client";

import { useState } from "react";
import { AddIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SearchField } from "@healthalyst/ui/components/search-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import {
  PriceItemDialog,
  type PriceItemEditing,
} from "~/features/billing/components/price-item-dialog";
import {
  BILL_TAGS,
  BILLING_PERMISSIONS,
  PAYMENT_MODE_OPTIONS,
} from "~/features/billing/config/billing";
import {
  useBillingSettings,
  usePriceItems,
  useSavePaymentMode,
} from "~/features/billing/hooks/use-billing";
import type { PriceItem } from "~/features/billing/schemas/billing-response-schemas";
import {
  describeBillingError,
  describePriceCategory,
} from "~/features/billing/utilities/bill-presentation";
import { PatientFlowFrame } from "~/features/patient-flow/components/patient-flow-frame";
import { formatNaira } from "~/shared/money/naira-amount";

const PRICE_COLUMNS: readonly DataTableColumn<PriceItem>[] = [
  {
    key: "item",
    label: "Item",
    size: "wide",
    getCell: (item) => ({
      kind: "text",
      primary: item.name,
      secondary: `${item.code} · ${describePriceCategory(item.category)}`,
    }),
  },
  {
    key: "price",
    label: "Standard price",
    getCell: (item) => ({
      kind: "text",
      primary: formatNaira(item.priceKobo),
      secondary:
        item.payerPrices.length === 0
          ? "No insurer prices"
          : item.payerPrices.length === 1
            ? `1 insurer price`
            : `${item.payerPrices.length} insurer prices`,
    }),
  },
  {
    key: "status",
    label: "Status",
    size: "compact",
    getCell: (item) => ({
      kind: "status",
      ...(item.isActive ? BILL_TAGS.priceOn : BILL_TAGS.priceOff),
    }),
  },
];

/** Prices for everything the facility charges, and when patients pay. */
export function PricesPage() {
  const [editing, setEditing] = useState<PriceItemEditing | null>(null);
  return (
    <PatientFlowFrame
      title="Prices"
      description="What each visit, test and service costs, what insurers pay, and when patients pay."
      requiredPermission={BILLING_PERMISSIONS.manage}
      missingPermissionName="Manage prices and billing"
      action={
        <ActionButton
          type="button"
          leadingIcon={<AddIcon className="size-4" />}
          onClick={() => setEditing({ item: null })}
        >
          Add an item
        </ActionButton>
      }
    >
      {() => (
        <div className="flex flex-col gap-8">
          <PaymentModePanel />
          <PriceListPanel onOpen={(item) => setEditing({ item })} />
          <PriceItemDialog
            editing={editing}
            onOpenChange={(open) => !open && setEditing(null)}
          />
        </div>
      )}
    </PatientFlowFrame>
  );
}

function PaymentModePanel() {
  const settingsQuery = useBillingSettings(true);
  const saveMutation = useSavePaymentMode();
  const settings = settingsQuery.data;

  return (
    <ContentPanel
      data-tour="prices-payment-mode"
      heading="When patients pay"
      headingLevel={2}
      description="The cashier can still change it for one patient's bill."
    >
      {settingsQuery.isPending ? (
        <LoadingPlaceholder
          label="Loading when patients pay"
          rows={[{ shape: "card", columns: 2 }]}
        />
      ) : settingsQuery.isError ? (
        <NoticeBanner
          tone="error"
          title="We could not load when patients pay"
          action={
            <ActionButton
              type="button"
              variant="outline"
              size="compact"
              onClick={() => void settingsQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          {settingsQuery.error.message}
        </NoticeBanner>
      ) : (
        <>
          <ChoiceCardGroup
            id="payment-mode"
            legend="Patients pay"
            options={PAYMENT_MODE_OPTIONS}
            value={settings?.paymentMode ?? ""}
            description={
              settings?.isDefault
                ? "Not chosen yet, so patients pay at the end."
                : undefined
            }
            onValueChange={(value) => {
              const paymentMode = PAYMENT_MODE_OPTIONS.find(
                (option) => option.value === value
              )?.value;
              if (!settings || !paymentMode) return;
              if (paymentMode === settings.paymentMode) return;
              saveMutation.mutate(
                { paymentMode, version: settings.version },
                {
                  onSuccess: () =>
                    announceSuccess(
                      "Saved when patients pay",
                      PAYMENT_MODE_OPTIONS.find(
                        (option) => option.value === value
                      )?.label
                    ),
                }
              );
            }}
          />
          {saveMutation.isError && (
            <NoticeBanner tone="error" title="That was not saved">
              {describeBillingError(saveMutation.error)}
            </NoticeBanner>
          )}
        </>
      )}
    </ContentPanel>
  );
}

function PriceListPanel({ onOpen }: { onOpen: (item: PriceItem) => void }) {
  const itemsQuery = usePriceItems(true);
  const [searchText, setSearchText] = useState("");
  const search = searchText.trim().toLowerCase();
  const rows = (itemsQuery.data ?? [])
    .filter(
      (item) =>
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.code.toLowerCase().startsWith(search)
    )
    .sort((first, second) => first.name.localeCompare(second.name));

  return (
    <ContentPanel
      data-tour="prices-list"
      heading="Price list"
      headingLevel={2}
      description="Tests and scans linked to an item are charged on their own when a doctor orders them."
    >
      <SearchField
        aria-label="Search the price list"
        placeholder="Search by name or code"
        value={searchText}
        onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
      />
      <DataTable
        accessibleLabel="Price list"
        columns={PRICE_COLUMNS}
        state={
          itemsQuery.isPending
            ? { status: "loading", label: "Loading the price list" }
            : itemsQuery.isError
              ? {
                  status: "error",
                  title: "We could not load the price list",
                  description: itemsQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void itemsQuery.refetch(),
                }
              : { status: "ready", rows }
        }
        getRowIdentifier={(item) => item.id}
        rowAction={{
          label: (item) => `Change ${item.name}`,
          onSelect: onOpen,
        }}
        emptyState={
          search
            ? {
                illustration: <EmptySearchIllustration />,
                title: `Nothing matches “${searchText.trim()}”`,
                description: "Check the spelling, or search by code.",
              }
            : {
                title: "No prices yet",
                description:
                  "Add what the facility charges for, starting with consultations.",
              }
        }
      />
    </ContentPanel>
  );
}
