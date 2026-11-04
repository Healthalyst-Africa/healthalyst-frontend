"use client";

import { useState } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { RecoveryCodesPanel } from "@healthalyst/ui/components/recovery-codes-panel";
import { isStepUpRequiredError } from "~/features/account-security/hooks/use-step-up-protection";
import {
  RECOVERY_CODES_FILE_HEADING,
  RECOVERY_CODES_FILE_NAME,
} from "~/features/authentication/config/authenticator-enrolment";
import { useRegenerateRecoveryCodesMutation } from "~/features/authentication/hooks/use-platform-authentication";

export function RecoveryCodesSection({
  runProtected,
}: {
  runProtected: (action: {
    description: string;
    run: () => Promise<unknown>;
  }) => Promise<boolean>;
}) {
  const recoveryCodesMutation = useRegenerateRecoveryCodesMutation();
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [hasSavedCodes, setHasSavedCodes] = useState(false);
  const error =
    recoveryCodesMutation.error &&
    !isStepUpRequiredError(recoveryCodesMutation.error)
      ? recoveryCodesMutation.error.message
      : "";

  function createRecoveryCodes() {
    setIsConfirmationOpen(false);
    void runProtected({
      description: "create new recovery codes",
      run: () =>
        recoveryCodesMutation.mutateAsync(undefined, {
          onSuccess: (newRecoveryCodes) => {
            setHasSavedCodes(false);
            setRecoveryCodes(newRecoveryCodes);
          },
        }),
    });
  }

  function finishSavingCodes() {
    setRecoveryCodes([]);
    setHasSavedCodes(false);
    recoveryCodesMutation.reset();
  }

  return (
    <ContentPanel
      heading="Recovery codes"
      description="If you cannot use your authenticator app, a recovery code signs you in once."
      spacing="compact"
    >
      {recoveryCodes.length > 0 ? (
        <div className="flex max-w-md flex-col gap-5">
          <RecoveryCodesPanel
            recoveryCodes={recoveryCodes}
            downloadFileName={RECOVERY_CODES_FILE_NAME}
            downloadHeading={RECOVERY_CODES_FILE_HEADING}
            confirmationIdentifier="new-recovery-codes-saved"
            hasSavedCodes={hasSavedCodes}
            onHasSavedCodesChange={setHasSavedCodes}
            continueLabel="Done"
            onContinue={finishSavingCodes}
          />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <p className="text-body text-muted-foreground">
            Create a new set if you have used most of your codes or think
            someone else has seen them. Your old codes stop working straight
            away.
          </p>
          {error && (
            <NoticeBanner tone="error" title="New codes were not created">
              {error}
            </NoticeBanner>
          )}
          <ActionButton
            type="button"
            variant="outline"
            isLoading={recoveryCodesMutation.isPending}
            loadingText="Creating codes"
            onClick={() => {
              recoveryCodesMutation.reset();
              setIsConfirmationOpen(true);
            }}
          >
            Create new recovery codes
          </ActionButton>
        </div>
      )}

      <FeedbackDialog
        open={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
        tone="warning"
        title="Create new recovery codes?"
        description="Your current recovery codes will stop working. Save the new ones before you leave this page."
        primaryAction={{
          label: "Create new codes",
          onSelect: createRecoveryCodes,
        }}
        secondaryAction={{
          label: "Cancel",
          onSelect: () => setIsConfirmationOpen(false),
        }}
      />
    </ContentPanel>
  );
}
