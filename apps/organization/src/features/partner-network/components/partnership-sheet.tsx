"use client";

import { useState, type FormEvent } from "react";
import { PreferredIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SummaryDetailList } from "@healthalyst/ui/components/review-summary";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import {
  ACCESS_LEVEL_LABELS,
  DATA_SHARING_AGREEMENT_VERSION,
  PARTNER_DATE_FORMATTER,
  PARTNER_FIELD_LIMITS,
  PARTNERSHIP_STATUS_PRESENTATION,
  SERVICE_CATEGORY_LABELS,
} from "~/features/partner-network/config/partner-network";
import {
  usePartnershipChangeMutation,
  usePartnershipPreferenceMutation,
} from "~/features/partner-network/hooks/use-partner-network";
import {
  partnershipAcceptanceFormSchema,
  partnershipPreferenceFormSchema,
  partnershipReasonFormSchema,
} from "~/features/partner-network/schemas/partner-network-schemas";
import type {
  PartnerScope,
  Partnership,
} from "~/features/partner-network/types/partner-network";
import {
  describeOrganizationType,
  describeState,
} from "~/features/partner-network/utilities/describe-partner";
import {
  getAvailablePartnershipActions,
  type AvailablePartnershipAction,
} from "~/features/partner-network/utilities/partnership-actions";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

const DESTRUCTIVE_OUTLINE_CLASS_NAME =
  "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive";

type ReasonAction = "decline" | "suspend" | "terminate" | "cancel-request";

type DialogPresentation = {
  title: (partnerName: string) => string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  tone: "default" | "destructive";
  confirmation: (partnerName: string) => { title: string; description: string };
};

const REASON_DIALOGS: Record<ReasonAction, DialogPresentation> = {
  decline: {
    title: (partnerName) => `Decline ${partnerName}'s request`,
    description: "They will see that you declined. They can ask again later.",
    submitLabel: "Decline request",
    submittingLabel: "Declining request",
    tone: "destructive",
    confirmation: (partnerName) => ({
      title: "Request declined",
      description: `${partnerName} cannot send you work for this service.`,
    }),
  },
  suspend: {
    title: (partnerName) => `Pause the partnership with ${partnerName}`,
    description:
      "No new orders can be sent while it is paused. Work already sent carries on.",
    submitLabel: "Pause partnership",
    submittingLabel: "Pausing partnership",
    tone: "destructive",
    confirmation: (partnerName) => ({
      title: "Partnership paused",
      description: `No new orders go between you and ${partnerName} until it is resumed.`,
    }),
  },
  terminate: {
    title: (partnerName) => `End the partnership with ${partnerName}`,
    description:
      "No new orders can be sent. Work already sent and results already returned are not affected. To work together again, send a new request.",
    submitLabel: "End partnership",
    submittingLabel: "Ending partnership",
    tone: "destructive",
    confirmation: (partnerName) => ({
      title: "Partnership ended",
      description: `You and ${partnerName} can no longer send new orders to each other for this service.`,
    }),
  },
  "cancel-request": {
    title: (partnerName) => `Withdraw your request to ${partnerName}`,
    description: "They will no longer be able to accept it.",
    submitLabel: "Withdraw request",
    submittingLabel: "Withdrawing request",
    tone: "destructive",
    confirmation: (partnerName) => ({
      title: "Request withdrawn",
      description: `${partnerName} can no longer accept it. You can send a new request later.`,
    }),
  },
};

const ACTION_BUTTON_LABELS: Record<AvailablePartnershipAction, string> = {
  accept: "Accept request",
  resume: "Resume partnership",
  decline: "Decline",
  suspend: "Pause",
  terminate: "End partnership",
  "cancel-request": "Withdraw request",
  "set-preference": "Change preference",
};

