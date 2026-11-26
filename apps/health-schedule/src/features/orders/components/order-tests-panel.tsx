"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddIcon, DeleteIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SearchField } from "@healthalyst/ui/components/search-field";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { TestTubesIllustration } from "@healthalyst/ui/illustrations/test-tubes-illustration";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import { ResultSheet } from "~/features/orders/components/result-sheet";
import {
  COMMON_ORDER_CODES,
  ORDER_KIND_LABELS,
  ORDER_LIMITS,
  ORDER_PERMISSIONS,
  ORDER_PRIORITY_OPTIONS,
  ORDER_TAGS,
  RECENT_RESULT_DAYS,
} from "~/features/orders/config/orders";
import {
  useOrderActions,
  useOrderCatalogue,
  usePatientOrders,
} from "~/features/orders/hooks/use-orders";
import {
  orderFormSchema,
  type OrderFormValues,
} from "~/features/orders/schemas/order-form-schemas";
import type {
  Order,
  OrderableService,
} from "~/features/orders/schemas/order-response-schemas";
import {
  describeOrderStatus,
  describeResultFlags,
  describeTurnaround,
  findCommonServices,
  findOpenOrders,
  findRecentResults,
  searchCatalogue,
  toCreateOrdersRequest,
} from "~/features/orders/utilities/order-rules";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { describeBranchShortDate } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const EMPTY_ORDER: OrderFormValues = {
  serviceIds: [],
  priority: "ROUTINE",
  indication: "",
};

