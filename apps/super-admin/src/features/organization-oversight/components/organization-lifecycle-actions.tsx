"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { StepUpDialog } from "@healthalyst/ui/components/step-up-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import {
  ORGANIZATION_LIFECYCLE_ACTIONS,
  ORGANIZATION_LIFECYCLE_LIMITS,
} from "~/features/organization-oversight/config/organization-lifecycle";
import type { useOrganizationLifecycle } from "~/features/organization-oversight/hooks/use-organization-lifecycle";
import { STAFF_AUTHENTICATOR_CONFIGURATION } from "~/features/staff-auth/config/staff-sign-in";

const DESTRUCTIVE_OUTLINE_CLASS_NAME =
  "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive";

type LifecycleController = ReturnType<typeof useOrganizationLifecycle>;

/** Footer buttons for the lifecycle actions this staff member can take. */
export function OrganizationLifecycleButtons({
  lifecycle,
}: {
  lifecycle: LifecycleController;
}) {
  return (
    // Deactivation is permanent, so on wider screens it sits apart on the left.
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      {lifecycle.availableActions.map((action) => (
        <ActionButton
          key={action}
          type="button"
          variant={action === "reinstate" ? "default" : "outline"}
          className={
            action === "reinstate"
              ? "sm:ml-auto"
              : action === "deactivate"
                ? `${DESTRUCTIVE_OUTLINE_CLASS_NAME} sm:order-first sm:mr-auto`
                : `${DESTRUCTIVE_OUTLINE_CLASS_NAME} sm:ml-auto`
          }
          disabled={!lifecycle.isReady}
          onClick={() => lifecycle.openActionDialog(action)}
        >
          {ORGANIZATION_LIFECYCLE_ACTIONS[action].buttonLabel}
        </ActionButton>
      ))}
    </div>
  );
}

/**
 * The reason, step-up and confirmation dialogs. They stay mounted outside the
 * footer, so the confirmation still shows when no further action is left.
 */
export function OrganizationLifecycleDialogs({
  lifecycle,
}: {
  lifecycle: LifecycleController;
}) {
  const openPresentation = lifecycle.openAction
    ? ORGANIZATION_LIFECYCLE_ACTIONS[lifecycle.openAction]
    : null;

  return (
    <>
      <FormDialog
        open={openPresentation !== null}
        onOpenChange={(isOpen) => !isOpen && lifecycle.closeActionDialog()}
        title={openPresentation?.title ?? ""}
        description={openPresentation?.description}
        submitLabel={openPresentation?.submitLabel ?? ""}
        submittingLabel={openPresentation?.submittingLabel}
        tone={openPresentation?.tone}
        isSubmitting={lifecycle.isSaving}
        error={lifecycle.actionError}
        onSubmit={lifecycle.handleSubmit}
      >
        <TextAreaField
          id="lifecycle-reason"
          label={openPresentation?.reasonLabel ?? "Reason"}
          hint={openPresentation?.reasonDescription}
          name="reason"
          required
          rows={4}
          minLength={ORGANIZATION_LIFECYCLE_LIMITS.reasonMinimumLength}
          maxLength={ORGANIZATION_LIFECYCLE_LIMITS.reasonMaximumLength}
        />
      </FormDialog>

      <StepUpDialog
        open={lifecycle.isAwaitingStepUp}
        actionDescription={lifecycle.stepUpActionDescription}
        method={lifecycle.stepUpVerification.method}
        code={lifecycle.stepUpVerification.code}
        error={lifecycle.stepUpVerification.error}
        isVerifying={lifecycle.stepUpVerification.isVerifying}
        isCompletingAction={lifecycle.isSaving}
        completingLabel="Saving change"
        authenticatorCodeLength={STAFF_AUTHENTICATOR_CONFIGURATION.codeLength}
        recoveryCodeMaximumLength={
          STAFF_AUTHENTICATOR_CONFIGURATION.recoveryCodeMaximumLength
        }
        onCodeChange={lifecycle.stepUpVerification.updateCode}
        onMethodToggle={lifecycle.stepUpVerification.toggleMethod}
        onCancel={lifecycle.cancelStepUp}
        onSubmit={() => void lifecycle.confirmStepUp()}
      />

      {lifecycle.completedConfirmation && (
        <FeedbackDialog
          open
          onOpenChange={(isOpen) => !isOpen && lifecycle.clearCompletedAction()}
          tone="success"
          title={lifecycle.completedConfirmation.title}
          description={lifecycle.completedConfirmation.description}
          primaryAction={{
            label: "Done",
            onSelect: lifecycle.clearCompletedAction,
          }}
        />
      )}
    </>
  );
}
