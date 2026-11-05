"use client";

import { useEffect, useState } from "react";
import { IntegrityCheckIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FilterBar } from "@healthalyst/ui/components/filter-bar";
import { HintText } from "@healthalyst/ui/components/hint-text";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { TextField } from "@healthalyst/ui/components/text-field";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { AuditEventSheet } from "~/features/audit-log/components/audit-event-sheet";
import {
  AUDIT_ACTOR_TYPE_LABELS,
  AUDIT_CHAIN_PROBLEM_LABELS,
  AUDIT_DATE_TIME_FORMATTER,
  AUDIT_LOG_LIMITS,
  AUDIT_LOG_ROLES,
  AUDIT_OUTCOME_PRESENTATION,
  PLATFORM_EVENTS_FILTER,
} from "~/features/audit-log/config/audit-log";
import {
  useAuditChainCheckQuery,
  useAuditEventsQuery,
} from "~/features/audit-log/hooks/use-audit-log";
import {
  auditFilterFormSchema,
  toAuditBoundary,
} from "~/features/audit-log/schemas/audit-log-schemas";
import type {
  AuditEvent,
  AuditSearch,
} from "~/features/audit-log/types/audit-log";
import {
  describeActor,
  describeOrganization,
} from "~/features/audit-log/utilities/describe-audit-event";
import { useOrganizationsQuery } from "~/features/organization-oversight/hooks/use-organization-oversight";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";
import { useStaffSession } from "~/infrastructure/auth/staff-session-provider";

const FILTER_DELAY_MILLISECONDS = 400;

const AUDIT_COLUMNS: readonly DataTableColumn<AuditEvent>[] = [
  {
    key: "when",
    label: "When",
    size: "compact",
    getCell: (auditEvent) => ({
      kind: "date",
      label: AUDIT_DATE_TIME_FORMATTER.format(new Date(auditEvent.occurredAt)),
      dateTime: auditEvent.occurredAt,
    }),
  },
  {
    key: "action",
    label: "Action",
    size: "wide",
    getCell: (auditEvent) => ({
      kind: "text",
      primary: auditEvent.action,
      secondary: auditEvent.resourceType,
    }),
  },
  {
    key: "actor",
    label: "Done by",
    getCell: (auditEvent) => ({
      kind: "text",
      primary: describeActor(auditEvent),
      // Without an actor, the kind of actor is already the primary text.
      secondary: auditEvent.actor
        ? (auditEvent.actor.email ??
          AUDIT_ACTOR_TYPE_LABELS[auditEvent.actorType])
        : undefined,
    }),
  },
  {
    key: "organization",
    label: "Organisation",
    getCell: (auditEvent) => ({
      kind: "text",
      primary: describeOrganization(auditEvent),
    }),
  },
  {
    key: "outcome",
    label: "Outcome",
    size: "compact",
    getCell: (auditEvent) => ({
      kind: "status",
      ...AUDIT_OUTCOME_PRESENTATION[auditEvent.outcome],
    }),
  },
];

export function AuditLogPage() {
  const { staffIdentity } = useStaffSession();
  if (!staffIdentity) return null;
  const canReadAuditLog = AUDIT_LOG_ROLES.some((role) =>
    staffIdentity.platformRoles.includes(role)
  );
  return (
    <>
      <div>
        <h1 className="font-serif text-title font-normal tracking-tight">
          Audit log
        </h1>
        <p className="mt-2 text-lede text-muted-foreground">
          Who did what, when and from where, newest first. Each search you run
          is recorded too.
        </p>
      </div>
      {canReadAuditLog ? (
        <AuditLog staffIdentity={staffIdentity} />
      ) : (
        <StateNotice
          tone="warning"
          title="Only super admins and auditors can read the audit log"
        >
          Ask a super admin if you need access.
        </StateNotice>
      )}
    </>
  );
}

