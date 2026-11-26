"use client";

import { useState } from "react";
import { AddIcon, SwitchOffIcon, SwitchOnIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FilterBar } from "@healthalyst/ui/components/filter-bar";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import { TestTubesIllustration } from "@healthalyst/ui/illustrations/test-tubes-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import {
  ORDER_KIND_LABELS,
  ORDER_PERMISSIONS,
  ORDER_TAGS,
  SPECIMEN_LABELS,
} from "~/features/orders/config/orders";
import {
  useCatalogueActions,
  useOrderCatalogue,
} from "~/features/orders/hooks/use-orders";
import type { OrderableService } from "~/features/orders/schemas/order-response-schemas";
import {
  describeTurnaround,
  filterCatalogue,
} from "~/features/orders/utilities/order-rules";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const KIND_FILTER_OPTIONS = [
  { value: "LAB", label: ORDER_KIND_LABELS.LAB },
  { value: "IMAGING", label: ORDER_KIND_LABELS.IMAGING },
];

const AVAILABILITY_FILTER_OPTIONS = [
  { value: "on", label: "Can be ordered" },
  { value: "off", label: "Switched off" },
];

const COLUMNS: readonly DataTableColumn<OrderableService>[] = [
  {
    key: "name",
    label: "Test or scan",
    size: "wide",
    getCell: (service) => ({
      kind: "text",
      primary: service.name,
      secondary: service.code,
    }),
  },
  {
    key: "kind",
    label: "Kind",
    getCell: (service) => ({
      kind: "text",
      primary: ORDER_KIND_LABELS[service.kind],
      secondary: service.specimen
        ? SPECIMEN_LABELS[service.specimen]
        : undefined,
    }),
  },
  {
    key: "turnaround",
    label: "Results",
    getCell: (service) => ({
      kind: "text",
      primary: describeTurnaround(service.turnaroundHours) ?? "Not set",
    }),
  },
  {
    key: "status",
    label: "Orderable",
    size: "compact",
    getCell: (service) =>
      service.isActive
        ? { kind: "status", ...ORDER_TAGS.orderable }
        : { kind: "status", ...ORDER_TAGS.notOrderable },
  },
];

/**
 * The tests and scans doctors can order here. Administrators start from the
 * backend's starter list and switch tests off that the facility does not
 * offer. Ranges and result fields are set by the laboratory later.
 */
