"use client";

import { useState } from "react";
import { CopyIcon, DownloadIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { RecoveryKeyIllustration } from "@healthalyst/ui/illustrations/recovery-key-illustration";

type RecoveryCodesPanelProperties = {
  recoveryCodes: readonly string[];
  /** Name of the text file the codes download as. */
  downloadFileName: string;
  /** First line of that file, such as the service the codes belong to. */
  downloadHeading: string;
  /** Identifier for the "I have saved my recovery codes" checkbox. */
  confirmationIdentifier: string;
  hasSavedCodes: boolean;
  onHasSavedCodesChange: (hasSavedCodes: boolean) => void;
  continueLabel: string;
  onContinue: () => void;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadTextFile(fileName: string, content: string): void {
  const fileAddress = URL.createObjectURL(
    new Blob([content], { type: "text/plain" })
  );
  const downloadLink = document.createElement("a");
  downloadLink.href = fileAddress;
  downloadLink.download = fileName;
  downloadLink.click();
  URL.revokeObjectURL(fileAddress);
}

/**
 * One-time recovery codes after setting up an authenticator: a reminder that
 * they show once, the codes, ways to save them, and a confirmation before
 * continuing.
 */
export function RecoveryCodesPanel({
  recoveryCodes,
  downloadFileName,
  downloadHeading,
  confirmationIdentifier,
  hasSavedCodes,
  onHasSavedCodesChange,
  continueLabel,
  onContinue,
}: RecoveryCodesPanelProperties) {
  const [saveStatus, setSaveStatus] = useState("");

  function downloadRecoveryCodes() {
    downloadTextFile(
      downloadFileName,
      `${downloadHeading}\nEach code signs in once when your authenticator app is unavailable.\n\n${recoveryCodes.join("\n")}\n`
    );
    setSaveStatus(`Downloaded ${downloadFileName}.`);
  }

  async function copyRecoveryCodes() {
    setSaveStatus(
      (await copyText(recoveryCodes.join("\n")))
        ? "Recovery codes copied."
        : "Copying is not available here. Download the codes instead."
    );
  }

  return (
    <>
      <StateNotice
        tone="information"
        illustration={<RecoveryKeyIllustration />}
        title="You will only see these once"
      >
        <p>
          Each code works one time. Keep them somewhere safe and away from your
          phone, such as a password manager.
        </p>
      </StateNotice>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption text-muted-foreground">
            {recoveryCodes.length} recovery codes
          </p>
          <div className="-mr-2 flex items-center sm:-mr-1">
            <ActionButton
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 text-primary sm:size-9"
              aria-label="Download recovery codes"
              title="Download recovery codes"
              onClick={downloadRecoveryCodes}
            >
              <DownloadIcon aria-hidden="true" className="size-5" />
            </ActionButton>
            <ActionButton
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 text-primary sm:size-9"
              aria-label="Copy recovery codes"
              title="Copy recovery codes"
              onClick={copyRecoveryCodes}
            >
              <CopyIcon aria-hidden="true" className="size-5" />
            </ActionButton>
          </div>
        </div>
        <ul
          aria-label="Recovery codes"
          className="grid h-48 grid-cols-1 gap-1.5 overflow-y-auto overscroll-contain pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          tabIndex={0}
        >
          {recoveryCodes.map((recoveryCode) => (
            <li
              key={recoveryCode}
              className="rounded-md bg-secondary px-3 py-1.5 text-center text-caption tabular-nums tracking-[0.04em]"
            >
              {recoveryCode}
            </li>
          ))}
        </ul>
        <p aria-live="polite" className="text-caption text-muted-foreground">
          {saveStatus}
        </p>
      </div>
      <CheckboxField
        id={confirmationIdentifier}
        className="border-t border-border pt-5"
        label="I have saved my recovery codes somewhere safe."
        checked={hasSavedCodes}
        onCheckedChange={onHasSavedCodesChange}
      />
      <ActionButton
        className="w-full"
        size="large"
        type="button"
        disabled={!hasSavedCodes}
        onClick={onContinue}
      >
        {continueLabel}
      </ActionButton>
    </>
  );
}

export type { RecoveryCodesPanelProperties };
