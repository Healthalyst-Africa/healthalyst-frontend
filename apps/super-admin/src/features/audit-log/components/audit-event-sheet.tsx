"use client";

import type { ReactNode } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { HintText } from "@healthalyst/ui/components/hint-text";
import { SummaryDetailList } from "@healthalyst/ui/components/review-summary";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import {
  AUDIT_ACTOR_TYPE_LABELS,
  AUDIT_DATE_TIME_FORMATTER,
  AUDIT_OUTCOME_PRESENTATION,
} from "~/features/audit-log/config/audit-log";
import type { AuditEvent } from "~/features/audit-log/types/audit-log";
import {
  describeActor,
  describeMetadataValue,
  describeOrganization,
} from "~/features/audit-log/utilities/describe-audit-event";

function SheetSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-medium">{heading}</h3>
      {children}
    </section>
  );
}

export function AuditEventSheet({
  auditEvent,
  onClose,
  onShowActorActivity,
}: {
  auditEvent: AuditEvent | null;
  onClose: () => void;
  /** Narrows the log to everything this event's actor did. */
  onShowActorActivity: (actor: { id: string; name: string }) => void;
}) {
  const metadataEntries = auditEvent ? Object.entries(auditEvent.metadata) : [];
  const actor = auditEvent?.actor;

  return (
    <DetailSheet
      open={auditEvent !== null}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title={auditEvent?.action ?? ""}
      titleAccessory={
        auditEvent && (
          <StatusLabel
            tone={AUDIT_OUTCOME_PRESENTATION[auditEvent.outcome].tone}
          >
            {AUDIT_OUTCOME_PRESENTATION[auditEvent.outcome].label}
          </StatusLabel>
        )
      }
      description={
        auditEvent
          ? AUDIT_DATE_TIME_FORMATTER.format(new Date(auditEvent.occurredAt))
          : undefined
      }
      footer={
        actor ? (
          <ActionButton
            type="button"
            variant="outline"
            className="sm:ml-auto"
            onClick={() => onShowActorActivity(actor)}
          >
            Show everything {actor.name || "this person"} did
          </ActionButton>
        ) : undefined
      }
    >
      {auditEvent && (
        <div className="flex flex-col gap-8">
          <SheetSection heading="Who and where">
            <SummaryDetailList
              details={[
                { label: "Done by", value: describeActor(auditEvent) },
                { label: "Email", value: actor?.email },
                {
                  label: "Kind of actor",
                  value: AUDIT_ACTOR_TYPE_LABELS[auditEvent.actorType],
                },
                {
                  label: "Organisation",
                  value: describeOrganization(auditEvent),
                },
                { label: "IP address", value: auditEvent.ipAddress },
              ]}
              emptyValueLabel="Not recorded"
            />
          </SheetSection>
          <SheetSection heading="What changed">
            <SummaryDetailList
              details={[
                { label: "Action", value: auditEvent.action },
                { label: "Resource type", value: auditEvent.resourceType },
                { label: "Resource", value: auditEvent.resourceId },
                { label: "Request", value: auditEvent.requestId },
                { label: "Event", value: auditEvent.id },
              ]}
              emptyValueLabel="Not recorded"
            />
          </SheetSection>
          <SheetSection heading="Details recorded">
            {metadataEntries.length > 0 ? (
              <SummaryDetailList
                details={metadataEntries.map(([key, value]) => ({
                  label: key,
                  value: describeMetadataValue(value),
                }))}
              />
            ) : (
              <HintText>No further details were recorded.</HintText>
            )}
          </SheetSection>
        </div>
      )}
    </DetailSheet>
  );
}