function AuditLog({ staffIdentity }: { staffIdentity: StaffIdentity }) {
  const [organizationId, setOrganizationId] = useState("");
  const [actionText, setActionText] = useState("");
  const [fromDay, setFromDay] = useState("");
  const [toDay, setToDay] = useState("");
  const [actor, setActor] = useState<{ id: string; name: string } | null>(null);
  const [filterErrors, setFilterErrors] = useState<Record<string, string>>({});
  const [appliedSearch, setAppliedSearch] = useState<AuditSearch>({});
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [requestedCheck, setRequestedCheck] = useState<{
    organizationId?: string;
  } | null>(null);

  // Apply the filters once typing pauses, and only when they are valid.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const result = auditFilterFormSchema.safeParse({
        organizationId,
        actorUserId: actor?.id ?? "",
        action: actionText,
        fromDay,
        toDay,
      });
      if (!result.success) {
        const errors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          errors[String(issue.path[0])] ??= issue.message;
        }
        setFilterErrors(errors);
        return;
      }
      setFilterErrors({});
      const filters = result.data;
      setAppliedSearch({
        ...(filters.organizationId
          ? { organizationId: filters.organizationId }
          : {}),
        ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
        ...(filters.action ? { action: filters.action } : {}),
        ...(filters.fromDay
          ? { from: toAuditBoundary(filters.fromDay, "start") }
          : {}),
        ...(filters.toDay ? { to: toAuditBoundary(filters.toDay, "end") } : {}),
      });
    }, FILTER_DELAY_MILLISECONDS);
    return () => window.clearTimeout(timer);
  }, [organizationId, actionText, fromDay, toDay, actor]);

  const eventsQuery = useAuditEventsQuery(staffIdentity, appliedSearch, true);
  const auditEvents =
    eventsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  // Auditors may not be able to list organisations; then only the
  // "outside any organisation" choice is offered.
  const organizationsQuery = useOrganizationsQuery(staffIdentity, "");
  const organizationOptions = [
    { value: PLATFORM_EVENTS_FILTER, label: "Outside any organisation" },
    ...(organizationsQuery.data ?? [])
      .map((organization) => ({
        value: organization.id,
        label: organization.displayName || organization.legalName,
      }))
      .sort((first, second) => first.label.localeCompare(second.label)),
  ];
  const isFiltered = Object.keys(appliedSearch).length > 0;

  return (
    <>
      <section aria-label="Audit events" className="flex flex-col gap-4">
        <FilterBar
          accessibleLabel="Filter the audit log"
          identifier="audit-log"
          search={{
            label: "Action",
            placeholder: "For example organization.approved, or auth. for all",
            value: actionText,
            onValueChange: setActionText,
          }}
          filters={[
            {
              key: "organization",
              label: "Organisation",
              options: organizationOptions,
              allOptionsLabel: "All organisations",
              value: organizationId,
              onValueChange: setOrganizationId,
            },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
          <TextField
            id="audit-log-from"
            label="From"
            type="date"
            value={fromDay}
            onChange={(changeEvent) => setFromDay(changeEvent.target.value)}
            description={
              fromDay
                ? undefined
                : `Leave empty for the last ${AUDIT_LOG_LIMITS.defaultRangeDays} days.`
            }
            error={filterErrors.fromDay}
          />
          <TextField
            id="audit-log-to"
            label="To"
            type="date"
            value={toDay}
            onChange={(changeEvent) => setToDay(changeEvent.target.value)}
            error={filterErrors.toDay}
          />
        </div>
        {filterErrors.action && (
          <NoticeBanner tone="warning" title="Check the action filter">
            {filterErrors.action}
          </NoticeBanner>
        )}
        {actor && (
          <NoticeBanner
            tone="information"
            title={`Showing only what ${actor.name || "one person"} did`}
            action={
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setActor(null)}
              >
                Show everyone
              </ActionButton>
            }
          />
        )}

        <DataTable
          accessibleLabel="Audit events"
          columns={AUDIT_COLUMNS}
          state={
            eventsQuery.isPending
              ? { status: "loading", label: "Loading the audit log" }
              : eventsQuery.isError && auditEvents.length === 0
                ? {
                    status: "error",
                    title: "We could not load the audit log",
                    description: eventsQuery.error.message,
                    retryLabel: "Try again",
                    onRetry: () => void eventsQuery.refetch(),
                  }
                : { status: "ready", rows: auditEvents }
          }
          getRowIdentifier={(auditEvent) => auditEvent.id}
          rowAction={{
            label: (auditEvent) =>
              `Open ${auditEvent.action} by ${describeActor(auditEvent)}`,
            onSelect: setSelectedEvent,
          }}
          emptyState={{
            illustration: <EmptySearchIllustration />,
            title: isFiltered
              ? "No events match"
              : "No events in the last 30 days",
            description: isFiltered
              ? "Try another action, organisation or date range."
              : "Choose an earlier start date to look further back.",
          }}
        />
        {eventsQuery.hasNextPage && (
          <div className="flex justify-center">
            <ActionButton
              type="button"
              variant="outline"
              isLoading={eventsQuery.isFetchingNextPage}
              loadingText="Loading older events"
              onClick={() => void eventsQuery.fetchNextPage()}
            >
              Show older events
            </ActionButton>
          </div>
        )}
        {eventsQuery.isFetchNextPageError && (
          <NoticeBanner tone="error" title="We could not load older events">
            {eventsQuery.error?.message}
          </NoticeBanner>
        )}
      </section>

      <IntegrityCheck
        staffIdentity={staffIdentity}
        organizationId={organizationId || undefined}
        organizationName={
          organizationOptions.find((option) => option.value === organizationId)
            ?.label
        }
        requestedCheck={requestedCheck}
        onRequestCheck={setRequestedCheck}
      />

      <AuditEventSheet
        auditEvent={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onShowActorActivity={(eventActor) => {
          setActor({ id: eventActor.id, name: eventActor.name });
          setSelectedEvent(null);
        }}
      />
    </>
  );
}

function IntegrityCheck({
  staffIdentity,
  organizationId,
  organizationName,
  requestedCheck,
  onRequestCheck,
}: {
  staffIdentity: StaffIdentity;
  organizationId: string | undefined;
  organizationName: string | undefined;
  requestedCheck: { organizationId?: string } | null;
  onRequestCheck: (check: { organizationId?: string }) => void;
}) {
  const checkQuery = useAuditChainCheckQuery(staffIdentity, requestedCheck);
  const checksCurrentScope =
    requestedCheck !== null && requestedCheck.organizationId === organizationId;
  // A report for another organisation stays hidden until it is checked again.
  const report = checksCurrentScope ? checkQuery.data : undefined;
  const scopeLabel = organizationId
    ? (organizationName ?? "this organisation")
    : "every organisation";

  return (
    <section
      aria-labelledby="audit-integrity-heading"
      className="flex flex-col gap-4"
    >
      <SectionHeading
        headingIdentifier="audit-integrity-heading"
        heading="Integrity"
        description="Each event carries a fingerprint of the one before it. Checking recomputes them to show whether anything was edited or deleted."
      />
      <div>
        <ActionButton
          type="button"
          variant="outline"
          leadingIcon={<IntegrityCheckIcon />}
          isLoading={checksCurrentScope && checkQuery.isFetching}
          loadingText="Checking the audit log"
          onClick={() =>
            checksCurrentScope
              ? void checkQuery.refetch()
              : onRequestCheck({ organizationId })
          }
        >
          {organizationId
            ? `Check ${scopeLabel}'s events`
            : "Check the whole log"}
        </ActionButton>
        {!organizationId && (
          <HintText className="mt-2">
            Checking every organisation can take a while. Choose an organisation
            above to check only its events.
          </HintText>
        )}
      </div>

      {checksCurrentScope && checkQuery.isError ? (
        <StateNotice tone="error" title="We could not check the audit log">
          {checkQuery.error.message}
        </StateNotice>
      ) : report && !checkQuery.isFetching ? (
        report.intact ? (
          <StateNotice tone="success" title="The audit log is intact">
            Checked {report.rows} events in {report.chains}{" "}
            {report.chains === 1 ? "chain" : "chains"}. Nothing was edited or
            deleted.
          </StateNotice>
        ) : (
          <StateNotice
            tone="error"
            title={`The audit log has ${report.problems.length} ${report.problems.length === 1 ? "problem" : "problems"}`}
          >
            <ul className="flex flex-col gap-2">
              {report.problems.map((problem) => (
                <li
                  key={`${problem.chain}-${problem.problem}-${problem.eventId ?? "none"}`}
                >
                  <span className="font-medium">
                    {AUDIT_CHAIN_PROBLEM_LABELS[problem.problem]}
                  </span>{" "}
                  in chain {problem.chain}
                  {problem.eventId && `, event ${problem.eventId}`}.{" "}
                  {problem.detail}
                </li>
              ))}
            </ul>
          </StateNotice>
        )
      ) : null}
    </section>
  );
}