function describeService(service: OrderableService): string {
  return [
    service.code,
    ORDER_KIND_LABELS[service.kind],
    describeTurnaround(service.turnaroundHours),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** What the doctor should know before ordering a test again. */
function EarlierOrderNote({
  recentResult,
  openOrder,
  onOpenResult,
}: {
  recentResult: Order | undefined;
  openOrder: Order | undefined;
  onOpenResult: (order: Order) => void;
}) {
  if (openOrder) {
    return (
      <p className="text-caption text-status-warning">
        Already ordered {describeBranchShortDate(openOrder.orderedAt)},{" "}
        {openOrder.status === "ORDERED"
          ? "waiting to be done"
          : describeOrderStatus(openOrder).label.toLowerCase()}
        .
      </p>
    );
  }
  if (recentResult?.result?.releasedAt) {
    return (
      <p className="text-caption text-status-warning">
        Result from {describeBranchShortDate(recentResult.result.releasedAt)}:{" "}
        {describeResultFlags(recentResult).label.toLowerCase()}.{" "}
        <ActionButton
          type="button"
          variant="link"
          size="unstyled"
          className="text-caption"
          onClick={() => onOpenResult(recentResult)}
        >
          View result
        </ActionButton>
      </p>
    );
  }
  return null;
}

/**
 * Orders tests and scans from the consultation: search the facility's
 * catalogue or tap a common test, check earlier results so nothing is
 * repeated by accident, then send them together with one priority and the
 * clinical question.
 */
export function OrderTestsPanel({
  patientId,
  visitId,
}: {
  patientId: string;
  visitId?: string;
}) {
  const { permissions } = useWorkspace();
  const canManageCatalogue = permissions.includes(
    ORDER_PERMISSIONS.manageCatalogue
  );
  const catalogueQuery = useOrderCatalogue(false);
  const ordersQuery = usePatientOrders(patientId);
  const { create } = useOrderActions();
  const [searchText, setSearchText] = useState("");
  const [openResult, setOpenResult] = useState<Order | null>(null);
  // One identifier per group of orders, so a retried send never orders twice.
  const groupIdentifierReference = useRef<string>(crypto.randomUUID());
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: EMPTY_ORDER,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const chosenServiceIds = useWatch({
    control: form.control,
    name: "serviceIds",
  });
  const priority = useWatch({ control: form.control, name: "priority" });
  const indication = useWatch({ control: form.control, name: "indication" });

  // Anything changed after a failed send is a new group of orders.
  useEffect(() => {
    if (!create.isPending)
      groupIdentifierReference.current = crypto.randomUUID();
    // Only when what would be sent changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenServiceIds, priority, indication]);

  const catalogue = catalogueQuery.data ?? [];
  const chosenServices = chosenServiceIds.flatMap((serviceId) => {
    const service = catalogue.find((candidate) => candidate.id === serviceId);
    return service ? [service] : [];
  });
  const searchResults = searchCatalogue(
    catalogue,
    searchText,
    chosenServiceIds
  );
  const commonServices = findCommonServices(
    catalogue,
    COMMON_ORDER_CODES
  ).filter((service) => !chosenServiceIds.includes(service.id));
  const recentResults = findRecentResults(ordersQuery.data ?? [], new Date());
  const openOrders = findOpenOrders(ordersQuery.data ?? []);

  function addService(service: OrderableService) {
    if (chosenServiceIds.length >= ORDER_LIMITS.itemsPerOrder) return;
    form.setValue("serviceIds", [...chosenServiceIds, service.id], {
      shouldValidate: form.formState.isSubmitted,
    });
    setSearchText("");
  }

  function removeService(serviceId: string) {
    form.setValue(
      "serviceIds",
      chosenServiceIds.filter((chosenId) => chosenId !== serviceId),
      { shouldValidate: form.formState.isSubmitted }
    );
  }

  const submit = form.handleSubmit(
    (values) =>
      create.mutate(
        {
          patientId,
          request: toCreateOrdersRequest({
            values,
            groupId: groupIdentifierReference.current,
            visitId,
          }),
        },
        {
          onSuccess: (orders) => {
            announceSuccess(
              orders.length === 1
                ? `${orders[0]?.serviceName ?? "Order"} sent`
                : `${orders.length} orders sent`
            );
            form.reset(EMPTY_ORDER);
            groupIdentifierReference.current = crypto.randomUUID();
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, [
              "serviceIds",
              "priority",
              "indication",
            ]),
        }
      ),
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        serviceIds: "order-search",
        priority: "order-priority",
        indication: "order-indication",
      })
  );

  if (catalogueQuery.isPending) {
    return (
      <ContentPanel heading="Order tests and scans" headingLevel={2}>
        <LoadingPlaceholder
          label="Loading the tests and scans"
          rows={[{ shape: "text" }, { shape: "text" }]}
        />
      </ContentPanel>
    );
  }

  if (catalogueQuery.isError) {
    return (
      <ContentPanel heading="Order tests and scans" headingLevel={2}>
        <StateNotice
          tone="error"
          title="We could not load the tests and scans"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void catalogueQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          <p>{catalogueQuery.error.message}</p>
        </StateNotice>
      </ContentPanel>
    );
  }

  if (catalogue.length === 0) {
    return (
      <ContentPanel heading="Order tests and scans" headingLevel={2}>
        <StateNotice
          tone="information"
          title="No tests or scans are set up yet"
          illustration={<TestTubesIllustration />}
          action={
            canManageCatalogue && (
              <Link
                href={HEALTH_SCHEDULE_ROUTES.scheduleTestsAndScans}
                className="text-sm font-medium text-primary underline underline-offset-4"
              >
                Set up tests and scans
              </Link>
            )
          }
        >
          <p>
            {canManageCatalogue
              ? "Add the tests and scans this facility offers, then order them here."
              : "Ask an administrator to add the tests and scans this facility offers, under Setup."}
          </p>
        </StateNotice>
      </ContentPanel>
    );
  }

  return (
    <ContentPanel
      heading="Order tests and scans"
      headingLevel={2}
      description="Search what this facility offers, or tap a common test. Tests sent together share one priority and clinical question."
    >
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(formEvent) => void submit(formEvent)}
      >
        <div className="flex flex-col gap-3">
          <label htmlFor="order-search" className="text-sm font-medium">
            Find a test or scan
          </label>
          <SearchField
            id="order-search"
            value={searchText}
            onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
            placeholder="Name or code, such as FBC or chest X-ray"
            autoComplete="off"
            aria-invalid={Boolean(errors.serviceIds)}
            aria-describedby={
              errors.serviceIds ? "order-search-error" : undefined
            }
          />
          {errors.serviceIds && (
            <p
              id="order-search-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.serviceIds.message}
            </p>
          )}
          {searchText.trim() !== "" && (
            <div role="status" aria-live="polite">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing matches “{searchText.trim()}”. Try the test&apos;s
                  code or another word.
                </p>
              ) : (
                <ul
                  aria-label="Matching tests and scans"
                  className="flex flex-col divide-y rounded-lg border"
                >
                  {searchResults.map((service) => (
                    <li
                      key={service.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium">
                          {service.name}
                        </span>
                        <span className="text-caption text-muted-foreground">
                          {describeService(service)}
                        </span>
                      </span>
                      <ActionButton
                        type="button"
                        variant="outline"
                        size="compact"
                        leadingIcon={<AddIcon />}
                        onClick={() => addService(service)}
                      >
                        Add
                        <span className="sr-only">{` ${service.name}`}</span>
                      </ActionButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {commonServices.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption text-muted-foreground">
                Common:
              </span>
              {commonServices.map((service) => (
                <ActionButton
                  key={service.id}
                  type="button"
                  variant="outline"
                  size="compact"
                  leadingIcon={<AddIcon />}
                  onClick={() => addService(service)}
                >
                  {service.name}
                </ActionButton>
              ))}
            </div>
          )}
        </div>

        {chosenServices.length > 0 && (
          <section
            aria-labelledby="order-basket-heading"
            className="flex flex-col gap-2"
          >
            <h3 id="order-basket-heading" className="text-sm font-semibold">
              In this order ({chosenServices.length})
            </h3>
            <ul className="flex flex-col divide-y rounded-lg border">
              {chosenServices.map((service) => (
                <li
                  key={service.id}
                  className="flex items-start justify-between gap-3 px-3 py-2"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {service.name}
                      {openOrders.has(service.id) ? (
                        <StatusLabel {...ORDER_TAGS.alreadyOrdered} />
                      ) : (
                        recentResults.has(service.id) && (
                          <StatusLabel {...ORDER_TAGS.doneRecently} />
                        )
                      )}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {describeService(service)}
                    </span>
                    <EarlierOrderNote
                      recentResult={recentResults.get(service.id)}
                      openOrder={openOrders.get(service.id)}
                      onOpenResult={setOpenResult}
                    />
                  </span>
                  <ActionButton
                    type="button"
                    variant="ghost"
                    size="compact"
                    leadingIcon={<DeleteIcon />}
                    onClick={() => removeService(service.id)}
                  >
                    Remove
                    <span className="sr-only">{` ${service.name}`}</span>
                  </ActionButton>
                </li>
              ))}
            </ul>
            {ordersQuery.isError && (
              <NoticeBanner
                tone="warning"
                title="Earlier results could not be checked"
              >
                We could not load this patient&apos;s earlier tests, so repeats
                within {RECENT_RESULT_DAYS} days are not flagged.
              </NoticeBanner>
            )}
          </section>
        )}

        <Controller
          control={form.control}
          name="priority"
          render={({ field }) => (
            <ChoiceCardGroup
              id="order-priority"
              legend="Priority"
              required
              options={ORDER_PRIORITY_OPTIONS}
              value={field.value}
              onValueChange={(value) =>
                field.onChange(
                  value === "STAT" || value === "URGENT" ? value : "ROUTINE"
                )
              }
              error={errors.priority?.message}
            />
          )}
        />
        <TextAreaField
          id="order-indication"
          label="Clinical question"
          description="What the lab or radiologist should look for, such as “fever 3 days, cough: pneumonia?”."
          rows={2}
          maxLength={ORDER_LIMITS.indication}
          error={errors.indication?.message}
          {...form.register("indication")}
        />
        {create.isError && Object.keys(errors).length === 0 && (
          <NoticeBanner tone="error" title="The orders were not sent">
            {create.error.message}
          </NoticeBanner>
        )}
        <ActionButton
          type="submit"
          className="w-fit"
          isLoading={create.isPending}
          loadingText="Sending"
        >
          {chosenServices.length > 1
            ? `Send ${chosenServices.length} orders`
            : "Send order"}
        </ActionButton>
      </form>
      <ResultSheet
        order={openResult}
        canAcknowledge
        onOpenChange={(open) => {
          if (!open) setOpenResult(null);
        }}
      />
    </ContentPanel>
  );
}
