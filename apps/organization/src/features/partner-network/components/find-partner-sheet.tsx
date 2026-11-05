"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FilterBar } from "@healthalyst/ui/components/filter-bar";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { HintText } from "@healthalyst/ui/components/hint-text";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import {
  PARTNER_FIELD_LIMITS,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CATEGORY_OPTIONS,
  type ServiceCategory,
} from "~/features/partner-network/config/partner-network";
import {
  usePartnerDirectoryQuery,
  usePartnershipRequestMutation,
} from "~/features/partner-network/hooks/use-partner-network";
import { partnershipRequestFormSchema } from "~/features/partner-network/schemas/partner-network-schemas";
import type {
  DirectoryEntry,
  PartnerScope,
  Partnership,
} from "~/features/partner-network/types/partner-network";
import {
  describeOrganizationPlace,
  describeState,
} from "~/features/partner-network/utilities/describe-partner";
import { nigerianStateOptions } from "~/shared/organization/config/organization-reference";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

const SEARCH_DELAY_MILLISECONDS = 300;

const DIRECTORY_COLUMNS: readonly DataTableColumn<DirectoryEntry>[] = [
  {
    key: "organisation",
    label: "Organisation",
    size: "wide",
    getCell: (entry) => ({
      kind: "text",
      primary: entry.name,
      secondary: describeOrganizationPlace(
        entry.type,
        [entry.city, describeState(entry.stateCode)]
          .filter(Boolean)
          .join(", ") || null
      ),
    }),
  },
  {
    key: "services",
    label: "Services",
    getCell: (entry) => ({
      kind: "text",
      primary: entry.categories
        .map((category) => SERVICE_CATEGORY_LABELS[category])
        .join(", "),
    }),
  },
];

/**
 * Searches organisations listed as accepting referrals, and requests a
 * partnership with one for a service.
 */
