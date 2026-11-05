"use client";

import { useState, type FormEvent } from "react";
import {
  ORGANIZATION_LIFECYCLE_ACTIONS,
  type OrganizationLifecycleAction,
} from "~/features/organization-oversight/config/organization-lifecycle";
import { useOrganizationLifecycleMutation } from "~/features/organization-oversight/hooks/use-organization-oversight";
import { lifecycleReasonSchema } from "~/features/organization-oversight/schemas/organization-lifecycle-schemas";
import type {
  OrganizationDetail,
  RegistrationStatus,
} from "~/features/organization-oversight/types/organization-types";
import {
  isStepUpRequiredError,
  useStepUpVerification,
} from "~/features/staff-auth/hooks/use-step-up-verification";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

type PendingLifecycleChange = {
  action: OrganizationLifecycleAction;
  reason: string;
};

const LIFECYCLE_ACTION_ORDER: readonly OrganizationLifecycleAction[] = [
  "reinstate",
  "suspend",
  "deactivate",
];

/** The lifecycle actions this staff member can take from a status. */
export function getAvailableLifecycleActions(
  status: RegistrationStatus,
  platformRoles: readonly string[]
): OrganizationLifecycleAction[] {
  return LIFECYCLE_ACTION_ORDER.filter((action) => {
    const presentation = ORGANIZATION_LIFECYCLE_ACTIONS[action];
    return (
      presentation.fromStatuses.includes(status) &&
      presentation.roles.some((role) => platformRoles.includes(role))
    );
  });
}

/**
 * Suspends, reinstates or deactivates an approved organisation. Each change
 * needs a reason and, when the API asks, a fresh authenticator code.
 */
export function useOrganizationLifecycle({
  organizationId,
  status,
  detail,
  staffIdentity,
}: {
  organizationId: string;
  status: RegistrationStatus;
  detail: OrganizationDetail | undefined;
  staffIdentity: StaffIdentity;
}) {
  const lifecycleMutation = useOrganizationLifecycleMutation(staffIdentity);
  const stepUpVerification = useStepUpVerification();
  const [openAction, setOpenAction] =
    useState<OrganizationLifecycleAction | null>(null);
  const [reasonError, setReasonError] = useState("");
  const [changeAwaitingStepUp, setChangeAwaitingStepUp] =
    useState<PendingLifecycleChange | null>(null);
  const [completedAction, setCompletedAction] =
    useState<OrganizationLifecycleAction | null>(null);

  function openActionDialog(action: OrganizationLifecycleAction) {
    setReasonError("");
    lifecycleMutation.reset();
    setOpenAction(action);
  }

  function closeActionDialog() {
    if (lifecycleMutation.isPending) return;
    setOpenAction(null);
    setReasonError("");
  }

  function recordChange({ action, reason }: PendingLifecycleChange) {
    if (!detail) return;
    lifecycleMutation.mutate(
      { action, organizationId, reason, version: detail.version },
      {
        onSuccess: () => {
          setChangeAwaitingStepUp(null);
          stepUpVerification.reset();
          setOpenAction(null);
          setCompletedAction(action);
        },
        onError: (error) => {
          if (isStepUpRequiredError(error)) {
            stepUpVerification.reset();
            setChangeAwaitingStepUp({ action, reason });
            return;
          }
          // The action dialog shows any other failure.
          setChangeAwaitingStepUp(null);
        },
      }
    );
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!openAction || !detail) return;
    const formElement = formEvent.currentTarget;
    const result = lifecycleReasonSchema.safeParse({
      reason: new FormData(formElement).get("reason"),
    });
    if (!result.success) {
      setReasonError(result.error.issues[0]?.message ?? "Give a reason.");
      formElement.querySelector<HTMLElement>('[name="reason"]')?.focus();
      return;
    }
    setReasonError("");
    recordChange({ action: openAction, reason: result.data.reason });
  }

  /** Checks the code, then sends the refused change again. */
  async function confirmStepUp() {
    if (!changeAwaitingStepUp) return;
    if (await stepUpVerification.verify()) {
      recordChange(changeAwaitingStepUp);
    }
  }

  function cancelStepUp() {
    if (lifecycleMutation.isPending) return;
    setChangeAwaitingStepUp(null);
    stepUpVerification.reset();
    lifecycleMutation.reset();
  }

  const mutationError =
    lifecycleMutation.error && !isStepUpRequiredError(lifecycleMutation.error)
      ? lifecycleMutation.error.message
      : "";

  return {
    availableActions: getAvailableLifecycleActions(
      status,
      staffIdentity.platformRoles
    ),
    isReady: Boolean(detail),
    openAction,
    openActionDialog,
    closeActionDialog,
    handleSubmit,
    actionError: reasonError || mutationError,
    isSaving: lifecycleMutation.isPending,
    stepUpVerification,
    isAwaitingStepUp: changeAwaitingStepUp !== null,
    stepUpActionDescription: changeAwaitingStepUp
      ? ORGANIZATION_LIFECYCLE_ACTIONS[changeAwaitingStepUp.action]
          .stepUpDescription
      : "",
    confirmStepUp,
    cancelStepUp,
    completedConfirmation: completedAction
      ? ORGANIZATION_LIFECYCLE_ACTIONS[completedAction].confirmation
      : null,
    clearCompletedAction: () => setCompletedAction(null),
  };
}