export function PartnershipSheet({
  partnership,
  scope,
  canManage,
  onClose,
}: {
  partnership: Partnership | null;
  scope: PartnerScope;
  canManage: boolean;
  onClose: () => void;
}) {
  const changeMutation = usePartnershipChangeMutation(scope);
  const preferenceMutation = usePartnershipPreferenceMutation(scope);
  const [openDialog, setOpenDialog] =
    useState<AvailablePartnershipAction | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const partnerName = partnership?.partner.name ?? "";
  const actions =
    partnership && canManage ? getAvailablePartnershipActions(partnership) : [];
  const isSaving = changeMutation.isPending || preferenceMutation.isPending;

  function openActionDialog(action: AvailablePartnershipAction) {
    changeMutation.reset();
    preferenceMutation.reset();
    setFieldErrors({});
    setOpenDialog(action);
  }

  function closeActionDialog() {
    if (isSaving) return;
    setOpenDialog(null);
  }

  function finish(nextConfirmation: { title: string; description: string }) {
    setOpenDialog(null);
    setConfirmation(nextConfirmation);
  }

  function handleAcceptSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!partnership) return;
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      partnershipAcceptanceFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    const isResuming = partnership.status === "SUSPENDED";
    changeMutation.mutate(
      { partnershipId: partnership.id, action: { kind: "accept" } },
      {
        onSuccess: () =>
          finish({
            title: isResuming ? "Partnership resumed" : "Partnership accepted",
            description: `${partnerName} can now send you ${SERVICE_CATEGORY_LABELS[partnership.serviceCategory].toLowerCase()} work through HealthAlyst.`,
          }),
      }
    );
  }

  function handleReasonSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!partnership || !openDialog || !(openDialog in REASON_DIALOGS)) return;
    const reasonAction = openDialog as ReasonAction;
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      partnershipReasonFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    changeMutation.mutate(
      {
        partnershipId: partnership.id,
        action: {
          kind: reasonAction === "cancel-request" ? "terminate" : reasonAction,
          reason: result.data.reason,
        },
      },
      {
        onSuccess: () =>
          finish(REASON_DIALOGS[reasonAction].confirmation(partnerName)),
      }
    );
  }

  function handlePreferenceSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!partnership) return;
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      partnershipPreferenceFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    preferenceMutation.mutate(
      { partnershipId: partnership.id, preference: result.data },
      {
        onSuccess: () =>
          finish({
            title: "Preference saved",
            description: result.data.isPreferred
              ? `${partnerName} is a preferred partner for this service.`
              : `Your preference for ${partnerName} was saved.`,
          }),
      }
    );
  }

  const reasonDialog =
    openDialog && openDialog in REASON_DIALOGS
      ? REASON_DIALOGS[openDialog as ReasonAction]
      : null;
  const statusPresentation = partnership
    ? PARTNERSHIP_STATUS_PRESENTATION[partnership.status]
    : null;

  return (
    <>
      <DetailSheet
        open={partnership !== null}
        onOpenChange={(isOpen) => !isOpen && onClose()}
        title={partnerName}
        titleAccessory={
          statusPresentation && (
            <StatusLabel tone={statusPresentation.tone}>
              {statusPresentation.label}
            </StatusLabel>
          )
        }
        description={
          partnership
            ? `${SERVICE_CATEGORY_LABELS[partnership.serviceCategory]}. ${
                partnership.direction === "OUTGOING"
                  ? "You send work to them."
                  : "They send work to you."
              }`
            : undefined
        }
        footer={
          actions.length > 0 ? (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              {actions.map((action) => {
                const isPrimary = action === "accept" || action === "resume";
                const isDestructive =
                  action === "decline" ||
                  action === "terminate" ||
                  action === "cancel-request" ||
                  action === "suspend";
                return (
                  <ActionButton
                    key={action}
                    type="button"
                    variant={isPrimary ? "default" : "outline"}
                    className={
                      isPrimary
                        ? "sm:order-last sm:ml-auto"
                        : isDestructive
                          ? DESTRUCTIVE_OUTLINE_CLASS_NAME
                          : undefined
                    }
                    leadingIcon={
                      action === "set-preference" ? (
                        <PreferredIcon />
                      ) : undefined
                    }
                    onClick={() => openActionDialog(action)}
                  >
                    {ACTION_BUTTON_LABELS[action]}
                  </ActionButton>
                );
              })}
            </div>
          ) : undefined
        }
      >
        {partnership && (
          <div className="flex flex-col gap-6">
            {partnership.direction === "INCOMING" &&
              partnership.status === "PENDING" && (
                <NoticeBanner
                  tone="information"
                  title={`${partnerName} wants to send you ${SERVICE_CATEGORY_LABELS[partnership.serviceCategory].toLowerCase()} work`}
                >
                  Accepting signs the data-sharing agreement for your
                  organisation.
                </NoticeBanner>
              )}
            <SummaryDetailList
              details={[
                {
                  label: "Type",
                  value: describeOrganizationType(partnership.partner.type),
                },
                {
                  label: "State",
                  value: describeState(partnership.partner.stateCode),
                },
                {
                  label: "Service",
                  value: SERVICE_CATEGORY_LABELS[partnership.serviceCategory],
                },
                {
                  label: "How you work together",
                  value: ACCESS_LEVEL_LABELS[partnership.accessLevel],
                },
                ...(partnership.direction === "OUTGOING"
                  ? [
                      {
                        label: "Preferred partner",
                        value: partnership.isPreferred ? "Yes" : "No",
                      },
                      {
                        label: "Priority",
                        value: `${partnership.priority} (lower numbers are tried first)`,
                      },
                    ]
                  : []),
                {
                  label: "Data-sharing agreement",
                  value:
                    partnership.dsaVersion && partnership.dsaAcceptedAt
                      ? `Version ${partnership.dsaVersion}, accepted ${PARTNER_DATE_FORMATTER.format(new Date(partnership.dsaAcceptedAt))}`
                      : "Not accepted yet",
                },
                {
                  label: "Requested",
                  value: PARTNER_DATE_FORMATTER.format(
                    new Date(partnership.createdAt)
                  ),
                },
                {
                  label: "Answered",
                  value: partnership.respondedAt
                    ? PARTNER_DATE_FORMATTER.format(
                        new Date(partnership.respondedAt)
                      )
                    : null,
                },
              ]}
              emptyValueLabel="Not recorded"
            />
          </div>
        )}
      </DetailSheet>

      <FormDialog
        open={openDialog === "accept" || openDialog === "resume"}
        onOpenChange={(isOpen) => !isOpen && closeActionDialog()}
        title={
          openDialog === "resume"
            ? `Resume the partnership with ${partnerName}`
            : `Accept ${partnerName}'s request`
        }
        description={`${partnerName} will be able to send your organisation ${
          partnership
            ? SERVICE_CATEGORY_LABELS[partnership.serviceCategory].toLowerCase()
            : ""
        } work through HealthAlyst.`}
        submitLabel={
          openDialog === "resume" ? "Resume partnership" : "Accept request"
        }
        submittingLabel={
          openDialog === "resume" ? "Resuming partnership" : "Accepting request"
        }
        isSubmitting={changeMutation.isPending}
        error={changeMutation.error?.message}
        onSubmit={handleAcceptSubmit}
      >
        <CheckboxField
          id="partnership-agreementAccepted"
          name="agreementAccepted"
          label={`On behalf of my organisation, I accept the HealthAlyst data-sharing agreement, version ${DATA_SHARING_AGREEMENT_VERSION}.`}
          error={fieldErrors.agreementAccepted}
        />
      </FormDialog>

      <FormDialog
        open={reasonDialog !== null}
        onOpenChange={(isOpen) => !isOpen && closeActionDialog()}
        title={reasonDialog?.title(partnerName) ?? ""}
        description={reasonDialog?.description}
        submitLabel={reasonDialog?.submitLabel ?? ""}
        submittingLabel={reasonDialog?.submittingLabel}
        tone={reasonDialog?.tone}
        isSubmitting={changeMutation.isPending}
        error={changeMutation.error?.message}
        onSubmit={handleReasonSubmit}
      >
        <TextAreaField
          id="partnership-reason"
          label="Reason"
          description={`Optional. ${partnerName || "Your partner"} may see it.`}
          name="reason"
          rows={3}
          maxLength={PARTNER_FIELD_LIMITS.reasonMaximumLength}
          error={fieldErrors.reason}
        />
      </FormDialog>

      {partnership && (
        <FormDialog
          // Remount for each partnership so the fields start from its values.
          key={`preference-${partnership.id}-${partnership.priority}-${partnership.isPreferred}`}
          open={openDialog === "set-preference"}
          onOpenChange={(isOpen) => !isOpen && closeActionDialog()}
          title={`Your preference for ${partnerName}`}
          description="When several partners offer the same service, preferred partners come first, then lower priority numbers."
          submitLabel="Save preference"
          submittingLabel="Saving preference"
          isSubmitting={preferenceMutation.isPending}
          error={preferenceMutation.error?.message}
          onSubmit={handlePreferenceSubmit}
        >
          <CheckboxField
            id="partnership-isPreferred"
            name="isPreferred"
            label="Preferred partner for this service"
            defaultChecked={partnership.isPreferred}
            error={fieldErrors.isPreferred}
          />
          <TextField
            id="partnership-priority"
            label="Priority"
            description={`A number from ${PARTNER_FIELD_LIMITS.priorityMinimum} to ${PARTNER_FIELD_LIMITS.priorityMaximum}. Lower numbers are tried first.`}
            name="priority"
            type="number"
            inputMode="numeric"
            min={PARTNER_FIELD_LIMITS.priorityMinimum}
            max={PARTNER_FIELD_LIMITS.priorityMaximum}
            defaultValue={String(partnership.priority)}
            error={fieldErrors.priority}
          />
        </FormDialog>
      )}

      {confirmation && (
        <FeedbackDialog
          open
          onOpenChange={(isOpen) => !isOpen && setConfirmation(null)}
          tone="success"
          title={confirmation.title}
          description={confirmation.description}
          primaryAction={{
            label: "Done",
            onSelect: () => setConfirmation(null),
          }}
        />
      )}
    </>
  );
}