export function FindPartnerSheet({
  open,
  onOpenChange,
  scope,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: PartnerScope;
  onRequested: (partnership: Partnership) => void;
}) {
  const [category, setCategory] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<DirectoryEntry | null>(
    null
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const requestMutation = usePartnershipRequestMutation(scope);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setAppliedSearchText(searchText.trim()),
      SEARCH_DELAY_MILLISECONDS
    );
    return () => window.clearTimeout(timer);
  }, [searchText]);

  const searchIsTooShort =
    appliedSearchText.length > 0 &&
    appliedSearchText.length < PARTNER_FIELD_LIMITS.searchMinimumLength;
  const directoryQuery = usePartnerDirectoryQuery(
    scope,
    {
      category: (category || undefined) as ServiceCategory | undefined,
      stateCode: stateCode || undefined,
      searchText: searchIsTooShort ? undefined : appliedSearchText || undefined,
    },
    open
  );
  const entries = (directoryQuery.data ?? []).filter(
    (entry) => entry.organizationId !== scope.organizationId
  );
  const isFiltered = Boolean(category || stateCode || appliedSearchText);

  function openRequest(entry: DirectoryEntry) {
    requestMutation.reset();
    setFieldErrors({});
    setSelectedEntry(entry);
  }

  function closeRequest() {
    if (requestMutation.isPending) return;
    setSelectedEntry(null);
  }

  function handleRequestSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!selectedEntry) return;
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      partnershipRequestFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    requestMutation.mutate(
      { providerOrganizationId: selectedEntry.organizationId, ...result.data },
      {
        onSuccess: (partnership) => {
          setSelectedEntry(null);
          onOpenChange(false);
          onRequested(partnership);
        },
      }
    );
  }

  const serviceChoices = selectedEntry
    ? SERVICE_CATEGORY_OPTIONS.filter((option) =>
        selectedEntry.categories.includes(option.value)
      )
    : [];
  const preselectedService =
    category && serviceChoices.some((option) => option.value === category)
      ? category
      : serviceChoices.length === 1
        ? serviceChoices[0]?.value
        : undefined;

  return (
    <>
      <DetailSheet
        open={open}
        onOpenChange={onOpenChange}
        title="Find a partner"
        description="Organisations on HealthAlyst that accept referrals. Choose one to send a partnership request."
      >
        <div className="flex flex-col gap-4">
          <FilterBar
            accessibleLabel="Search the partner directory"
            identifier="partner-directory"
            search={{
              label: "Search by name",
              placeholder: "Organisation name",
              value: searchText,
              onValueChange: setSearchText,
            }}
            filters={[
              {
                key: "service",
                label: "Service",
                options: SERVICE_CATEGORY_OPTIONS,
                allOptionsLabel: "All services",
                value: category,
                onValueChange: setCategory,
              },
              {
                key: "state",
                label: "State",
                options: nigerianStateOptions,
                allOptionsLabel: "All states",
                value: stateCode,
                onValueChange: setStateCode,
              },
            ]}
          />
          {searchIsTooShort && (
            <HintText>
              Type at least {PARTNER_FIELD_LIMITS.searchMinimumLength}{" "}
              characters to search by name.
            </HintText>
          )}
          <DataTable
            accessibleLabel="Organisations that accept referrals"
            columns={DIRECTORY_COLUMNS}
            state={
              directoryQuery.isPending
                ? { status: "loading", label: "Searching the directory" }
                : directoryQuery.isError
                  ? {
                      status: "error",
                      title: "We could not search the directory",
                      description: directoryQuery.error.message,
                      retryLabel: "Try again",
                      onRetry: () => void directoryQuery.refetch(),
                    }
                  : { status: "ready", rows: entries }
            }
            getRowIdentifier={(entry) => entry.organizationId}
            rowAction={{
              label: (entry) => `Request a partnership with ${entry.name}`,
              onSelect: openRequest,
            }}
            emptyState={{
              illustration: <EmptySearchIllustration />,
              title: isFiltered
                ? "No organisations match"
                : "No organisations are listed yet",
              description: isFiltered
                ? "Try another name, service or state. You can also invite an organisation that is not on HealthAlyst."
                : "You can invite an organisation that is not on HealthAlyst.",
            }}
          />
        </div>
      </DetailSheet>

      <FormDialog
        // Remount for each organisation so the service choice starts fresh.
        key={selectedEntry?.organizationId ?? "none"}
        open={selectedEntry !== null}
        onOpenChange={(isOpen) => !isOpen && closeRequest()}
        title={`Request a partnership with ${selectedEntry?.name ?? ""}`}
        description="They review the request and accept the data-sharing agreement before you can send them work."
        submitLabel="Send request"
        submittingLabel="Sending request"
        isSubmitting={requestMutation.isPending}
        error={requestMutation.error?.message}
        onSubmit={handleRequestSubmit}
      >
        <SelectField
          id="partnership-request-serviceCategory"
          label="Service"
          name="serviceCategory"
          placeholder="Choose the service"
          options={serviceChoices}
          defaultValue={preselectedService}
          error={fieldErrors.serviceCategory}
        />
        <CheckboxField
          id="partnership-request-isPreferred"
          name="isPreferred"
          label="Make them a preferred partner for this service"
        />
        <TextField
          id="partnership-request-priority"
          label="Priority"
          description={`A number from ${PARTNER_FIELD_LIMITS.priorityMinimum} to ${PARTNER_FIELD_LIMITS.priorityMaximum}. Lower numbers are tried first.`}
          name="priority"
          type="number"
          inputMode="numeric"
          min={PARTNER_FIELD_LIMITS.priorityMinimum}
          max={PARTNER_FIELD_LIMITS.priorityMaximum}
          defaultValue={String(PARTNER_FIELD_LIMITS.priorityDefault)}
          error={fieldErrors.priority}
        />
      </FormDialog>
    </>
  );
}