export function TestsAndScansPage() {
  const { permissions } = useWorkspace();
  const canRead = permissions.includes(ORDER_PERMISSIONS.readCatalogue);
  const canManage = permissions.includes(ORDER_PERMISSIONS.manageCatalogue);
  const catalogueQuery = useOrderCatalogue(true, canRead);
  const actions = useCatalogueActions();
  const catalogue = catalogueQuery.data ?? [];
  const [searchText, setSearchText] = useState("");
  const [kind, setKind] = useState("");
  const [availability, setAvailability] = useState("");
  const isFiltered =
    searchText.trim() !== "" || kind !== "" || availability !== "";
  const shownServices = filterCatalogue(catalogue, {
    searchText,
    kind,
    availability,
  });

  function addStarterTests() {
    actions.addStarter.mutate(undefined, {
      onSuccess: (services) =>
        announceSuccess(
          `${services.length} tests and scans are in the catalogue`
        ),
    });
  }

  const addStarterButton = canManage && (
    <ActionButton
      type="button"
      leadingIcon={<AddIcon className="size-4" />}
      isLoading={actions.addStarter.isPending}
      loadingText="Adding"
      onClick={addStarterTests}
    >
      Add the starter tests
    </ActionButton>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="font-serif text-title font-normal tracking-tight">
            Tests and scans
          </h1>
          <p className="text-body text-muted-foreground">
            What doctors can order here. The starter list has about 20 common
            lab tests and 4 scans; the laboratory sets reference ranges for its
            own methods. Switch off anything this facility does not offer.
          </p>
        </div>
        {canRead && catalogue.length > 0 && addStarterButton}
      </div>
      {!canRead ? (
        <StateNotice tone="information" title="Your role cannot see patients">
          <p>
            The tests and scans are shown to people who can see patients. Ask an
            organisation administrator if you need access.
          </p>
        </StateNotice>
      ) : (
        <div className="flex flex-col gap-4">
          {(actions.addStarter.isError || actions.setActive.isError) && (
            <NoticeBanner tone="error" title="That was not saved">
              {actions.addStarter.error?.message ??
                actions.setActive.error?.message}
            </NoticeBanner>
          )}
          {catalogue.length > 0 && (
            <FilterBar
              accessibleLabel="Filter tests and scans"
              identifier="catalogue-filters"
              search={{
                label: "Search tests and scans",
                placeholder: "Name or code, such as FBC",
                value: searchText,
                onValueChange: setSearchText,
              }}
              filters={[
                {
                  key: "kind",
                  label: "Kind",
                  options: KIND_FILTER_OPTIONS,
                  allOptionsLabel: "Lab and imaging",
                  value: kind,
                  onValueChange: setKind,
                },
                {
                  key: "availability",
                  label: "Orderable",
                  options: AVAILABILITY_FILTER_OPTIONS,
                  allOptionsLabel: "On and off",
                  value: availability,
                  onValueChange: setAvailability,
                },
              ]}
            />
          )}
          {isFiltered && catalogue.length > 0 && (
            <p role="status" className="text-sm text-muted-foreground">
              Showing {shownServices.length} of {catalogue.length}
            </p>
          )}
          <DataTable
            accessibleLabel="Tests and scans"
            columns={COLUMNS}
            maximumVisibleRows={10}
            state={
              catalogueQuery.isPending
                ? { status: "loading", label: "Loading the tests and scans" }
                : catalogueQuery.isError
                  ? {
                      status: "error",
                      title: "We could not load the tests and scans",
                      description: catalogueQuery.error.message,
                      retryLabel: "Try again",
                      onRetry: () => void catalogueQuery.refetch(),
                    }
                  : { status: "ready", rows: shownServices }
            }
            getRowIdentifier={(service) => service.id}
            getRowActions={(service) =>
              canManage
                ? [
                    service.isActive
                      ? {
                          label: "Switch off",
                          icon: <SwitchOffIcon />,
                          isPending:
                            actions.setActive.isPending &&
                            actions.setActive.variables.service.id ===
                              service.id,
                          pendingLabel: "Saving",
                          onSelect: () =>
                            actions.setActive.mutate(
                              { service, isActive: false },
                              {
                                onSuccess: () =>
                                  announceSuccess(
                                    `${service.name} can no longer be ordered`
                                  ),
                              }
                            ),
                        }
                      : {
                          label: "Switch on",
                          icon: <SwitchOnIcon />,
                          isPending:
                            actions.setActive.isPending &&
                            actions.setActive.variables.service.id ===
                              service.id,
                          pendingLabel: "Saving",
                          onSelect: () =>
                            actions.setActive.mutate(
                              { service, isActive: true },
                              {
                                onSuccess: () =>
                                  announceSuccess(
                                    `${service.name} can be ordered again`
                                  ),
                              }
                            ),
                        },
                  ]
                : []
            }
            getRowActionsLabel={(service) => `Actions for ${service.name}`}
            emptyState={
              isFiltered && catalogue.length > 0
                ? {
                    illustration: <EmptySearchIllustration />,
                    title: "No tests or scans match",
                    description:
                      "Try another name or code, or clear the filters.",
                  }
                : {
                    illustration: <TestTubesIllustration />,
                    title: "No tests or scans yet",
                    description: canManage
                      ? "Start with the common tests and scans, then switch off any this facility does not offer."
                      : "Ask an administrator to add the tests and scans this facility offers.",
                    action: addStarterButton || undefined,
                  }
            }
          />
        </div>
      )}
    </div>
  );
}
